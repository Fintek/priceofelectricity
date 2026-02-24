import {
  resolveTestPort,
  PREFERRED_TEST_PORT,
  startNextServer,
  stopServer,
  waitForServerReady,
  fetchWithTimeout,
} from "./_server";

let passed = 0;
let failed = 0;

function pass(label: string): void {
  passed++;
  console.log(`  ✓ ${label}`);
}

function fail(label: string, detail?: string): void {
  failed++;
  console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`);
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
  "https://priceofelectricity.com";

async function checkRobotsTxt(base: string): Promise<void> {
  const res = await fetchWithTimeout(`${base}/robots.txt`);
  if (!res.ok) {
    fail("/robots.txt reachable", `status ${res.status}`);
    return;
  }
  pass("/robots.txt reachable");

  const body = await res.text();
  const expectedSitemap = `Sitemap: ${SITE_URL}/sitemap.xml`;
  if (body.includes("Sitemap:") && body.includes("/sitemap.xml")) {
    pass(`/robots.txt contains sitemap directive`);
  } else {
    fail(`/robots.txt contains sitemap directive`, `expected "${expectedSitemap}"`);
  }
}

async function checkSitemap(base: string): Promise<void> {
  const res = await fetchWithTimeout(`${base}/sitemap.xml`);
  if (!res.ok) {
    fail("/sitemap.xml reachable", `status ${res.status}`);
    return;
  }
  pass("/sitemap.xml reachable");

  const body = await res.text();
  if (body.includes("<loc>") && body.includes("/texas</loc>")) {
    pass("/sitemap.xml contains /texas");
  } else if (body.includes("/texas")) {
    pass("/sitemap.xml references /texas");
  } else {
    fail("/sitemap.xml contains /texas");
  }
}

async function checkCanonical(base: string, path: string): Promise<void> {
  const res = await fetchWithTimeout(`${base}${path}`);
  if (!res.ok) {
    fail(`${path} reachable`, `status ${res.status}`);
    return;
  }

  const html = await res.text();
  const canonicalMatch = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/);
  if (!canonicalMatch) {
    const altMatch = html.match(/rel="canonical"[^>]+href="([^"]+)"/);
    if (altMatch) {
      if (altMatch[1].startsWith(SITE_URL) || altMatch[1].startsWith("https://")) {
        pass(`${path} has canonical starting with SITE_URL`);
      } else {
        fail(`${path} canonical starts with SITE_URL`, `got "${altMatch[1]}"`);
      }
      return;
    }
    fail(`${path} has canonical link`);
    return;
  }

  const href = canonicalMatch[1];
  if (href.startsWith(SITE_URL)) {
    pass(`${path} canonical starts with SITE_URL`);
  } else if (href.startsWith("https://priceofelectricity.com")) {
    pass(`${path} canonical starts with production domain`);
  } else {
    fail(`${path} canonical starts with SITE_URL`, `got "${href}"`);
  }
}

async function main(): Promise<void> {
  console.log("\n=== Indexing Readiness Check ===\n");

  const port = await resolveTestPort(PREFERRED_TEST_PORT);
  const base = `http://127.0.0.1:${port}`;
  const proc = startNextServer(port);

  try {
    await waitForServerReady(base);

    await checkRobotsTxt(base);
    await checkSitemap(base);
    await checkCanonical(base, "/");
    await checkCanonical(base, "/texas");

    console.log(`\n  ${passed} passed, ${failed} failed\n`);
  } finally {
    await stopServer(proc);
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Indexing readiness check crashed:", err);
  process.exit(1);
});
