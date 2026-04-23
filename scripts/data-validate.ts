import { readFileSync } from "node:fs";
import path from "node:path";
import { RAW_STATES } from "../src/data/raw/states.raw";
import { validateRawState } from "../src/lib/validators/stateValidator";

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
  }
} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`  FAIL  freshness: ${msg}`);
  failures++;
}

const passed = slugs.length - failures;
console.log("");
console.log(`Validation complete: ${slugs.length} states checked`);
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failures}`);

process.exit(failures > 0 ? 1 : 0);
