import "dotenv/config";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const API_URL = "https://api.eia.gov/v2/electricity/retail-sales/data/";
const PAGE_LENGTH = 5000;
const REQUEST_DELAY_MS = 200;
const SOURCE_NAME = "eia_v2_retail_sales";
const LOOKBACK_MONTHS = 6;

const RAW_DIR = path.join(process.cwd(), "data", "raw", "eia");
const NORMALIZED_DIR = path.join(process.cwd(), "data", "normalized", "eia");
const RAW_LATEST_PATH = path.join(RAW_DIR, "retail_res_monthly_latest_refresh.json");
const CSV_PATH = path.join(NORMALIZED_DIR, "retail_res_monthly_2000_present.csv");

type EiaApiRow = {
  period?: unknown;
  stateid?: unknown;
  sectorid?: unknown;
  price?: unknown;
};

type EiaApiResponse = {
  response?: {
    data?: EiaApiRow[];
    total?: number | string;
  };
  error?: unknown;
};

type NormalizedRow = {
  period: string;
  stateid: string;
  sectorid: string;
  price: number;
  source: string;
  fetched_at: string;
};

function offsetMonth(date: Date, months: number): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function isValidPeriod(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

function normalizeRow(row: EiaApiRow): NormalizedRow | null {
  const period = typeof row.period === "string" ? row.period : "";
  const stateid = typeof row.stateid === "string" ? row.stateid.trim() : "";
  const sectorid = typeof row.sectorid === "string" ? row.sectorid : "";
  const priceNum = Number(row.price);

  if (!isValidPeriod(period)) return null;
  if (!stateid) return null;
  if (!Number.isFinite(priceNum) || priceNum < 0) return null;
  if (sectorid !== "RES") return null;

  return { period, stateid, sectorid, price: priceNum, source: SOURCE_NAME, fetched_at: "" };
}

function rowKey(r: NormalizedRow): string {
  return `${r.period}|${r.stateid}`;
}

async function fetchPage(
  apiKey: string,
  start: string,
  end: string,
  offset: number,
): Promise<EiaApiResponse> {
  const params = new URLSearchParams();
  params.set("api_key", apiKey);
  params.set("frequency", "monthly");
  params.append("data[]", "price");
  params.append("facets[sectorid][]", "RES");
  params.set("start", start);
  params.set("end", end);
  params.set("length", String(PAGE_LENGTH));
  params.set("offset", String(offset));

  const url = `${API_URL}?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`EIA request failed (${response.status}): ${response.statusText}`);
  }
  return (await response.json()) as EiaApiResponse;
}

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

function loadExistingCsv(csvText: string): NormalizedRow[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]);
  const idx = new Map(header.map((name, i) => [name, i]));
  const rows: NormalizedRow[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    const period = cols[idx.get("period") ?? -1]?.trim() ?? "";
    const stateid = cols[idx.get("stateid") ?? -1]?.trim() ?? "";
    const sectorid = cols[idx.get("sectorid") ?? -1]?.trim() ?? "";
    const price = Number(cols[idx.get("price") ?? -1]?.trim() ?? "");
    const source = cols[idx.get("source") ?? -1]?.trim() ?? SOURCE_NAME;
    const fetched_at = cols[idx.get("fetched_at") ?? -1]?.trim() ?? "";

    if (!isValidPeriod(period)) continue;
    if (!stateid || sectorid !== "RES") continue;
    if (!Number.isFinite(price) || price < 0) continue;

    rows.push({ period, stateid, sectorid, price, source, fetched_at });
  }
  return rows;
}

async function main(): Promise<void> {
  const apiKey = process.env.EIA_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing EIA_API_KEY environment variable.");
  }

  const now = new Date();
  const start = offsetMonth(now, -LOOKBACK_MONTHS);
  const end = offsetMonth(now, 0);
  const fetchedAt = now.toISOString();

  console.log(`Fetching EIA residential prices for ${start} to ${end}...`);

  const freshRows: NormalizedRow[] = [];
  let offset = 0;
  let total: number | null = null;

  while (true) {
    const payload = await fetchPage(apiKey, start, end, offset);
    if (payload.error) {
      throw new Error(`EIA API error at offset ${offset}: ${JSON.stringify(payload.error)}`);
    }

    const data = Array.isArray(payload.response?.data) ? payload.response.data : [];
    const totalFromApi = payload.response?.total;
    if (total === null && (typeof totalFromApi === "number" || typeof totalFromApi === "string")) {
      const parsed = Number(totalFromApi);
      if (Number.isFinite(parsed)) total = parsed;
    }

    for (const row of data) {
      const normalized = normalizeRow(row);
      if (normalized) {
        normalized.fetched_at = fetchedAt;
        freshRows.push(normalized);
      }
    }

    if (data.length === 0) break;
    if (total !== null && offset + data.length >= total) break;
    if (data.length < PAGE_LENGTH) break;

    offset += PAGE_LENGTH;
    await sleep(REQUEST_DELAY_MS);
  }

  console.log(`Fetched ${freshRows.length} rows from EIA API.`);

  let existing: NormalizedRow[] = [];
  if (existsSync(CSV_PATH)) {
    const csvText = await readFile(CSV_PATH, "utf8");
    existing = loadExistingCsv(csvText);
    console.log(`Loaded ${existing.length} existing rows from CSV.`);
  }

  const merged = new Map<string, NormalizedRow>();
  for (const row of existing) merged.set(rowKey(row), row);
  for (const row of freshRows) merged.set(rowKey(row), row);

  const allRows = Array.from(merged.values()).sort((a, b) => {
    if (a.period !== b.period) return a.period.localeCompare(b.period);
    return a.stateid.localeCompare(b.stateid);
  });

  if (allRows.length === existing.length) {
    let identical = true;
    for (let i = 0; i < allRows.length; i++) {
      const a = allRows[i];
      const b = existing[i];
      if (a.period !== b.period || a.stateid !== b.stateid || a.price !== b.price) {
        identical = false;
        break;
      }
    }
    if (identical) {
      console.log("No new or changed data. Exiting without rewrite.");
      return;
    }
  }

  const newRowCount = allRows.length - existing.length;
  console.log(`Merged total: ${allRows.length} rows (${newRowCount >= 0 ? "+" : ""}${newRowCount} net new).`);

  await mkdir(RAW_DIR, { recursive: true });
  await mkdir(NORMALIZED_DIR, { recursive: true });

  const rawPayload = {
    source_url: API_URL,
    fetched_at: fetchedAt,
    request: {
      frequency: "monthly",
      data: ["price"],
      facets: { sectorid: ["RES"] },
      start,
      end,
      length: PAGE_LENGTH,
    },
    totals: {
      reported_total: total,
      fetched_rows: freshRows.length,
    },
    data: freshRows,
  };
  await writeFile(RAW_LATEST_PATH, `${JSON.stringify(rawPayload, null, 2)}\n`, "utf8");

  const header = "period,stateid,sectorid,price,source,fetched_at";
  const lines = allRows.map((row) =>
    [row.period, row.stateid, row.sectorid, row.price.toString(), row.source, row.fetched_at]
      .map(csvEscape)
      .join(","),
  );
  await writeFile(CSV_PATH, `${header}\n${lines.join("\n")}\n`, "utf8");

  console.log(`Wrote ${RAW_LATEST_PATH}`);
  console.log(`Wrote ${CSV_PATH}`);
  console.log("Data updated. Run 'npm run data:build:snapshots:eia' to regenerate artifacts.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
