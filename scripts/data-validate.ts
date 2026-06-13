import { readFileSync } from "node:fs";
import path from "node:path";
import { RAW_STATES, EIA_RESIDENTIAL_RETAIL_PRICE_DATA_META } from "../src/data/raw/states.raw";
import { validateRawState } from "../src/lib/validators/stateValidator";
import {
  loadCsvSeries,
  loadAllowlist,
  detectMomAnomalies,
  formatMove,
} from "./eia/lib/mom-anomaly";
import { loadCorrections } from "./eia/lib/corrections";

const MOM_THRESHOLD = 25;
const MOM_WINDOW = 6;

const slugs = Object.keys(RAW_STATES).sort();
let failures = 0;

for (const slug of slugs) {
  try {
    validateRawState(slug, RAW_STATES[slug]);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  FAIL  ${slug}: ${msg}`);
    failures++;
  }
}

// Freshness propagation guard: the latest EIA history period must match the
// snapshot exposed by `snapshotLoader.getCurrentSnapshot()` (via latest.json)
// and the "updated" label baked into RAW_STATES. This catches silent breakage
// between the CSV → history → snapshot → RAW_STATES layers.
type HistoryEntry = {
  stateSlug: string;
  series: { ym: string; avgRateCentsPerKwh: number }[];
  updated: string;
};
type SnapshotFile = { version: string; releasedAt: string; states: { updated: string }[] };

function monthYear(period: string): string {
  const [year, month] = period.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

try {
  const historyPath = path.join(process.cwd(), "src", "data", "history.generated.json");
  const latestSnapshotPath = path.join(process.cwd(), "src", "data", "snapshots", "latest.json");
  const v2SnapshotPath = path.join(process.cwd(), "src", "data", "snapshots", "v2.json");

  const history = JSON.parse(readFileSync(historyPath, "utf8")) as HistoryEntry[];
  const latestSnapshot = JSON.parse(readFileSync(latestSnapshotPath, "utf8")) as SnapshotFile;
  const v2Snapshot = JSON.parse(readFileSync(v2SnapshotPath, "utf8")) as SnapshotFile;

  const latestHistoryPeriods = new Set<string>();
  for (const entry of history) {
    const last = entry.series.at(-1);
    if (last) latestHistoryPeriods.add(last.ym);
  }
  if (latestHistoryPeriods.size !== 1) {
    console.error(
      `  FAIL  freshness: history last-period mismatch across states (${[...latestHistoryPeriods].join(", ")})`,
    );
    failures++;
  }
  const historyPeriod = [...latestHistoryPeriods][0];
  const expectedUpdated = historyPeriod ? monthYear(historyPeriod) : null;

  if (expectedUpdated) {
    if (latestSnapshot.releasedAt !== `${historyPeriod}-15`) {
      console.error(
        `  FAIL  freshness: latest.json releasedAt=${latestSnapshot.releasedAt} but history latest=${historyPeriod}-15`,
      );
      failures++;
    }
    if (v2Snapshot.releasedAt !== `${historyPeriod}-15`) {
      console.error(
        `  FAIL  freshness: v2.json releasedAt=${v2Snapshot.releasedAt} but history latest=${historyPeriod}-15`,
      );
      failures++;
    }
    const mismatchedUpdated = Object.entries(RAW_STATES).filter(
      ([, s]) => s.updated !== expectedUpdated,
    );
    if (mismatchedUpdated.length > 0) {
      const sample = mismatchedUpdated.slice(0, 3).map(([slug, s]) => `${slug}=${s.updated}`);
      console.error(
        `  FAIL  freshness: RAW_STATES.updated expected "${expectedUpdated}" but ${mismatchedUpdated.length} state(s) differ (e.g. ${sample.join(", ")})`,
      );
      failures++;
    }

    if (EIA_RESIDENTIAL_RETAIL_PRICE_DATA_META.dataThroughYm !== historyPeriod) {
      console.error(
        `  FAIL  freshness: EIA_RESIDENTIAL_RETAIL_PRICE_DATA_META.dataThroughYm=${EIA_RESIDENTIAL_RETAIL_PRICE_DATA_META.dataThroughYm} but history latest=${historyPeriod}`,
      );
      failures++;
    }
    const syncMs = Date.parse(EIA_RESIDENTIAL_RETAIL_PRICE_DATA_META.pipelineSynchronizedAtIso);
    if (Number.isNaN(syncMs)) {
      console.error(
        `  FAIL  freshness: EIA_RESIDENTIAL_RETAIL_PRICE_DATA_META.pipelineSynchronizedAtIso is not parseable`,
      );
      failures++;
    }
  }
} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`  FAIL  freshness: ${msg}`);
  failures++;
}

// Static month-over-month anomaly check over the committed normalized CSV.
// Mirrors the refresh-time guard (scripts/eia/check-mom-anomaly.ts) so a
// committed unexplained jump fails verify locally and in CI, not just during
// the monthly job. Read-only: never mutates the CSV.
try {
  const csvPath = path.join(
    process.cwd(),
    "data",
    "normalized",
    "eia",
    "retail_res_monthly_2000_present.csv",
  );
  const allowlistPath = path.join(process.cwd(), "data", "eia", "anomaly-allowlist.json");
  const correctionsPath = path.join(process.cwd(), "data", "eia", "corrections.json");

  const seriesByState = loadCsvSeries(csvPath);
  const allowlist = loadAllowlist(allowlistPath);
  const momResult = detectMomAnomalies({
    seriesByState,
    threshold: MOM_THRESHOLD,
    window: MOM_WINDOW,
    allowlist,
  });
  for (const move of momResult.anomalies) {
    console.error(`  FAIL  mom-anomaly: ${formatMove(move)} exceeds ${MOM_THRESHOLD}% (not allowlisted)`);
    failures++;
  }

  // Corrections consistency (read-only): every active correction must already
  // be reflected in the committed CSV. This ties data/eia/corrections.json to
  // the committed data without ever rewriting it; the mutating applier only
  // runs in the refresh pipeline.
  const corrections = loadCorrections(correctionsPath);
  for (const [key, entry] of corrections.entries()) {
    const [period, stateid] = key.split("|");
    const committed = seriesByState.get(stateid ?? "")?.get(period ?? "");
    if (committed === undefined) {
      console.error(`  FAIL  correction ${key}: no matching row in committed CSV`);
      failures++;
    } else if (committed !== entry.value) {
      console.error(
        `  FAIL  correction ${key}: committed CSV has ${committed} but correction pins ${entry.value}`,
      );
      failures++;
    }
  }
} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`  FAIL  mom-anomaly/corrections: ${msg}`);
  failures++;
}

const passed = slugs.length - failures;
console.log("");
console.log(`Validation complete: ${slugs.length} states checked`);
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failures}`);

process.exit(failures > 0 ? 1 : 0);
