import { readdir, stat } from "node:fs/promises";
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

async function main(): Promise<void> {
  const root = process.cwd();
  const failures: string[] = [];
  const measuredTargets: MeasuredTarget[] = [];

  for (const target of BUDGET_TARGETS) {
    const absPath = path.join(root, target.relPath);
    try {
      const sizeBytes = await getPathSizeBytes(absPath);
      measuredTargets.push({ ...target, absPath, sizeBytes });
    } catch {
      if (target.required) {
        failures.push(`Missing required path: ${target.relPath} (run npm run build first)`);
      }
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
      if (target.sizeBytes > target.maxBytes) {
        failures.push(
          `${target.id} exceeds budget: ${formatMiB(target.sizeBytes)} > ${formatMiB(target.maxBytes)}`,
        );
      }
    }
  }

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
