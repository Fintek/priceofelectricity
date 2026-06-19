/**
 * Build (or verify) the public, downloadable "Hidden Electricity Fees & Taxes"
 * dataset from the committed source-of-truth JSON in src/data/hidden-fees/.
 *
 * Run modes:
 *   tsx scripts/data-build-hidden-fees.ts            # regenerate the public files
 *   tsx scripts/data-build-hidden-fees.ts --check    # fail if committed files drift
 *
 * IMPORTANT: this is a STANDALONE, manually-run generator. It is intentionally
 * NOT part of the monthly EIA refresh, release:gen, or knowledge:build. The
 * dataset is point-in-time and hand-curated; the only coupling is the --check
 * drift guard wired into verify so the public download can never silently
 * diverge from the source JSON.
 *
 * Output is deterministic (keyed off methodology.datasetLastUpdated, with no
 * wall-clock timestamp), so regeneration is byte-identical and safe to diff.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import {
  ALL_IN_STATES,
  HIDDEN_FEES_METHODOLOGY,
  ITEMIZED_STATES,
  BUNDLED_ITEMIZED_STATES,
} from "../src/data/hidden-fees";
import type { AllInStateFee, ItemizedStateFee } from "../src/data/hidden-fees";

const OUT_DIR = path.join(process.cwd(), "public", "datasets");
const JSON_PATH = path.join(OUT_DIR, "hidden-electricity-fees.json");
const CSV_PATH = path.join(OUT_DIR, "hidden-electricity-fees.csv");

function buildJson(): string {
  const payload = {
    name: "Hidden Electricity Fees & Taxes by State",
    schemaVersion: "1.0",
    datasetLastUpdated: HIDDEN_FEES_METHODOLOGY.datasetLastUpdated,
    usageBasisKwh: HIDDEN_FEES_METHODOLOGY.usageBasisKwh,
    itemizedStateCount: ITEMIZED_STATES.length,
    bundledItemizedStateCount: BUNDLED_ITEMIZED_STATES.length,
    allInStateCount: ALL_IN_STATES.length,
    methodology: HIDDEN_FEES_METHODOLOGY,
    itemized: ITEMIZED_STATES,
    allIn: ALL_IN_STATES,
  };
  return `${JSON.stringify(payload, null, 2)}\n`;
}

const CSV_COLUMNS = [
  "postal",
  "state",
  "slug",
  "utility",
  "market",
  "energy_rate_cents_per_kwh",
  "fixed_usd_per_month",
  "riders_cents_per_kwh",
  "tax_percent",
  "nonenergy_addon_900kwh_usd",
  "nonenergy_share_percent",
  "all_in_cents_per_kwh",
  "all_in_source",
  "all_in_confidence",
  "breakdown_available",
  "as_of",
  "eia_reference_cents_per_kwh",
  "source_url",
  "urdb_uri",
] as const;

function csvEscape(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

type MergedRow = Record<(typeof CSV_COLUMNS)[number], string | number | boolean | null>;

function buildCsv(): string {
  const itemizedBySlug = new Map<string, ItemizedStateFee>(
    ITEMIZED_STATES.map((row) => [row.slug, row]),
  );
  const allInBySlug = new Map<string, AllInStateFee>(ALL_IN_STATES.map((row) => [row.slug, row]));

  // Union of every state that appears in either table.
  const slugs = new Set<string>([...allInBySlug.keys(), ...itemizedBySlug.keys()]);

  const rows: MergedRow[] = [];
  for (const slug of slugs) {
    const item = itemizedBySlug.get(slug);
    const allIn = allInBySlug.get(slug);
    const base = item ?? allIn;
    if (!base) continue;
    rows.push({
      postal: base.postal,
      state: base.state,
      slug: base.slug,
      utility: base.utility,
      market: item?.market ?? "",
      energy_rate_cents_per_kwh: item?.energyRateCentsPerKwh ?? "",
      fixed_usd_per_month: item?.fixedUsdPerMonth ?? "",
      riders_cents_per_kwh: item?.ridersCentsPerKwh ?? "",
      tax_percent: item?.taxPercent ?? "",
      nonenergy_addon_900kwh_usd: item?.nonEnergyAddonUsd ?? "",
      nonenergy_share_percent: item?.nonEnergySharePercent ?? "",
      all_in_cents_per_kwh: allIn?.allInCentsPerKwh ?? item?.allInCentsPerKwh ?? "",
      all_in_source: allIn?.source ?? "",
      all_in_confidence: allIn?.confidence ?? item?.confidence ?? "",
      breakdown_available: item ? true : (allIn?.breakdownAvailable ?? false),
      as_of: (item?.asOf ?? allIn?.asOf) ?? "",
      eia_reference_cents_per_kwh: item?.eiaReferenceCentsPerKwh ?? "",
      source_url: (item?.sourceUrls?.[0] ?? allIn?.sourceUrl) ?? "",
      urdb_uri: allIn?.urdbUri ?? "",
    });
  }

  rows.sort((a, b) => String(a.state).localeCompare(String(b.state)));

  const header = CSV_COLUMNS.join(",");
  const body = rows.map((row) => CSV_COLUMNS.map((col) => csvEscape(row[col])).join(",")).join("\n");
  return `${header}\n${body}\n`;
}

function main(): void {
  const check = process.argv.includes("--check");
  const json = buildJson();
  const csv = buildCsv();

  if (check) {
    const problems: string[] = [];
    for (const [label, file, expected] of [
      ["JSON", JSON_PATH, json],
      ["CSV", CSV_PATH, csv],
    ] as const) {
      if (!existsSync(file)) {
        problems.push(`${label} download missing at ${path.relative(process.cwd(), file)} — run: npm run data:build:hidden-fees`);
        continue;
      }
      const actual = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
      if (actual !== expected) {
        problems.push(
          `${label} download is stale at ${path.relative(process.cwd(), file)} — regenerate with: npm run data:build:hidden-fees`,
        );
      }
    }
    if (problems.length > 0) {
      console.error("hidden-fees dataset drift detected:");
      for (const p of problems) console.error(`  - ${p}`);
      process.exit(1);
    }
    console.log("hidden-fees dataset: committed downloads match source JSON.");
    return;
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(JSON_PATH, json, "utf8");
  writeFileSync(CSV_PATH, csv, "utf8");
  console.log(`Wrote ${path.relative(process.cwd(), JSON_PATH)} and ${path.relative(process.cwd(), CSV_PATH)}.`);
}

main();
