import * as fs from "node:fs";
import * as path from "node:path";

type SnapshotState = { slug: string; rate: number; updated: string };
type Snapshot = { version: string; releasedAt: string; states: SnapshotState[] };

const SNAPSHOTS_DIR = path.resolve(__dirname, "../src/data/snapshots");

function loadSnapshot(version: string): Snapshot | null {
  const filePath = path.join(SNAPSHOTS_DIR, `${version}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as Snapshot;
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log("Usage: data:diff <old-version> <new-version>");
  console.log("Example: npm run data:diff -- v1 v2");

  const files = fs
    .readdirSync(SNAPSHOTS_DIR)
    .filter((f) => f.endsWith(".json") && f !== "latest.json")
    .map((f) => f.replace(".json", ""))
    .sort();
  if (files.length > 0) {
    console.log(`\nAvailable versions: ${files.join(", ")}`);
  }
  process.exit(0);
}

const [oldVer, newVer] = args;
const oldSnap = loadSnapshot(oldVer);
const newSnap = loadSnapshot(newVer);

if (!oldSnap) {
  console.error(`Snapshot not found: ${oldVer}`);
  process.exit(1);
}
if (!newSnap) {
  console.error(`Snapshot not found: ${newVer}`);
  process.exit(1);
}

const oldMap = new Map(oldSnap.states.map((s) => [s.slug, s.rate]));

const deltas = newSnap.states
  .map((ns) => {
    const oldRate = oldMap.get(ns.slug);
    if (oldRate === undefined) return null;
    return {
      slug: ns.slug,
      oldRate,
      newRate: ns.rate,
      delta: Math.round((ns.rate - oldRate) * 100) / 100,
    };
  })
  .filter((d): d is NonNullable<typeof d> => d !== null);

const byDelta = [...deltas].sort((a, b) => b.delta - a.delta);
const top10Increases = byDelta.filter((d) => d.delta > 0).slice(0, 10);
const top10Decreases = [...deltas]
  .sort((a, b) => a.delta - b.delta)
  .filter((d) => d.delta < 0)
  .slice(0, 10);
const unchanged = deltas.filter((d) => d.delta === 0).length;

console.log(`Comparing ${oldSnap.version} (${oldSnap.releasedAt}) → ${newSnap.version} (${newSnap.releasedAt})`);
console.log(`States compared: ${deltas.length}  |  Unchanged: ${unchanged}\n`);

if (top10Increases.length > 0) {
  console.log("Top increases (¢/kWh):");
  for (const d of top10Increases) {
    console.log(`  ${d.slug.padEnd(20)} ${d.oldRate.toFixed(2)} → ${d.newRate.toFixed(2)}  (+${d.delta.toFixed(2)})`);
  }
} else {
  console.log("No increases found.");
}

console.log("");

if (top10Decreases.length > 0) {
  console.log("Top decreases (¢/kWh):");
  for (const d of top10Decreases) {
    console.log(`  ${d.slug.padEnd(20)} ${d.oldRate.toFixed(2)} → ${d.newRate.toFixed(2)}  (${d.delta.toFixed(2)})`);
  }
} else {
  console.log("No decreases found.");
}
