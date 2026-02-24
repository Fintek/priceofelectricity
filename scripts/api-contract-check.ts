import {
  PREFERRED_TEST_PORT,
  resolveTestPort,
  startNextServer,
  stopServer,
  waitForServerReady,
  fetchWithTimeout,
} from "./_server";

let passed = 0;
let failed = 0;

function pass(label: string) {
  console.log(`  PASS  ${label}`);
  passed++;
}

function fail(label: string, reason: string) {
  console.log(`  FAIL  ${label} — ${reason}`);
  failed++;
}

async function checkStatesEndpoint(base: string) {
  const label = "GET /api/v1/states";
  try {
    const res = await fetchWithTimeout(`${base}/api/v1/states`);
    if (!res.ok) {
      fail(label, `HTTP ${res.status}`);
      return;
    }
    const data = await res.json();
    if (data.version !== "v1") {
      fail(label, `version=${data.version}, expected "v1"`);
      return;
    }
    if (!Array.isArray(data.states) || data.states.length === 0) {
      fail(label, "states array missing or empty");
      return;
    }
    if (typeof data.generatedAt !== "string" || !data.generatedAt) {
      fail(label, "generatedAt missing");
      return;
    }
    const first = data.states[0];
    const requiredKeys = [
      "slug",
      "name",
      "avgResidentialRate",
      "avgMonthlyBill",
      "affordabilityIndex",
      "valueScore",
      "lastUpdated",
    ];
    for (const key of requiredKeys) {
      if (!(key in first)) {
        fail(label, `missing key "${key}" in states[0]`);
        return;
      }
    }
    pass(`${label} (${data.states.length} states)`);
  } catch (err: unknown) {
    fail(label, String(err));
  }
}

async function checkStateDetailEndpoint(base: string) {
  const label = "GET /api/v1/state/texas";
  try {
    const res = await fetchWithTimeout(`${base}/api/v1/state/texas`);
    if (!res.ok) {
      fail(label, `HTTP ${res.status}`);
      return;
    }
    const data = await res.json();
    if (data.version !== "v1") {
      fail(label, `version=${data.version}, expected "v1"`);
      return;
    }
    if (!data.state || typeof data.state !== "object") {
      fail(label, "state object missing");
      return;
    }
    if (typeof data.generatedAt !== "string" || !data.generatedAt) {
      fail(label, "generatedAt missing");
      return;
    }
    const requiredKeys = [
      "slug",
      "name",
      "avgResidentialRate",
      "avgMonthlyBill",
      "affordabilityIndex",
      "valueScore",
      "drivers",
      "openRateCases",
      "timelineEvents",
      "lastUpdated",
    ];
    for (const key of requiredKeys) {
      if (!(key in data.state)) {
        fail(label, `missing key "${key}" in state`);
        return;
      }
    }
    if (!Array.isArray(data.state.drivers)) {
      fail(label, "drivers is not an array");
      return;
    }
    if (typeof data.state.openRateCases !== "number") {
      fail(label, "openRateCases is not a number");
      return;
    }
    if (typeof data.state.timelineEvents !== "number") {
      fail(label, "timelineEvents is not a number");
      return;
    }
    pass(label);
  } catch (err: unknown) {
    fail(label, String(err));
  }
}

async function checkStateDetailNotFound(base: string) {
  const label = "GET /api/v1/state/not-a-state → 404";
  try {
    const res = await fetchWithTimeout(`${base}/api/v1/state/not-a-state`);
    if (res.status === 404) {
      pass(label);
    } else {
      fail(label, `expected 404, got ${res.status}`);
    }
  } catch (err: unknown) {
    fail(label, String(err));
  }
}

async function main() {
  console.log("\n=== API Contract Check ===\n");

  const port = await resolveTestPort(PREFERRED_TEST_PORT);
  const base = `http://127.0.0.1:${port}`;
  const proc = startNextServer(port);

  try {
    await waitForServerReady(base);

    await checkStatesEndpoint(base);
    await checkStateDetailEndpoint(base);
    await checkStateDetailNotFound(base);

    console.log(`\n  ${passed} passed, ${failed} failed\n`);
  } finally {
    await stopServer(proc);
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("API contract check crashed:", err);
  process.exit(1);
});
