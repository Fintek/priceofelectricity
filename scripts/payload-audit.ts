import { readdir, stat, readFile, writeFile, appendFile } from "node:fs/promises";
import path from "node:path";

type BudgetTarget = {
  id: string;
  relPath: string;
  maxBytes: number;
  required: boolean;
};

type MeasuredTarget = BudgetTarget & {
  absPath: string;
  sizeBytes: number;
};

const MB = 1024 * 1024;

const BUDGET_TARGETS: BudgetTarget[] = [
  {
    id: ".next/standalone total",
    relPath: ".next/standalone",
    maxBytes: 85 * MB,
    required: true,
  },
  {
    id: ".next/server/app total",
    relPath: ".next/server/app",
    maxBytes: 40 * MB,
    required: true,
  },
  {
    id: "public/knowledge total",
    relPath: "public/knowledge",
    maxBytes: 6 * MB,
    required: true,
  },
];

function formatMiB(bytes: number): string {
  return `${(bytes / MB).toFixed(2)} MiB`;
}

type OperatingZone = "preferred" | "caution" | "blocker";

// Mirrors the operating-margin policy in docs/PERFORMANCE_BUDGET.md:
// <= 90% preferred, 90-97% caution, >= 97% blocker.
function zoneForPct(pct: number): OperatingZone {
  if (pct >= 97) return "blocker";
  if (pct >= 90) return "caution";
  return "preferred";
}

const BASELINE_REL_PATH = "payload-baseline.json";

type PayloadBaseline = {
  generatedAt: string;
  note: string;
  targets: Record<string, number>;
};

function formatSignedMiB(bytes: number): string {
  const sign = bytes > 0 ? "+" : bytes < 0 ? "-" : "";
  return `${sign}${(Math.abs(bytes) / MB).toFixed(2)} MiB`;
}

async function readBaseline(absPath: string): Promise<PayloadBaseline | null> {
  try {
    const raw = await readFile(absPath, "utf8");
    const parsed = JSON.parse(raw) as PayloadBaseline;
    if (parsed && typeof parsed === "object" && parsed.targets) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

async function getPathSizeBytes(absPath: string): Promise<number> {
  const st = await stat(absPath);
  if (st.isFile()) return st.size;
  if (!st.isDirectory()) return 0;
  const entries = await readdir(absPath, { withFileTypes: true });
  let total = 0;
  for (const entry of entries) {
    const childPath = path.join(absPath, entry.name);
    if (entry.isDirectory()) {
      total += await getPathSizeBytes(childPath);
      continue;
    }
    if (entry.isFile()) {
      const childStat = await stat(childPath);
      total += childStat.size;
    }
  }
  return total;
}

async function collectTopChildren(absDirPath: string, limit = 10): Promise<Array<{ name: string; sizeBytes: number }>> {
  const entries = await readdir(absDirPath, { withFileTypes: true });
  const measured: Array<{ name: string; sizeBytes: number }> = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const childAbsPath = path.join(absDirPath, entry.name);
    const sizeBytes = await getPathSizeBytes(childAbsPath);
    measured.push({ name: entry.name, sizeBytes });
  }
  return measured.sort((a, b) => b.sizeBytes - a.sizeBytes).slice(0, limit);
}

const STANDALONE_SCOPED_NEST_TARGETS = ["@next", "@img", "@swc", "sharp", "lightningcss"] as const;

async function reportStandaloneContributors(root: string): Promise<void> {
  const standalonePath = path.join(root, ".next", "standalone");
  try {
    const topStandalone = await collectTopChildren(standalonePath, 10);
    if (topStandalone.length > 0) {
      console.log("Top .next/standalone folders:");
      for (const item of topStandalone) {
        console.log(`  - ${item.name}: ${formatMiB(item.sizeBytes)}`);
      }
    }
  } catch {
    // Best-effort diagnostic only.
  }

  const nmPath = path.join(standalonePath, "node_modules");
  try {
    const topNm = await collectTopChildren(nmPath, 15);
    if (topNm.length > 0) {
      console.log("Top .next/standalone/node_modules folders:");
      for (const item of topNm) {
        console.log(`  - ${item.name}: ${formatMiB(item.sizeBytes)}`);
      }
    }
  } catch {
    // Best-effort diagnostic only.
  }

  for (const pkg of STANDALONE_SCOPED_NEST_TARGETS) {
    const pkgAbs = path.join(nmPath, pkg);
    try {
      const st = await stat(pkgAbs);
      if (!st.isDirectory()) continue;
      const nested = await collectTopChildren(pkgAbs, 10);
      if (nested.length === 0) continue;
      console.log(`Top .next/standalone/node_modules/${pkg}/ folders:`);
      for (const item of nested) {
        console.log(`  - ${item.name}: ${formatMiB(item.sizeBytes)}`);
      }
    } catch {
      // Skip missing or unreadable paths.
    }
  }
}

async function measureTargets(
  root: string,
): Promise<{ measured: MeasuredTarget[]; missing: BudgetTarget[] }> {
  const measured: MeasuredTarget[] = [];
  const missing: BudgetTarget[] = [];
  for (const target of BUDGET_TARGETS) {
    const absPath = path.join(root, target.relPath);
    try {
      const sizeBytes = await getPathSizeBytes(absPath);
      measured.push({ ...target, absPath, sizeBytes });
    } catch {
      missing.push(target);
    }
  }
  return { measured, missing };
}

// Compact, human-friendly headroom snapshot reading the last build output.
// Purely informational: never gates and never exits non-zero on its own.
async function runReadout(root: string): Promise<void> {
  const { measured, missing } = await measureTargets(root);
  if (measured.length === 0) {
    console.log("Payload readout: no build output found. Run `npm run build` first.");
    return;
  }

  const headers = ["Target", "Size", "Budget", "Used", "Headroom", "Zone"];
  const rightAligned = new Set([1, 2, 3, 4]);
  const rows = measured.map((t) => {
    const pct = (t.sizeBytes / t.maxBytes) * 100;
    const headroomBytes = Math.max(t.maxBytes - t.sizeBytes, 0);
    return [
      t.id,
      formatMiB(t.sizeBytes),
      formatMiB(t.maxBytes),
      `${pct.toFixed(1)}%`,
      formatMiB(headroomBytes),
      zoneForPct(pct),
    ];
  });

  const widths = headers.map((header, col) =>
    Math.max(header.length, ...rows.map((row) => row[col].length)),
  );
  const formatRow = (cols: string[]): string =>
    cols
      .map((value, col) =>
        rightAligned.has(col) ? value.padStart(widths[col]) : value.padEnd(widths[col]),
      )
      .join("  ");

  console.log("Payload readout (last build):");
  console.log(`  ${formatRow(headers)}`);
  for (const row of rows) {
    console.log(`  ${formatRow(row)}`);
  }
  for (const target of missing) {
    console.log(`  (not measured: ${target.relPath} — run \`npm run build\`)`);
  }
}

async function writeGithubStepSummary(measuredTargets: MeasuredTarget[]): Promise<void> {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  const lines: string[] = [];
  lines.push("### Payload governance audit");
  lines.push("");
  if (measuredTargets.length === 0) {
    lines.push("_No build output measured (run `npm run build` first)._");
  } else {
    lines.push("| Target | Size | Budget | Used | Headroom |");
    lines.push("| --- | ---: | ---: | ---: | ---: |");
    for (const t of measuredTargets) {
      const pct = (t.sizeBytes / t.maxBytes) * 100;
      const headroomBytes = Math.max(t.maxBytes - t.sizeBytes, 0);
      lines.push(
        `| ${t.id} | ${formatMiB(t.sizeBytes)} | ${formatMiB(t.maxBytes)} | ${pct.toFixed(1)}% | ${formatMiB(headroomBytes)} |`,
      );
    }
  }
  lines.push("");
  await appendFile(summaryPath, `${lines.join("\n")}\n`, "utf8");
}

async function main(): Promise<void> {
  const root = process.cwd();

  if (process.argv.includes("--readout")) {
    await runReadout(root);
    return;
  }

  const updateBaseline = process.argv.includes("--update-baseline");
  const emitGithubSummary = process.argv.includes("--github-summary");
  const baselineAbsPath = path.join(root, BASELINE_REL_PATH);
  const baseline = await readBaseline(baselineAbsPath);
  const failures: string[] = [];
  const { measured: measuredTargets, missing } = await measureTargets(root);

  for (const target of missing) {
    if (target.required) {
      failures.push(`Missing required path: ${target.relPath} (run npm run build first)`);
    }
  }

  if (measuredTargets.length > 0) {
    console.log("Payload governance audit:");
    for (const target of measuredTargets) {
      const pct = (target.sizeBytes / target.maxBytes) * 100;
      const headroomBytes = Math.max(target.maxBytes - target.sizeBytes, 0);
      console.log(
        `  - ${target.id}: ${formatMiB(target.sizeBytes)} / ${formatMiB(target.maxBytes)} (${pct.toFixed(1)}%)`,
      );
      console.log(`    headroom: ${formatMiB(headroomBytes)}`);
      if (baseline?.targets && Object.prototype.hasOwnProperty.call(baseline.targets, target.id)) {
        const baseBytes = baseline.targets[target.id];
        const deltaBytes = target.sizeBytes - baseBytes;
        const basePct = (baseBytes / target.maxBytes) * 100;
        if (deltaBytes === 0) {
          console.log(`    change vs baseline: no change (baseline ${formatMiB(baseBytes)}, ${basePct.toFixed(1)}%)`);
        } else {
          const deltaPoints = (deltaBytes / target.maxBytes) * 100;
          const pointsLabel = `${deltaPoints >= 0 ? "+" : ""}${deltaPoints.toFixed(1)} pts of budget`;
          console.log(
            `    change vs baseline: ${formatSignedMiB(deltaBytes)} (${pointsLabel}) — was ${formatMiB(baseBytes)} (${basePct.toFixed(1)}%)`,
          );
        }
      } else if (baseline) {
        console.log(`    change vs baseline: no baseline recorded for this target`);
      }
      if (target.sizeBytes > target.maxBytes) {
        failures.push(
          `${target.id} exceeds budget: ${formatMiB(target.sizeBytes)} > ${formatMiB(target.maxBytes)}`,
        );
      }
    }
  }

  if (updateBaseline) {
    const newBaseline: PayloadBaseline = {
      generatedAt: new Date().toISOString(),
      note: "Reference payload sizes for differential reporting. Environment-sensitive (sizes differ between local OS and CI/Vercel Linux); informational only and never gates the build. Refresh with `npm run payload:baseline` after a build.",
      targets: Object.fromEntries(measuredTargets.map((t) => [t.id, t.sizeBytes])),
    };
    await writeFile(baselineAbsPath, `${JSON.stringify(newBaseline, null, 2)}\n`, "utf8");
    console.log(`Wrote payload baseline to ${BASELINE_REL_PATH} (${measuredTargets.length} targets).`);
  } else if (!baseline) {
    console.log(
      "No payload baseline found. Run `npm run payload:baseline` after a build to record one for change reporting.",
    );
  }

  if (emitGithubSummary) {
    await writeGithubStepSummary(measuredTargets);
  }

  await reportStandaloneContributors(root);

  const serverAppPath = path.join(root, ".next", "server", "app");
  try {
    const topServerFamilies = await collectTopChildren(serverAppPath, 10);
    if (topServerFamilies.length > 0) {
      console.log("Top .next/server/app folders:");
      for (const item of topServerFamilies) {
        console.log(`  - ${item.name}: ${formatMiB(item.sizeBytes)}`);
      }
    }
  } catch {
    // Do nothing; this is best-effort reporting.
  }

  const knowledgePath = path.join(root, "public", "knowledge");
  try {
    const topKnowledgeFamilies = await collectTopChildren(knowledgePath, 10);
    if (topKnowledgeFamilies.length > 0) {
      console.log("Top public/knowledge folders:");
      for (const item of topKnowledgeFamilies) {
        console.log(`  - ${item.name}: ${formatMiB(item.sizeBytes)}`);
      }
    }
  } catch {
    // Do nothing; this is best-effort reporting.
  }

  if (failures.length > 0) {
    console.error("payload:audit failed:");
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    process.exit(1);
  }

  console.log("payload:audit passed");
}

main().catch((error) => {
  console.error("payload:audit crashed", error);
  process.exit(1);
});
