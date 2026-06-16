import {
  PREFERRED_TEST_PORT,
  resolveTestPort,
  startNextServer,
  stopServer,
  fetchWithTimeout,
  waitForServerReady,
} from "./_server";

type CheckResult = {
  name: string;
  passed: boolean;
  detail?: string;
};

function printResult(result: CheckResult): void {
  const label = result.passed ? "PASS" : "FAIL";
  const detail = result.detail ? ` (${result.detail})` : "";
  console.log(`${label} ${result.name}${detail}`);
}

async function expectStatus(
  baseUrl: string,
  path: string,
  expectedStatus: number
): Promise<CheckResult> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}${path}`);
    const passed = res.status === expectedStatus;
    return {
      name: `${path} => ${expectedStatus}`,
      passed,
      detail: `status ${res.status}`,
    };
  } catch (error: unknown) {
    return {
      name: `${path} => ${expectedStatus}`,
      passed: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

async function expectRedirect(
  baseUrl: string,
  path: string,
  expectedStatus: number,
  expectedLocation: string,
): Promise<CheckResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch(`${baseUrl}${path}`, {
      signal: controller.signal,
      redirect: "manual",
    });
    clearTimeout(timeout);
    const location = res.headers.get("location") ?? "";
    const passed = res.status === expectedStatus && location === expectedLocation;
    return {
      name: `${path} => ${expectedStatus} ${expectedLocation}`,
      passed,
      detail: `status ${res.status}, location ${location || "(none)"}`,
    };
  } catch (error: unknown) {
    return {
      name: `${path} => ${expectedStatus} ${expectedLocation}`,
      passed: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

async function expectDistrictOfColumbiaPage(baseUrl: string): Promise<CheckResult> {
  const path = "/district-of-columbia";
  try {
    const res = await fetchWithTimeout(`${baseUrl}${path}`);
    if (res.status !== 200) {
      return {
        name: `${path} => DC page content`,
        passed: false,
        detail: `status ${res.status}`,
      };
    }
    const html = await res.text();
    const failures: string[] = [];
    if (!/<link[^>]*rel="canonical"[^>]*href="[^"]*\/district-of-columbia"/i.test(html)) {
      failures.push("missing canonical /district-of-columbia");
    }
    if (!/<h1[^>]*>[\s\S]*?District of Columbia[\s\S]*?Electricity Rates/i.test(html)) {
      failures.push("missing H1 with District of Columbia");
    }
    if (!/"@type"\s*:\s*"FAQPage"/i.test(html)) {
      failures.push("missing FAQPage JSON-LD");
    }
    if (!/\d+(?:\.\d+)?\s*¢/.test(html)) {
      failures.push("missing rendered ¢/kWh value");
    }
    return {
      name: `${path} => DC page content`,
      passed: failures.length === 0,
      detail: failures.length > 0 ? failures.join("; ") : undefined,
    };
  } catch (error: unknown) {
    return {
      name: `${path} => DC page content`,
      passed: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

async function expectJson(baseUrl: string, path: string): Promise<CheckResult> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}${path}`);
    if (res.status !== 200) {
      return {
        name: `${path} => JSON`,
        passed: false,
        detail: `status ${res.status}`,
      };
    }
    await res.json();
    return { name: `${path} => JSON`, passed: true };
  } catch (error: unknown) {
    return {
      name: `${path} => JSON`,
      passed: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

async function expectCsv(baseUrl: string, path: string): Promise<CheckResult> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}${path}`);
    if (res.status !== 200) {
      return {
        name: `${path} => CSV`,
        passed: false,
        detail: `status ${res.status}`,
      };
    }
    const text = await res.text();
    const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
    const bytes = Buffer.byteLength(text, "utf8");
    const passed = firstLine.includes(",") && bytes > 200;
    return {
      name: `${path} => CSV`,
      passed,
      detail: `bytes ${bytes}`,
    };
  } catch (error: unknown) {
    return {
      name: `${path} => CSV`,
      passed: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

async function expectNoindexOnInvalidSort(baseUrl: string): Promise<CheckResult> {
  const path = "/compare?sort=invalid";
  try {
    const res = await fetchWithTimeout(`${baseUrl}${path}`);
    const html = (await res.text()).toLowerCase();
    const hasRobotsNoindex =
      /<meta[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/.test(html) ||
      /<meta[^>]*content=["'][^"']*noindex[^"']*["'][^>]*name=["']robots["']/.test(html);
    return {
      name: `${path} => robots noindex`,
      passed: res.status === 200 && hasRobotsNoindex,
      detail: `status ${res.status}`,
    };
  } catch (error: unknown) {
    return {
      name: `${path} => robots noindex`,
      passed: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main(): Promise<void> {
  const port = await resolveTestPort(PREFERRED_TEST_PORT);
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log(`Starting production server on ${baseUrl}`);
  const serverProc = startNextServer(port);
  const stderrLines: string[] = [];
  const stdoutLines: string[] = [];

  serverProc.stdout?.on("data", (chunk: Buffer) => {
    stdoutLines.push(chunk.toString("utf8"));
  });
  serverProc.stderr?.on("data", (chunk: Buffer) => {
    stderrLines.push(chunk.toString("utf8"));
  });

  try {
    await waitForServerReady(baseUrl);
    console.log("Server ready. Running smoke checks...");

    const mustBe200 = [
      "/",
      "/texas",
      "/california",
      "/compare",
      "/calculator",
      "/affordability",
      "/value-ranking",
      "/index-ranking",
      "/guides",
      "/questions/average-electric-bill-in-texas",
      "/datasets",
      "/sources",
      "/research",
      "/methodology",
      "/offers",
      "/disclosures",
      "/status",
    ];

    const mustBe404 = [
      "/not-a-real-page",
      "/zzzzzz",
      "/questions/why-electricity-expensive-in-not-a-state",
    ];

    const jsonEndpoints = ["/registry.json", "/graph.json", "/api/datasets/states.json"];
    const csvEndpoints = [
      "/api/datasets/states.csv",
      "/api/datasets/affordability.csv",
      "/api/datasets/value-ranking.csv",
    ];

    const results: CheckResult[] = [];

    for (const path of mustBe200) {
      results.push(await expectStatus(baseUrl, path, 200));
    }
    for (const path of mustBe404) {
      results.push(await expectStatus(baseUrl, path, 404));
    }
    for (const path of jsonEndpoints) {
      results.push(await expectJson(baseUrl, path));
    }
    for (const path of csvEndpoints) {
      results.push(await expectCsv(baseUrl, path));
    }
    results.push(await expectNoindexOnInvalidSort(baseUrl));
    results.push(await expectDistrictOfColumbiaPage(baseUrl));
    results.push(
      await expectRedirect(baseUrl, "/dc", 308, "/district-of-columbia"),
    );
    results.push(
      await expectRedirect(baseUrl, "/washington-dc", 308, "/district-of-columbia"),
    );

    let passed = 0;
    let failed = 0;
    for (const result of results) {
      printResult(result);
      if (result.passed) passed++;
      else failed++;
    }

    console.log("");
    console.log(`Smoke test summary: ${passed} passed, ${failed} failed`);
    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (error: unknown) {
    console.error("Smoke test runner failed before completion.");
    console.error(error instanceof Error ? error.message : String(error));
    if (stderrLines.length > 0) {
      console.error("Server stderr:");
      console.error(stderrLines.join("").trim());
    }
    if (stdoutLines.length > 0) {
      console.error("Server stdout:");
      console.error(stdoutLines.join("").trim());
    }
    process.exitCode = 1;
  } finally {
    await stopServer(serverProc);
  }
}

void main();
