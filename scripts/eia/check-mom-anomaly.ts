import path from "node:path";
import {
  loadCsvSeries,
  loadAllowlist,
  detectMomAnomalies,
  formatMove,
} from "./lib/mom-anomaly";

const DEFAULT_THRESHOLD = 25;
const DEFAULT_WINDOW = 6;
const DEFAULT_CSV = path.join(
  process.cwd(),
  "data",
  "normalized",
  "eia",
  "retail_res_monthly_2000_present.csv",
);
const DEFAULT_ALLOWLIST = path.join(process.cwd(), "data", "eia", "anomaly-allowlist.json");

type Cli = {
  threshold: number;
  window: number;
  source: string;
  allowlist: string;
  json: boolean;
};

function parseArgs(argv: string[]): Cli {
  const cli: Cli = {
    threshold: Number(process.env.EIA_MOM_THRESHOLD ?? DEFAULT_THRESHOLD),
    window: DEFAULT_WINDOW,
    source: DEFAULT_CSV,
    allowlist: DEFAULT_ALLOWLIST,
    json: false,
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
      case "--threshold":
        cli.threshold = Number(next());
        break;
      case "--window":
        cli.window = Number(next());
        break;
      case "--source":
        cli.source = path.resolve(next());
        break;
      case "--allowlist":
        cli.allowlist = path.resolve(next());
        break;
      case "--json":
        cli.json = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isFinite(cli.threshold) || cli.threshold <= 0) {
    throw new Error(`Invalid threshold: ${cli.threshold}`);
  }
  if (!Number.isInteger(cli.window) || cli.window < 1) {
    throw new Error(`Invalid window: ${cli.window}`);
  }
  return cli;
}

function main(): void {
  const cli = parseArgs(process.argv.slice(2));
  const seriesByState = loadCsvSeries(cli.source);
  const allowlist = loadAllowlist(cli.allowlist);
  const result = detectMomAnomalies({
    seriesByState,
    threshold: cli.threshold,
    window: cli.window,
    allowlist,
  });

  if (cli.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`EIA month-over-month anomaly check`);
    console.log(`  source:    ${path.relative(process.cwd(), cli.source)}`);
    console.log(`  allowlist: ${path.relative(process.cwd(), cli.allowlist)}`);
    console.log(`  threshold: ${cli.threshold}%  window: ${cli.window} month(s)`);
    console.log(`  latest period: ${result.latestPeriod ?? "n/a"}`);
    console.log("");

    if (result.allowed.length > 0) {
      console.log(`Allowlisted moves (${result.allowed.length}):`);
      for (const move of result.allowed) console.log(`  ALLOWED  ${formatMove(move)}`);
      console.log("");
    }

    if (result.anomalies.length > 0) {
      console.log(`ANOMALIES (${result.anomalies.length}):`);
      for (const move of result.anomalies) console.log(`  ANOMALY  ${formatMove(move)}`);
      console.log("");
      console.log("To resolve each anomaly:");
      console.log("  - If it is a genuine EIA data error: add an entry to data/eia/corrections.json");
      console.log("    (value, reason, source, addedAt, removeWhen) and re-run the refresh.");
      console.log("  - If it is a real but volatile move: add a \"period|stateid\" entry to");
      console.log("    data/eia/anomaly-allowlist.json and re-run.");
    }
  }

  if (result.anomalies.length > 0) {
    console.error(`FAIL: ${result.anomalies.length} month-over-month anomaly(ies) exceed ${cli.threshold}%.`);
    process.exit(1);
  }

  console.log(`OK: no month-over-month moves exceed ${cli.threshold}% (window ${cli.window}).`);
}

main();
