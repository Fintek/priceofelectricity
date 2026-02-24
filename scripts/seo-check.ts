import {
  resolveTestPort,
  startNextServer,
  stopServer,
  waitForServerReady,
  fetchWithTimeout,
} from "./_server";

const TEST_PATHS = [
  "/",
  "/texas",
  "/national",
  "/drivers",
  "/regulatory",
  "/offers",
  "/alerts",
  "/knowledge",
];

const MIN_DESCRIPTION_LENGTH = 50;

type CheckResult = {
  path: string;
  passed: boolean;
  failures: string[];
};

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

  return { path, passed: failures.length === 0, failures };
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

    for (const path of TEST_PATHS) {
      const url = `${baseUrl}${path}`;
      const res = await fetchWithTimeout(url);
      if (!res.ok) {
        console.log(`FAIL ${path} => HTTP ${res.status}`);
        failed++;
        continue;
      }

      const html = await res.text();
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
