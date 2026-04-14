import {
  resolveTestPort,
  PREFERRED_TEST_PORT,
  startNextServer,
  stopServer,
  waitForServerReady,
  fetchWithTimeout,
} from "./_server";
import { getActiveBillEstimatorProfilePages } from "../src/lib/longtail/billEstimator";
import {
  getActiveApplianceCityPages,
  getActiveCityBillPages,
  getActiveCitiesForState,
} from "../src/lib/longtail/rollout";
import { findLegacyCityRedirectShapesInSitemaps } from "./legacyCitySitemapGuards";

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
const CANONICAL_SITE_URL = SITE_URL.replace("://www.", "://");

function extractSitemapPathnames(xml: string): string[] {
  const locPattern = /<loc>([^<]+)<\/loc>/g;
  const paths: string[] = [];
  for (const match of xml.matchAll(locPattern)) {
    const value = match[1]?.trim();
    if (!value) continue;
    try {
      paths.push(new URL(value).pathname);
    } catch {
      // Ignore malformed URL-like values.
    }
  }
  return paths;
}

async function checkRobotsTxt(base: string): Promise<void> {
  const res = await fetchWithTimeout(`${base}/robots.txt`);
  if (!res.ok) {
    fail("/robots.txt reachable", `status ${res.status}`);
    return;
  }
  pass("/robots.txt reachable");

  const body = await res.text();
  const expectedSitemap = `Sitemap: ${CANONICAL_SITE_URL}/sitemap-index.xml`;
  if (body.includes(expectedSitemap)) {
    pass(`/robots.txt sitemap directive uses canonical origin`);
  } else if (body.includes("Sitemap:") && body.includes("/sitemap-index.xml")) {
    fail(`/robots.txt sitemap uses canonical origin`, `expected "${expectedSitemap}"`);
  } else {
    fail(`/robots.txt contains sitemap directive`, `expected "${expectedSitemap}"`);
  }

  if (body.includes("www.priceofelectricity.com")) {
    fail("/robots.txt no www origin", "found www.priceofelectricity.com — canonical is non-www");
  }
}

const EXPECTED_SITEMAP_SEGMENTS = ["core", "states", "cities", "appliances", "estimators"];

async function checkSitemap(base: string): Promise<void> {
  const indexRes = await fetchWithTimeout(`${base}/sitemap-index.xml`);
  if (!indexRes.ok) {
    fail("/sitemap-index.xml reachable", `status ${indexRes.status}`);
    return;
  }
  pass("/sitemap-index.xml reachable");

  const indexBody = await indexRes.text();
  for (const segment of EXPECTED_SITEMAP_SEGMENTS) {
    if (indexBody.includes(`/sitemap/${segment}.xml`)) {
      pass(`/sitemap-index.xml references /sitemap/${segment}.xml`);
    } else {
      fail(`/sitemap-index.xml references /sitemap/${segment}.xml`);
    }
  }

  const coreRes = await fetchWithTimeout(`${base}/sitemap/core.xml`);
  if (!coreRes.ok) {
    fail("/sitemap/core.xml reachable", `status ${coreRes.status}`);
    return;
  }
  pass("/sitemap/core.xml reachable");
  const coreBody = await coreRes.text();

  if (coreBody.includes("/electricity-cost-comparison/")) {
    pass("core sitemap includes /electricity-cost-comparison/ canonical family");
  } else {
    fail("core sitemap includes /electricity-cost-comparison/ canonical family");
  }
}

async function checkDeferredRouteLeakage(base: string): Promise<void> {
  const allPathnames: string[] = [];
  for (const segment of EXPECTED_SITEMAP_SEGMENTS) {
    const res = await fetchWithTimeout(`${base}/sitemap/${segment}.xml`);
    if (res.ok) {
      const xml = await res.text();
      allPathnames.push(...extractSitemapPathnames(xml));
    }
  }

  const legacyComparePairPath = /^\/compare\/[a-z]+-vs-[a-z]+\/?$/;
  if (allPathnames.some((pathname) => legacyComparePairPath.test(pathname))) {
    fail("no /compare/{pair} redirect routes in sitemap", "found legacy redirect URLs — these should only appear as /electricity-cost-comparison/{pair}");
  } else {
    pass("no /compare/{pair} redirect routes in sitemap");
  }

  const legacyCityShapes = findLegacyCityRedirectShapesInSitemaps(allPathnames);
  if (legacyCityShapes.length > 0) {
    fail(
      "no legacy city redirect URL shapes in sitemap",
      `found non-canonical city aliases — use /electricity-cost/{state}/{city} only: ${legacyCityShapes.slice(0, 5).join(", ")}`,
    );
  } else {
    pass("no legacy city redirect URL shapes in sitemap");
  }

  const estimatorProfilePath = /^\/electricity-bill-estimator\/([a-z-]+)\/(apartment|small-home|medium-home|large-home)\/?$/;
  const foundProfileUrls = new Set(
    allPathnames
      .filter((pathname) => estimatorProfilePath.test(pathname))
      .map((pathname) => pathname.replace(/\/+$/, "")),
  );

  const expectedProfileUrls = new Set(
    getActiveBillEstimatorProfilePages().map((entry) => `/electricity-bill-estimator/${entry.slug}/${entry.profile}`),
  );
  const unexpectedProfileUrls = [...foundProfileUrls].filter((url) => !expectedProfileUrls.has(url));
  const missingProfileUrls = [...expectedProfileUrls].filter((url) => !foundProfileUrls.has(url));

  if (unexpectedProfileUrls.length > 0) {
    fail(
      "estimator profile sitemap leakage is blocked",
      `unexpected profile URLs: ${unexpectedProfileUrls.slice(0, 5).join(", ")}`,
    );
  } else {
    pass("estimator profile sitemap leakage is blocked");
  }

  if (missingProfileUrls.length > 0) {
    fail(
      "allowlisted estimator profile URLs are present in sitemap",
      `missing allowlisted profile URLs: ${missingProfileUrls.slice(0, 5).join(", ")}`,
    );
  } else {
    pass("allowlisted estimator profile URLs are present in sitemap");
  }

  const cityBillPath = /^\/average-electricity-bill\/([a-z-]+)\/([a-z-]+)\/?$/;
  const foundCityBillUrls = new Set(
    allPathnames
      .filter((pathname) => cityBillPath.test(pathname))
      .map((pathname) => pathname.replace(/\/+$/, "")),
  );
  const expectedCityBillUrls = new Set(
    getActiveCityBillPages().map(
      (entry) => `/average-electricity-bill/${entry.stateSlug}/${entry.citySlug}`,
    ),
  );
  const unexpectedCityBillUrls = [...foundCityBillUrls].filter((url) => !expectedCityBillUrls.has(url));
  const missingCityBillUrls = [...expectedCityBillUrls].filter((url) => !foundCityBillUrls.has(url));

  if (unexpectedCityBillUrls.length > 0) {
    fail(
      "city bill sitemap leakage is blocked",
      `unexpected city bill URLs: ${unexpectedCityBillUrls.slice(0, 5).join(", ")}`,
    );
  } else {
    pass("city bill sitemap leakage is blocked");
  }

  if (missingCityBillUrls.length > 0) {
    fail(
      "allowlisted city bill URLs are present in sitemap",
      `missing allowlisted city bill URLs: ${missingCityBillUrls.slice(0, 5).join(", ")}`,
    );
  } else {
    pass("allowlisted city bill URLs are present in sitemap");
  }

  const applianceCityPath = /^\/cost-to-run\/([a-z0-9-]+)\/([a-z-]+)\/([a-z0-9-]+)\/?$/;
  const foundApplianceCityUrls = new Set(
    allPathnames
      .filter((pathname) => applianceCityPath.test(pathname))
      .map((pathname) => pathname.replace(/\/+$/, "")),
  );
  const expectedApplianceCityUrls = new Set(
    getActiveApplianceCityPages().map(
      (entry) => `/cost-to-run/${entry.applianceSlug}/${entry.stateSlug}/${entry.citySlug}`,
    ),
  );
  const unexpectedApplianceCityUrls = [...foundApplianceCityUrls].filter(
    (url) => !expectedApplianceCityUrls.has(url),
  );
  const missingApplianceCityUrls = [...expectedApplianceCityUrls].filter(
    (url) => !foundApplianceCityUrls.has(url),
  );

  if (unexpectedApplianceCityUrls.length > 0) {
    fail(
      "appliance city sitemap leakage is blocked",
      `unexpected appliance city URLs: ${unexpectedApplianceCityUrls.slice(0, 5).join(", ")}`,
    );
  } else {
    pass("appliance city sitemap leakage is blocked");
  }

  if (missingApplianceCityUrls.length > 0) {
    fail(
      "allowlisted appliance city URLs are present in sitemap",
      `missing allowlisted appliance city URLs: ${missingApplianceCityUrls.slice(0, 5).join(", ")}`,
    );
  } else {
    pass("allowlisted appliance city URLs are present in sitemap");
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

async function checkDiscoveryHubs(base: string): Promise<void> {
  const stateSlugForCityLinks = "texas";
  const cityPathChecks = getActiveCitiesForState(stateSlugForCityLinks).map(
    (c) => `/electricity-cost/${stateSlugForCityLinks}/${c.slug}`,
  );

  const checks: Array<{
    path: string;
    required: string[];
    label: string;
  }> = [
    {
      path: "/",
      required: ['href="/electricity-cost-comparison"', 'href="/energy-comparison"'],
      label: "home header links comparison hubs",
    },
    {
      path: "/electricity-hubs",
      required: [
        "/electricity-cost",
        "/average-electricity-bill",
        "/electricity-bill-estimator",
        "/electricity-cost-calculator",
        "/electricity-usage",
        "/energy-comparison",
        "/electricity-providers",
      ],
      label: "electricity-hubs discovery links",
    },
    {
      path: "/energy-comparison",
      required: [
        "/energy-comparison/states",
        "/energy-comparison/usage",
        "/energy-comparison/appliances",
        "/electricity-cost-comparison/",
        "/electricity-usage-cost/",
        "/cost-to-run/",
        "/electricity-bill-estimator/",
        "/average-electricity-bill",
        "/electricity-cost-calculator",
        "/electricity-providers",
      ],
      label: "energy-comparison canonical cluster links",
    },
    {
      path: "/electricity-hubs/comparisons",
      required: [
        "/electricity-cost-comparison",
        "/compare",
        "/electricity-providers",
      ],
      label: "comparison hub provider discovery links",
    },
    {
      path: "/electricity-cost-comparison",
      required: [
        'id="all-comparisons"',
        "/electricity-providers",
        "/electricity-cost",
      ],
      label: "comparison index provider discovery links",
    },
    ...(cityPathChecks.length > 0
      ? [
          {
            path: `/electricity-cost/${stateSlugForCityLinks}`,
            required: cityPathChecks,
            label: `electricity-cost/${stateSlugForCityLinks} links active city pages`,
          },
        ]
      : []),
    {
      path: "/electricity-providers",
      required: [
        "/electricity-providers/texas",
        "/electricity-cost-comparison",
        "/electricity-cost",
        "/energy-comparison",
        "/electricity-hubs",
        "/offers",
        "/electricity-shopping/by-state",
      ],
      label: "provider marketplace index discovery links",
    },
    {
      path: "/electricity-providers/texas",
      required: [
        "/electricity-cost/texas",
        "/average-electricity-bill/texas",
        "/electricity-bill-estimator/texas",
        "/energy-comparison",
        "/electricity-hubs",
        "/offers/texas",
        "/electricity-cost-calculator/texas",
      ],
      label: "provider state page canonical cluster links",
    },
    {
      path: "/texas",
      required: [
        "/electricity-providers/texas",
        "/offers/texas",
      ],
      label: "state electricity page revenue pathways",
    },
    {
      path: "/electricity-bill-estimator/texas",
      required: [
        "/electricity-providers/texas",
        "/offers/texas",
      ],
      label: "bill estimator revenue pathways",
    },
  ];

  for (const check of checks) {
    const res = await fetchWithTimeout(`${base}${check.path}`);
    if (!res.ok) {
      fail(`${check.path} reachable`, `status ${res.status}`);
      continue;
    }
    pass(`${check.path} reachable`);
    const html = await res.text();
    for (const expected of check.required) {
      if (html.includes(expected)) {
        pass(`${check.label} includes ${expected}`);
      } else {
        fail(`${check.label} includes ${expected}`);
      }
    }
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
    await checkDeferredRouteLeakage(base);
    await checkCanonical(base, "/");
    await checkCanonical(base, "/texas");
    await checkDiscoveryHubs(base);

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
