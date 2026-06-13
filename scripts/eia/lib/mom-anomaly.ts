import { readFileSync, existsSync } from "node:fs";

// The 51 jurisdictions POE ships (50 states + DC), keyed by EIA 2-letter
// stateid. Restricting to this set drops EIA regional aggregates (US, ENC,
// NEW, MTN, etc.) so the detector only sees real per-state series.
export const KNOWN_POSTALS: ReadonlySet<string> = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DC", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA",
  "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY",
  "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX",
  "UT", "VT", "VA", "WA", "WV", "WI", "WY",
]);

export const PERIOD_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export type SeriesByState = Map<string, Map<string, number>>;

export type AllowlistEntry = {
  reason?: string;
  addedBy?: string;
  addedAt?: string;
};

export type Allowlist = Map<string, AllowlistEntry>;

export type MomMove = {
  stateid: string;
  fromPeriod: string;
  toPeriod: string;
  fromPrice: number;
  toPrice: number;
  deltaPct: number;
};

export type DetectResult = {
  latestPeriod: string | null;
  anomalies: MomMove[];
  allowed: MomMove[];
};

/** Parse a single CSV line, honoring double-quote escaping. */
export function parseCsvLine(line: string): string[] {
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

/**
 * Parse the canonical EIA residential CSV into a nested map keyed by
 * stateid -> period -> price. Applies the same row filters the snapshot
 * generator uses so the detector sees exactly the rows that ship.
 */
export function parseCsvSeries(csvText: string): SeriesByState {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    throw new Error("EIA CSV is empty or missing data rows.");
  }

  const header = parseCsvLine(lines[0]);
  const idx = new Map(header.map((name, i) => [name, i]));
  for (const col of ["period", "stateid", "sectorid", "price"] as const) {
    if (!idx.has(col)) {
      throw new Error(`EIA CSV missing required column: ${col}`);
    }
  }

  const byState: SeriesByState = new Map();
  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    const period = cols[idx.get("period") ?? -1]?.trim() ?? "";
    const stateid = cols[idx.get("stateid") ?? -1]?.trim().toUpperCase() ?? "";
    const sectorid = cols[idx.get("sectorid") ?? -1]?.trim() ?? "";
    const price = Number(cols[idx.get("price") ?? -1]?.trim() ?? "");

    if (!PERIOD_REGEX.test(period)) continue;
    if (!KNOWN_POSTALS.has(stateid)) continue;
    if (sectorid !== "RES") continue;
    if (!Number.isFinite(price) || price < 0) continue;

    let byPeriod = byState.get(stateid);
    if (!byPeriod) {
      byPeriod = new Map<string, number>();
      byState.set(stateid, byPeriod);
    }
    byPeriod.set(period, price);
  }
  return byState;
}

/** Load + parse the CSV from disk. */
export function loadCsvSeries(csvPath: string): SeriesByState {
  const csvText = readFileSync(csvPath, "utf8");
  return parseCsvSeries(csvText);
}

/**
 * Load the anomaly allowlist. Missing file is treated as an empty allowlist
 * so the detector works before the file exists. Keys are "period|stateid".
 */
export function loadAllowlist(allowlistPath: string): Allowlist {
  const out: Allowlist = new Map();
  if (!existsSync(allowlistPath)) return out;
  const raw = readFileSync(allowlistPath, "utf8");
  const parsed = JSON.parse(raw) as { entries?: Record<string, AllowlistEntry> };
  const entries = parsed.entries ?? {};
  for (const [key, value] of Object.entries(entries)) {
    out.set(key, value ?? {});
  }
  return out;
}

export type DetectOptions = {
  seriesByState: SeriesByState;
  threshold: number;
  window: number;
  allowlist?: Allowlist;
};

/**
 * Detect month-over-month anomalies. For each state, examines the last
 * `window` consecutive present periods and flags any transition whose
 * absolute percentage change exceeds `threshold`. A move is downgraded to
 * `allowed` when the allowlist contains its destination key "period|stateid".
 */
export function detectMomAnomalies(options: DetectOptions): DetectResult {
  const { seriesByState, threshold, window, allowlist } = options;
  const anomalies: MomMove[] = [];
  const allowed: MomMove[] = [];
  let latestPeriod: string | null = null;

  const stateids = Array.from(seriesByState.keys()).sort();
  for (const stateid of stateids) {
    const byPeriod = seriesByState.get(stateid);
    if (!byPeriod) continue;
    const periods = Array.from(byPeriod.keys()).sort();
    if (periods.length === 0) continue;

    const lastPeriod = periods[periods.length - 1];
    if (latestPeriod === null || lastPeriod > latestPeriod) {
      latestPeriod = lastPeriod;
    }

    // Compare each of the last `window` transitions (window+1 periods).
    const tail = periods.slice(-(window + 1));
    for (let i = 1; i < tail.length; i += 1) {
      const fromPeriod = tail[i - 1];
      const toPeriod = tail[i];
      const fromPrice = byPeriod.get(fromPeriod);
      const toPrice = byPeriod.get(toPeriod);
      if (fromPrice === undefined || toPrice === undefined) continue;
      if (fromPrice === 0) continue;

      const deltaPct = ((toPrice - fromPrice) / fromPrice) * 100;
      if (Math.abs(deltaPct) <= threshold) continue;

      const move: MomMove = { stateid, fromPeriod, toPeriod, fromPrice, toPrice, deltaPct };
      const key = `${toPeriod}|${stateid}`;
      if (allowlist?.has(key)) {
        allowed.push(move);
      } else {
        anomalies.push(move);
      }
    }
  }

  anomalies.sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct));
  allowed.sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct));
  return { latestPeriod, anomalies, allowed };
}

export function formatMove(move: MomMove): string {
  const sign = move.deltaPct >= 0 ? "+" : "";
  return `${move.stateid} ${move.fromPeriod}->${move.toPeriod}  ${move.fromPrice} -> ${move.toPrice}  (${sign}${move.deltaPct.toFixed(1)}%)`;
}
