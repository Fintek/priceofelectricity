import {
  resolveTestPort,
  startNextServer,
  stopServer,
  waitForServerReady,
  fetchWithTimeout,
} from "./_server";

const TEST_PATHS = [
  "/",
  "/electricity-cost-comparison",
  "/texas",
  "/national",
  "/drivers",
  "/regulatory",
  "/offers",
  "/alerts",
  "/knowledge",
  "/electricity-cost/california",
  "/electricity-cost-comparison/california-vs-texas",
  "/energy-comparison/states",
  "/electricity-hubs/usage",
  "/electricity-cost-calculator",
];

const MIN_DESCRIPTION_LENGTH = 50;
const HUB_PATH = "/electricity-hubs/usage";
const BILL_CALCULATOR_PATH = "/electricity-cost-calculator";
const KWH_COST_CALCULATOR_TITLE_PATTERN = /kwh\s*cost\s*calculator/i;

type CheckResult = {
  path: string;
  passed: boolean;
  failures: string[];
};

function canonicalPathname(canonical: string): string {
  try {
    const pathname = new URL(canonical).pathname;
    return pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  } catch {
    return canonical;
  }
}

function checkHtml(path: string, html: string): CheckResult {
  const failures: string[] = [];

  if (!/<html[^>]*\slang="en"/.test(html)) {
    failures.push("Missing <html lang=\"en\">");
  }

  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (!titleMatch || !titleMatch[1].trim()) {
    failures.push("Missing or empty <title>");
  }

  const descMatch = html.match(
    /<meta\s+name="description"\s+content="([^"]*)"/i,
  ) ?? html.match(
    /<meta\s+content="([^"]*)"\s+name="description"/i,
  );
  if (!descMatch || !descMatch[1].trim()) {
    failures.push("Missing <meta name=\"description\">");
  } else if (descMatch[1].trim().length < MIN_DESCRIPTION_LENGTH) {
    failures.push(
      `Description too short (${descMatch[1].trim().length} chars, min ${MIN_DESCRIPTION_LENGTH})`,
    );
  }

  const canonicalMatch = html.match(
    /<link\s+rel="canonical"\s+href="([^"]*)"/i,
  ) ?? html.match(
    /<link\s+href="([^"]*)"\s+rel="canonical"/i,
  );
  if (!canonicalMatch || !canonicalMatch[1].trim()) {
    failures.push("Missing <link rel=\"canonical\">");
  }

  const robotsMeta = html.match(
    /<meta\s+name="robots"\s+content="([^"]*)"/i,
  ) ?? html.match(
    /<meta\s+content="([^"]*)"\s+name="robots"/i,
  );
  if (robotsMeta && /noindex/i.test(robotsMeta[1])) {
    failures.push("Page has noindex in robots meta tag");
  }

  const INTERNAL_JARGON_IN_DESCRIPTION = [
    "canonical",
    "curated slice",
    "rollout-gated",
    "allowlist",
    "pilot",
    "discovery directory",
  ];
  if (descMatch?.[1]) {
    const desc = descMatch[1].toLowerCase();
    for (const term of INTERNAL_JARGON_IN_DESCRIPTION) {
      if (desc.includes(term)) {
        failures.push(`Meta description contains internal jargon: "${term}"`);
      }
    }
  }

  if (path === HUB_PATH) {
    const title = titleMatch?.[1]?.trim() ?? "";
    if (!KWH_COST_CALCULATOR_TITLE_PATTERN.test(title)) {
      failures.push("Hub title should target kWh cost calculator head terms");
    }
    const canonical = canonicalMatch?.[1]?.trim() ?? "";
    if (canonicalPathname(canonical) !== HUB_PATH) {
      failures.push(`Hub canonical pathname should be ${HUB_PATH} (got ${canonical || "missing"})`);
    }
  }

  if (path === BILL_CALCULATOR_PATH) {
    const title = titleMatch?.[1]?.trim() ?? "";
    if (KWH_COST_CALCULATOR_TITLE_PATTERN.test(title)) {
      failures.push("Bill calculator page title should not target kWh cost calculator head terms");
    }
  }

  return { path, passed: failures.length === 0, failures };
}

function checkCalculatorTitleDifferentiation(
  hubHtml: string,
  billCalculatorHtml: string,
): CheckResult {
  const failures: string[] = [];
  const hubTitle = hubHtml.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? "";
  const billTitle =
    billCalculatorHtml.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? "";

  if (!hubTitle || !billTitle) {
    failures.push("Missing title on hub or bill calculator page for differentiation check");
  } else if (hubTitle.toLowerCase() === billTitle.toLowerCase()) {
    failures.push("Hub and bill calculator pages share the same <title>");
  } else if (
    KWH_COST_CALCULATOR_TITLE_PATTERN.test(billTitle) &&
    KWH_COST_CALCULATOR_TITLE_PATTERN.test(hubTitle)
  ) {
    failures.push("Hub and bill calculator both lead with kWh cost calculator in <title>");
  }

  return {
    path: `${HUB_PATH} vs ${BILL_CALCULATOR_PATH}`,
    passed: failures.length === 0,
    failures,
  };
}

async function main() {
  const port = await resolveTestPort();
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log(`Starting production server on ${baseUrl}`);
  const proc = startNextServer(port);

  try {
    await waitForServerReady(baseUrl);
    console.log("Server ready. Running SEO checks...\n");

    let passed = 0;
    let failed = 0;
    const htmlByPath = new Map<string, string>();

    for (const path of TEST_PATHS) {
      const url = `${baseUrl}${path}`;
      const res = await fetchWithTimeout(url);
      if (!res.ok) {
        console.log(`FAIL ${path} => HTTP ${res.status}`);
        failed++;
        continue;
      }

      const html = await res.text();
      htmlByPath.set(path, html);
      const result = checkHtml(path, html);

      if (result.passed) {
        console.log(`PASS ${path}`);
        passed++;
      } else {
        console.log(`FAIL ${path}`);
        for (const f of result.failures) {
          console.log(`  - ${f}`);
        }
        failed++;
      }
    }

    const hubHtml = htmlByPath.get(HUB_PATH);
    const billHtml = htmlByPath.get(BILL_CALCULATOR_PATH);
    if (hubHtml && billHtml) {
      const diffResult = checkCalculatorTitleDifferentiation(hubHtml, billHtml);
      if (diffResult.passed) {
        console.log(`PASS ${diffResult.path}`);
        passed++;
      } else {
        console.log(`FAIL ${diffResult.path}`);
        for (const f of diffResult.failures) {
          console.log(`  - ${f}`);
        }
        failed++;
      }
    }

    console.log(`\nSEO check summary: ${passed} passed, ${failed} failed`);

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    await stopServer(proc);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
