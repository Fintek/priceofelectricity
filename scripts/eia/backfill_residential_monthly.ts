import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const API_URL = "https://api.eia.gov/v2/electricity/retail-sales/data/";
const PAGE_LENGTH = 5000;
const REQUEST_DELAY_MS = 200;
const SOURCE_NAME = "eia_v2_retail_sales";

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
};

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
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

  return {
    period,
    stateid,
    sectorid,
    price: priceNum,
  };
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

async function main(): Promise<void> {
  const apiKey = process.env.EIA_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing EIA_API_KEY environment variable.");
  }

  const start = "2000-01";
  const end = getCurrentMonth();
  const fetchedAt = new Date().toISOString();

  const rawDir = path.join(process.cwd(), "data", "raw", "eia");
  const normalizedDir = path.join(process.cwd(), "data", "normalized", "eia");
  await mkdir(rawDir, { recursive: true });
  await mkdir(normalizedDir, { recursive: true });

  const acceptedRows: NormalizedRow[] = [];
  const pageMeta: Array<{ offset: number; rows: number }> = [];
  let invalidRows = 0;
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

    pageMeta.push({ offset, rows: data.length });

    for (const row of data) {
      const normalized = normalizeRow(row);
      if (normalized) {
        acceptedRows.push(normalized);
      } else {
        invalidRows += 1;
      }
    }

    if (data.length === 0) break;
    if (total !== null && offset + data.length >= total) break;
    if (data.length < PAGE_LENGTH) break;

    offset += PAGE_LENGTH;
    await sleep(REQUEST_DELAY_MS);
  }

  acceptedRows.sort((a, b) => {
    if (a.period !== b.period) return a.period.localeCompare(b.period);
    return a.stateid.localeCompare(b.stateid);
  });

  const rawOutputPath = path.join(rawDir, "retail_res_monthly_2000_present.json");
  const csvOutputPath = path.join(normalizedDir, "retail_res_monthly_2000_present.csv");

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
    pagination: pageMeta,
    totals: {
      reported_total: total,
      valid_rows: acceptedRows.length,
      invalid_rows: invalidRows,
    },
    data: acceptedRows,
  };

  await writeFile(rawOutputPath, `${JSON.stringify(rawPayload, null, 2)}\n`, "utf8");

  const header = "period,stateid,sectorid,price,source,fetched_at";
  const lines = acceptedRows.map((row) =>
    [
      row.period,
      row.stateid,
      row.sectorid,
      row.price.toString(),
      SOURCE_NAME,
      fetchedAt,
    ]
      .map(csvEscape)
      .join(","),
  );
  await writeFile(csvOutputPath, `${header}\n${lines.join("\n")}\n`, "utf8");

  console.log(`Fetched valid rows: ${acceptedRows.length}`);
  console.log(`Skipped invalid rows: ${invalidRows}`);
  console.log(`Wrote raw output: ${rawOutputPath}`);
  console.log(`Wrote normalized output: ${csvOutputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

