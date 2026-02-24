import * as fs from "node:fs";
import * as path from "node:path";
import { RAW_STATES } from "../src/data/raw/states.raw";
import { validateRawState } from "../src/lib/validators/stateValidator";

const SNAPSHOTS_DIR = path.resolve(__dirname, "../src/data/snapshots");

const now = new Date();
const yyyy = now.getFullYear();
const mm = String(now.getMonth() + 1).padStart(2, "0");
const dd = String(now.getDate()).padStart(2, "0");
const version = `v${yyyy}${mm}${dd}`;
const releasedAt = `${yyyy}-${mm}-${dd}`;

const states: { slug: string; rate: number; updated: string }[] = [];

for (const slug of Object.keys(RAW_STATES).sort()) {
  const raw = RAW_STATES[slug];
  const validated = validateRawState(slug, raw);
  states.push({
    slug,
    rate: validated.avgRateCentsPerKwh,
    updated: validated.updated,
  });
}

const snapshot = { version, releasedAt, states };
const json = JSON.stringify(snapshot, null, 2) + "\n";

if (!fs.existsSync(SNAPSHOTS_DIR)) {
  fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
}

const versionFile = path.join(SNAPSHOTS_DIR, `${version}.json`);
fs.writeFileSync(versionFile, json, "utf-8");

const latestFile = path.join(SNAPSHOTS_DIR, "latest.json");
fs.writeFileSync(latestFile, json, "utf-8");

console.log(`Snapshot created: ${path.relative(process.cwd(), versionFile)}`);
console.log(`Latest updated:   ${path.relative(process.cwd(), latestFile)}`);
console.log(`States included:  ${states.length}`);
console.log(`Version:          ${version}`);
console.log(`Released at:      ${releasedAt}`);
