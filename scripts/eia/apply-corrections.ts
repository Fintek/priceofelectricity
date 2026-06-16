import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  loadCorrections,
  loadRawRefreshPrices,
  applyCorrectionsToCsv,
} from "./lib/corrections";

const DEFAULT_CSV = path.join(
  process.cwd(),
  "data",
  "normalized",
  "eia",
  "retail_res_monthly_2000_present.csv",
);
const DEFAULT_CORRECTIONS = path.join(process.cwd(), "data", "eia", "corrections.json");
const DEFAULT_RAW_REFRESH = path.join(
  process.cwd(),
  "data",
  "raw",
  "eia",
  "retail_res_monthly_latest_refresh.json",
);

type Cli = { source: string; corrections: string; rawRefresh: string };

function parseArgs(argv: string[]): Cli {
  const cli: Cli = {
    source: DEFAULT_CSV,
    corrections: DEFAULT_CORRECTIONS,
    rawRefresh: DEFAULT_RAW_REFRESH,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = (): string => {
      const v = argv[i + 1];
      if (v === undefined) throw new Error(`Missing value for ${arg}`);
      i += 1;
      return v;
    };
    switch (arg) {
      case "--source":
        cli.source = path.resolve(next());
        break;
      case "--corrections":
        cli.corrections = path.resolve(next());
        break;
      case "--raw-refresh":
        cli.rawRefresh = path.resolve(next());
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return cli;
}

// This is a fixer, not a gate: it re-pins known-bad EIA values and always
// exits 0. It surfaces a non-fatal WARN when EIA appears to have corrected the
// source value (so reviewers know to drop the entry), but never blocks the
// refresh, because failing here would re-freeze all state updates.
function main(): void {
  const cli = parseArgs(process.argv.slice(2));
  const corrections = loadCorrections(cli.corrections);

  console.log(`EIA corrections applier`);
  console.log(`  source:      ${path.relative(process.cwd(), cli.source)}`);
  console.log(`  corrections: ${path.relative(process.cwd(), cli.corrections)}`);
  console.log(`  entries:     ${corrections.size}`);

  if (corrections.size === 0) {
    console.log("No corrections defined; nothing to apply.");
    return;
  }

  const csvText = readFileSync(cli.source, "utf8");
  const rawRefreshPrices = loadRawRefreshPrices(cli.rawRefresh);
  const result = applyCorrectionsToCsv(csvText, corrections, rawRefreshPrices);

  if (result.applied.length > 0) {
    for (const a of result.applied) {
      console.log(`  PINNED  ${a.key}: ${a.from} -> ${a.to}`);
    }
    writeFileSync(cli.source, result.csvText, "utf8");
    console.log(`Re-pinned ${result.applied.length} row(s); wrote ${path.relative(process.cwd(), cli.source)}`);
  } else {
    console.log("All corrections already match the CSV; no rewrite needed.");
  }

  for (const key of result.missing) {
    console.warn(`  WARN: correction ${key} has no matching row in the CSV (skipped).`);
  }

  for (const s of result.stale) {
    console.warn(
      `  WARN: correction ${s.key} appears stale - EIA now serves ${s.rawValue} ~= pinned ${s.pinnedValue}; remove per removeWhen.`,
    );
  }
}

main();
