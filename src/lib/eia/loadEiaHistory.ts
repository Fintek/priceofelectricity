import { readFile } from "node:fs/promises";
import path from "node:path";

const EIA_CSV_PATH = path.join(
  process.cwd(),
  "data",
  "normalized",
  "eia",
  "retail_res_monthly_2000_present.csv"
);

const POSTAL_TO_SLUG: Record<string, string> = {
  AL: "alabama",
  AK: "alaska",
  AZ: "arizona",
  AR: "arkansas",
  CA: "california",
  CO: "colorado",
  CT: "connecticut",
  DC: "district-of-columbia",
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

export type StateHistory = {
  periods: string[];
  values: number[];
};

export type EiaHistoryResult = {
  historyAvailable: boolean;
  byState?: Map<string, StateHistory>;
  firstPeriod?: string;
  lastPeriod?: string;
};

let cached: EiaHistoryResult | null = null;

export async function loadEiaHistory(): Promise<EiaHistoryResult> {
  if (cached) return cached;
  try {
    const raw = await readFile(EIA_CSV_PATH, "utf8");
    const lines = raw.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      cached = { historyAvailable: false };
      return cached;
    }

    const header = lines[0].split(",").map((c) => c.trim().toLowerCase());
    const periodIdx = header.indexOf("period");
    const stateIdx = header.indexOf("stateid");
    const priceIdx = header.indexOf("price");
    const sectorIdx = header.indexOf("sectorid");
    if (periodIdx < 0 || stateIdx < 0 || priceIdx < 0) {
      cached = { historyAvailable: false };
      return cached;
    }

    const byState = new Map<string, { periods: string[]; values: number[] }>();

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim());
      const period = cols[periodIdx] ?? "";
      const stateid = (cols[stateIdx] ?? "").toUpperCase();
      const sectorid = sectorIdx >= 0 ? cols[sectorIdx] ?? "" : "RES";
      const price = Number(cols[priceIdx] ?? "");
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) continue;
      if (!/^[A-Z]{2}$/.test(stateid) || !POSTAL_TO_SLUG[stateid]) continue;
      if (sectorid !== "RES") continue;
      if (!Number.isFinite(price) || price < 0) continue;

      const slug = POSTAL_TO_SLUG[stateid];
      let entry = byState.get(slug);
      if (!entry) {
        entry = { periods: [], values: [] };
        byState.set(slug, entry);
      }
      entry.periods.push(period);
      entry.values.push(Math.round(price * 100) / 100);
    }

    const periods = new Set<string>();
    for (const e of byState.values()) {
      for (const p of e.periods) periods.add(p);
    }
    const sortedPeriods = Array.from(periods).sort();
    const firstPeriod = sortedPeriods[0];
    const lastPeriod = sortedPeriods[sortedPeriods.length - 1];

    cached = {
      historyAvailable: byState.size >= 10 && sortedPeriods.length >= 24,
      byState,
      firstPeriod,
      lastPeriod,
    };
    return cached;
  } catch {
    cached = { historyAvailable: false };
    return cached;
  }
}

export async function getStateHistory(slug: string): Promise<StateHistory | null> {
  const result = await loadEiaHistory();
  if (!result.byState) return null;
  const entry = result.byState.get(slug);
  if (!entry) return null;
  const sorted = entry.periods
    .map((p, i) => ({ period: p, value: entry.values[i] }))
    .sort((a, b) => a.period.localeCompare(b.period));
  return {
    periods: sorted.map((s) => s.period),
    values: sorted.map((s) => s.value),
  };
}
