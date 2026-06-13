import { readFileSync, existsSync } from "node:fs";
import { parseCsvLine } from "./mom-anomaly";

export type CorrectionEntry = {
  value: number;
  reason?: string;
  source?: string;
  addedAt?: string;
  removeWhen?: string;
};

export type Corrections = Map<string, CorrectionEntry>;

export type AppliedCorrection = { key: string; from: number; to: number };
export type StaleCorrection = { key: string; rawValue: number; pinnedValue: number };

export type ApplyResult = {
  csvText: string;
  applied: AppliedCorrection[];
  stale: StaleCorrection[];
  missing: string[];
};

// Relative tolerance for deciding a correction has become stale (EIA now
// serves a value within this fraction of the pinned value).
const STALE_REL_TOLERANCE = 0.02;

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Load corrections keyed by "period|stateid". Missing file = no corrections. */
export function loadCorrections(correctionsPath: string): Corrections {
  const out: Corrections = new Map();
  if (!existsSync(correctionsPath)) return out;
  const raw = readFileSync(correctionsPath, "utf8");
  const parsed = JSON.parse(raw) as { entries?: Record<string, CorrectionEntry> };
  const entries = parsed.entries ?? {};
  for (const [key, value] of Object.entries(entries)) {
    if (!value || typeof value.value !== "number" || !Number.isFinite(value.value)) {
      throw new Error(`Correction "${key}" is missing a finite numeric "value".`);
    }
    out.set(key, value);
  }
  return out;
}

/**
 * Build a map of "period|stateid" -> fetched price from the raw EIA refresh
 * JSON. Used only for staleness detection (compare against the value EIA
 * actually serves, not the already-pinned CSV). Missing file = empty map.
 */
export function loadRawRefreshPrices(rawRefreshPath: string): Map<string, number> {
  const out = new Map<string, number>();
  if (!existsSync(rawRefreshPath)) return out;
  const raw = readFileSync(rawRefreshPath, "utf8");
  const parsed = JSON.parse(raw) as {
    data?: { period?: unknown; stateid?: unknown; sectorid?: unknown; price?: unknown }[];
  };
  for (const row of parsed.data ?? []) {
    const period = typeof row.period === "string" ? row.period : "";
    const stateid = typeof row.stateid === "string" ? row.stateid.trim().toUpperCase() : "";
    const sectorid = typeof row.sectorid === "string" ? row.sectorid : "";
    const price = Number(row.price);
    if (!period || !stateid || sectorid !== "RES" || !Number.isFinite(price)) continue;
    out.set(`${period}|${stateid}`, price);
  }
  return out;
}

/**
 * Overwrite matching "period|stateid" rows in the normalized CSV with the
 * corrected value. Operates line-by-line and preserves the file's existing
 * EOL so non-matching rows stay byte-for-byte identical (no spurious diff).
 * Other columns (sectorid, source, fetched_at) are preserved.
 */
export function applyCorrectionsToCsv(
  csvText: string,
  corrections: Corrections,
  rawRefreshPrices?: Map<string, number>,
): ApplyResult {
  const eol = csvText.includes("\r\n") ? "\r\n" : "\n";
  const lines = csvText.split(eol);

  if (lines.length < 2) {
    throw new Error("EIA CSV is empty or missing data rows.");
  }

  const header = parseCsvLine(lines[0]);
  const idx = new Map(header.map((name, i) => [name, i]));
  for (const col of ["period", "stateid", "sectorid", "price", "source", "fetched_at"] as const) {
    if (!idx.has(col)) {
      throw new Error(`EIA CSV missing required column: ${col}`);
    }
  }
  const iPeriod = idx.get("period") as number;
  const iState = idx.get("stateid") as number;
  const iPrice = idx.get("price") as number;

  const applied: AppliedCorrection[] = [];
  const seenKeys = new Set<string>();

  const outLines = lines.map((line, lineNo) => {
    if (lineNo === 0) return line;
    if (line.trim().length === 0) return line;

    const cols = parseCsvLine(line);
    const period = (cols[iPeriod] ?? "").trim();
    const stateid = (cols[iState] ?? "").trim().toUpperCase();
    const key = `${period}|${stateid}`;
    const correction = corrections.get(key);
    if (!correction) return line;

    seenKeys.add(key);
    const currentPrice = Number((cols[iPrice] ?? "").trim());
    if (Number.isFinite(currentPrice) && currentPrice === correction.value) {
      return line; // already correct -> no rewrite, no spurious diff
    }

    const newCols = [...cols];
    newCols[iPrice] = correction.value.toString();
    applied.push({ key, from: currentPrice, to: correction.value });
    return newCols.map(csvEscape).join(",");
  });

  const missing = Array.from(corrections.keys()).filter((key) => !seenKeys.has(key));

  const stale: StaleCorrection[] = [];
  if (rawRefreshPrices) {
    for (const [key, entry] of corrections.entries()) {
      const rawValue = rawRefreshPrices.get(key);
      if (rawValue === undefined || rawValue === 0) continue;
      if (Math.abs(rawValue - entry.value) / rawValue <= STALE_REL_TOLERANCE) {
        stale.push({ key, rawValue, pinnedValue: entry.value });
      }
    }
  }

  return { csvText: outLines.join(eol), applied, stale, missing };
}
