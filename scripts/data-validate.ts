import { RAW_STATES } from "../src/data/raw/states.raw";
import { validateRawState } from "../src/lib/validators/stateValidator";

const slugs = Object.keys(RAW_STATES).sort();
let failures = 0;

for (const slug of slugs) {
  try {
    validateRawState(slug, RAW_STATES[slug]);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  FAIL  ${slug}: ${msg}`);
    failures++;
  }
}

const passed = slugs.length - failures;
console.log("");
console.log(`Validation complete: ${slugs.length} states checked`);
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failures}`);

process.exit(failures > 0 ? 1 : 0);
