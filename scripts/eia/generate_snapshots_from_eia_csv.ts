import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type ParsedRow = {
  period: string;
  stateid: string;
  sectorid: string;
  price: number;
};

type MonthlyRate = { ym: string; avgRateCentsPerKwh: number };
type StateHistory = {
  stateSlug: string;
  series: MonthlyRate[];
  updated: string;
  sourceName?: string;
  sourceUrl?: string;
};

type SnapshotState = {
  slug: string;
  rate: number;
  updated: string;
};

type Snapshot = {
  version: string;
  releasedAt: string;
  states: SnapshotState[];
};

const INPUT_CSV_PATH = path.join(
  process.cwd(),
  "data",
  "normalized",
  "eia",
  "retail_res_monthly_2000_present.csv",
);
const OUTPUT_HISTORY_GENERATED_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "history.generated.ts",
);
const OUTPUT_HISTORY_GENERATED_JSON_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "history.generated.json",
);
const OUTPUT_SNAPSHOT_V1_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "snapshots",
  "v1.json",
);
const OUTPUT_SNAPSHOT_V2_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "snapshots",
  "v2.json",
);
const OUTPUT_SNAPSHOT_LATEST_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "snapshots",
  "latest.json",
);
const OUTPUT_RAW_STATES_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "raw",
  "states.raw.ts",
);

const HISTORY_SOURCE_NAME = "U.S. Energy Information Administration (EIA)";
const HISTORY_SOURCE_URL = "https://api.eia.gov/v2/electricity/retail-sales/data/";
// Public-facing EIA state page (used on state pages as the human-readable source URL).
const RAW_STATES_SOURCE_URL = "https://www.eia.gov/electricity/data/state/";
const RAW_STATES_METHODOLOGY =
  "Average residential electricity price in cents per kWh from the U.S. Energy Information Administration (EIA) Form EIA-861M retail sales dataset. Values are used as a reference benchmark for comparison and estimation.";
const RAW_STATES_DISCLAIMER =
  "Estimates are energy-only and exclude delivery fees, taxes, fixed charges, and other utility fees.";

// Display names used when regenerating `src/data/raw/states.raw.ts` so the
// generator does not need to import the file it is rewriting.
const POSTAL_TO_NAME: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

// Keep output compatible with current site slugs and 50-state assumptions.
const POSTAL_TO_SLUG: Record<string, string> = {
  AL: "alabama",
  AK: "alaska",
  AZ: "arizona",
  AR: "arkansas",
  CA: "california",
  CO: "colorado",
  CT: "connecticut",
  DE: "delaware",
  FL: "florida",
  GA: "georgia",
  HI: "hawaii",
  ID: "idaho",
  IL: "illinois",
  IN: "indiana",
  IA: "iowa",
  KS: "kansas",
  KY: "kentucky",
  LA: "louisiana",
  ME: "maine",
  MD: "maryland",
  MA: "massachusetts",
  MI: "michigan",
  MN: "minnesota",
  MS: "mississippi",
  MO: "missouri",
  MT: "montana",
  NE: "nebraska",
  NV: "nevada",
  NH: "new-hampshire",
  NJ: "new-jersey",
  NM: "new-mexico",
  NY: "new-york",
  NC: "north-carolina",
  ND: "north-dakota",
  OH: "ohio",
  OK: "oklahoma",
  OR: "oregon",
  PA: "pennsylvania",
  RI: "rhode-island",
  SC: "south-carolina",
  SD: "south-dakota",
  TN: "tennessee",
  TX: "texas",
  UT: "utah",
  VT: "vermont",
  VA: "virginia",
  WA: "washington",
  WV: "west-virginia",
  WI: "wisconsin",
  WY: "wyoming",
};

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out;
}

function parseCsv(csvText: string): ParsedRow[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    throw new Error("EIA CSV is empty or missing data rows.");
  }

  const header = parseCsvLine(lines[0]);
  const indexByName = new Map(header.map((name, i) => [name, i]));
  const required = ["period", "stateid", "sectorid", "price"] as const;
  for (const col of required) {
    if (!indexByName.has(col)) {
      throw new Error(`EIA CSV missing required column: ${col}`);
    }
  }

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    const period = cols[indexByName.get("period") ?? -1]?.trim() ?? "";
    const stateid = cols[indexByName.get("stateid") ?? -1]?.trim().toUpperCase() ?? "";
    const sectorid = cols[indexByName.get("sectorid") ?? -1]?.trim() ?? "";
    const priceRaw = cols[indexByName.get("price") ?? -1]?.trim() ?? "";
    const price = Number(priceRaw);

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) continue;
    if (!/^[A-Z]{2}$/.test(stateid)) continue; // keeps 2-letter IDs, drops regions (ENC, NEW, MTN, etc.)
    if (sectorid !== "RES") continue;
    if (!Number.isFinite(price) || price < 0) continue;

    rows.push({ period, stateid, sectorid, price });
  }

  rows.sort((a, b) => {
    if (a.period !== b.period) return a.period.localeCompare(b.period);
    return a.stateid.localeCompare(b.stateid);
  });
  return rows;
}

function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

function toMonthYear(period: string): string {
  const [year, month] = period.split("-").map(Number);
  const dt = new Date(Date.UTC(year, month - 1, 1));
  return dt.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function periodToReleaseDate(period: string): string {
  return `${period}-15`;
}

function groupRowsByState(rows: ParsedRow[]): Map<string, Map<string, number>> {
  const byState = new Map<string, Map<string, number>>();
  for (const row of rows) {
    let byPeriod = byState.get(row.stateid);
    if (!byPeriod) {
      byPeriod = new Map<string, number>();
      byState.set(row.stateid, byPeriod);
    }
    byPeriod.set(row.period, roundToCents(row.price));
  }
  return byState;
}

function buildHistory(byStatePostal: Map<string, Map<string, number>>): StateHistory[] {
  const output: StateHistory[] = [];
  const postals = Object.keys(POSTAL_TO_SLUG).sort((a, b) => a.localeCompare(b));

  for (const postal of postals) {
    const slug = POSTAL_TO_SLUG[postal];
    const byPeriod = byStatePostal.get(postal);
    if (!byPeriod) continue;

    const periods = Array.from(byPeriod.keys())
      .filter((p) => p >= "2000-01")
      .sort((a, b) => a.localeCompare(b));
    if (periods.length === 0) continue;

    const series: MonthlyRate[] = periods.map((period) => ({
      ym: period,
      avgRateCentsPerKwh: byPeriod.get(period) as number,
    }));

    output.push({
      stateSlug: slug,
      series,
      updated: toMonthYear(periods[periods.length - 1]),
      sourceName: HISTORY_SOURCE_NAME,
      sourceUrl: HISTORY_SOURCE_URL,
    });
  }

  output.sort((a, b) => a.stateSlug.localeCompare(b.stateSlug));
  return output;
}

function getCompletePeriods(byStatePostal: Map<string, Map<string, number>>): string[] {
  const allPeriods = new Set<string>();
  for (const byPeriod of byStatePostal.values()) {
    for (const period of byPeriod.keys()) {
      if (period >= "2000-01") allPeriods.add(period);
    }
  }

  const postals = Object.keys(POSTAL_TO_SLUG);
  return Array.from(allPeriods)
    .sort((a, b) => a.localeCompare(b))
    .filter((period) =>
      postals.every((postal) => {
        const byPeriod = byStatePostal.get(postal);
        return byPeriod?.has(period);
      }),
    );
}

function buildSnapshot(
  version: string,
  period: string,
  byStatePostal: Map<string, Map<string, number>>,
): Snapshot {
  const states: SnapshotState[] = Object.entries(POSTAL_TO_SLUG)
    .map(([postal, slug]) => {
      const rate = byStatePostal.get(postal)?.get(period);
      if (rate === undefined) return null;
      return {
        slug,
        rate,
        updated: toMonthYear(period),
      };
    })
    .filter((row): row is SnapshotState => row !== null)
    .sort((a, b) => a.slug.localeCompare(b.slug));

  return {
    version,
    releasedAt: periodToReleaseDate(period),
    states,
  };
}

function buildRawStatesTs(
  latestPeriod: string,
  byStatePostal: Map<string, Map<string, number>>,
): string {
  const header = `import type { StateRecord } from "@/data/types";

// GENERATED FILE — do not edit by hand.
// Written by scripts/eia/generate_snapshots_from_eia_csv.ts from the canonical
// EIA residential retail-sales CSV. Rates and "updated" labels reflect the
// latest complete EIA monthly period in the dataset.
const COMMON_STATE_METADATA = {
  sourceName: "U.S. Energy Information Administration (EIA)",
  sourceUrl: ${JSON.stringify(RAW_STATES_SOURCE_URL)},
  methodology:
    ${JSON.stringify(RAW_STATES_METHODOLOGY)},
  disclaimer:
    ${JSON.stringify(RAW_STATES_DISCLAIMER)},
} as const;

export const RAW_STATES: Record<string, StateRecord> = {
`;

  const updatedLabel = toMonthYear(latestPeriod);
  const postals = Object.keys(POSTAL_TO_SLUG).sort((a, b) => {
    const nameA = POSTAL_TO_NAME[a] ?? a;
    const nameB = POSTAL_TO_NAME[b] ?? b;
    return nameA.localeCompare(nameB);
  });

  const lines: string[] = [];
  for (const postal of postals) {
    const slug = POSTAL_TO_SLUG[postal];
    const name = POSTAL_TO_NAME[postal];
    if (!name) {
      throw new Error(`Missing display name for postal ${postal}`);
    }
    const rate = byStatePostal.get(postal)?.get(latestPeriod);
    if (rate === undefined) {
      throw new Error(
        `EIA CSV missing rate for ${postal} at latest period ${latestPeriod}; cannot regenerate RAW_STATES.`,
      );
    }
    const key = /^[a-z]+$/.test(slug) ? slug : JSON.stringify(slug);
    lines.push(
      `  ${key}: { slug: "${slug}", name: "${name}", postal: "${postal}", avgRateCentsPerKwh: ${rate}, updated: "${updatedLabel}", ...COMMON_STATE_METADATA },`,
    );
  }

  return `${header}${lines.join("\n")}\n};\n`;
}

function buildHistoryGeneratedTs(history: StateHistory[]): string {
  const historyJson = JSON.stringify(history, null, 2);
  return `export type MonthlyRate = { ym: string; avgRateCentsPerKwh: number };

export type StateHistory = {
  stateSlug: string;
  series: MonthlyRate[];
  updated: string;
  sourceName?: string;
  sourceUrl?: string;
};

export const HISTORY: StateHistory[] = ${historyJson};

export const HISTORY_BY_STATE: Record<string, StateHistory> = Object.fromEntries(
  HISTORY.map((entry) => [entry.stateSlug, entry])
) as Record<string, StateHistory>;
`;
}

async function main(): Promise<void> {
  const csvText = await readFile(INPUT_CSV_PATH, "utf8");
  const rows = parseCsv(csvText);
  const byStatePostal = groupRowsByState(rows);
  const history = buildHistory(byStatePostal);

  if (history.length === 0) {
    throw new Error("No state history records were generated from EIA CSV.");
  }

  const completePeriods = getCompletePeriods(byStatePostal);
  if (completePeriods.length < 2) {
    throw new Error("Need at least two complete monthly periods to build v1/v2 snapshots.");
  }

  const v1Period = completePeriods[completePeriods.length - 2];
  const v2Period = completePeriods[completePeriods.length - 1];
  const v1Snapshot = buildSnapshot("v1", v1Period, byStatePostal);
  const v2Snapshot = buildSnapshot("v2", v2Period, byStatePostal);
  // `latest.json` mirrors v2 but carries a period-based version token so
  // `getCurrentSnapshot()` in `src/lib/snapshotLoader.ts` reflects the most
  // recent EIA period on state-page-adjacent surfaces. The releasedAt is the
  // same date as v2; stable sort in snapshotLoader keeps `latest` last on tie.
  const latestVersion = `v${v2Period.replace("-", "")}15`;
  const latestSnapshot: Snapshot = {
    ...buildSnapshot(latestVersion, v2Period, byStatePostal),
  };

  await writeFile(
    OUTPUT_HISTORY_GENERATED_PATH,
    `${buildHistoryGeneratedTs(history)}`,
    "utf8",
  );
  await writeFile(
    OUTPUT_HISTORY_GENERATED_JSON_PATH,
    `${JSON.stringify(history, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    OUTPUT_SNAPSHOT_V1_PATH,
    `${JSON.stringify(v1Snapshot, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    OUTPUT_SNAPSHOT_V2_PATH,
    `${JSON.stringify(v2Snapshot, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    OUTPUT_SNAPSHOT_LATEST_PATH,
    `${JSON.stringify(latestSnapshot, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    OUTPUT_RAW_STATES_PATH,
    buildRawStatesTs(v2Period, byStatePostal),
    "utf8",
  );

  const months = history[0]?.series.length ?? 0;
  console.log(`states=${history.length}`);
  console.log(`months=${months}`);
  console.log(`latest_period=${v2Period}`);
  console.log(`snapshot_periods=v1:${v1Period}, v2:${v2Period}, latest:${latestVersion}`);
  console.log(`wrote=${OUTPUT_HISTORY_GENERATED_PATH}`);
  console.log(`wrote=${OUTPUT_HISTORY_GENERATED_JSON_PATH}`);
  console.log(`wrote=${OUTPUT_SNAPSHOT_V1_PATH}`);
  console.log(`wrote=${OUTPUT_SNAPSHOT_V2_PATH}`);
  console.log(`wrote=${OUTPUT_SNAPSHOT_LATEST_PATH}`);
  console.log(`wrote=${OUTPUT_RAW_STATES_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
