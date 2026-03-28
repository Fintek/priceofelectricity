import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  resolveTestPort,
  PREFERRED_TEST_PORT,
  startNextServer,
  stopServer,
  waitForServerReady,
  fetchWithTimeout,
} from "./_server";
import {
  getActiveApplianceCityPages,
  getActiveCityBillPages,
} from "../src/lib/longtail/rollout";
import { getActiveBillEstimatorProfilePages } from "../src/lib/longtail/billEstimator";
import { getUtilitiesByState } from "../src/data/utilities";

type CheckResult = {
  name: string;
  passed: boolean;
  details?: string;
};

type ReadinessReport = {
  generatedAt: string;
  commit: string;
  summary: { total: number; passed: number; failed: number };
  checks: CheckResult[];
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
  "https://priceofelectricity.com";

function getCommit(): string {
  try {
    const raw = readFileSync(
      join(process.cwd(), "public", "release.json"),
      "utf8",
    );
    const parsed = JSON.parse(raw) as { commit?: string };
    return typeof parsed.commit === "string" ? parsed.commit : "unknown";
  } catch {
    return "unknown";
  }
}

function pass(name: string, details?: string): CheckResult {
  console.log(`  ✓ ${name}${details ? ` (${details})` : ""}`);
  return { name, passed: true, details };
}

function fail(name: string, details?: string): CheckResult {
  console.error(`  ✗ ${name}${details ? ` — ${details}` : ""}`);
  return { name, passed: false, details };
}

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

// ── A) Core availability ──────────────────────────────────────────────

async function checkAvailability(base: string): Promise<CheckResult[]> {
  const paths = [
    "/",
    "/texas",
    "/national",
    "/drivers",
    "/regulatory",
    "/offers",
    "/alerts",
    "/api/v1/states",
  ];
  const results: CheckResult[] = [];
  for (const path of paths) {
    try {
      const res = await fetchWithTimeout(`${base}${path}`);
      if (res.status === 200) {
        results.push(pass(`${path} returns 200`));
      } else {
        results.push(fail(`${path} returns 200`, `got ${res.status}`));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push(fail(`${path} returns 200`, msg));
    }
  }
  return results;
}

// ── B) Canonical correctness ──────────────────────────────────────────

function extractCanonical(html: string): string | null {
  const m =
    html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/) ||
    html.match(/rel="canonical"[^>]+href="([^"]+)"/);
  return m ? m[1] : null;
}

async function checkCanonical(base: string): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  try {
    const res = await fetchWithTimeout(`${base}/`);
    const html = await res.text();
    const canonical = extractCanonical(html);
    if (!canonical) {
      results.push(fail("home canonical present"));
    } else if (canonical.includes("localhost")) {
      results.push(
        fail("home canonical no localhost", `got "${canonical}"`),
      );
    } else if (
      canonical.startsWith(SITE_URL) ||
      canonical.startsWith("https://priceofelectricity.com")
    ) {
      results.push(pass("home canonical correct", canonical));
    } else {
      results.push(
        fail("home canonical starts with SITE_URL", `got "${canonical}"`),
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push(fail("home canonical check", msg));
  }
  return results;
}

// ── C) Robots correctness ─────────────────────────────────────────────

async function checkRobots(base: string): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  try {
    const res = await fetchWithTimeout(`${base}/robots.txt`);
    if (!res.ok) {
      results.push(fail("robots.txt reachable", `status ${res.status}`));
      return results;
    }
    const body = await res.text();
    if (body.includes("Allow: /") || body.includes("allow: /")) {
      results.push(pass("robots.txt allows crawling"));
    } else if (body.includes("Disallow: /")) {
      results.push(
        fail(
          "robots.txt allows crawling",
          "found Disallow: / (expected in preview only)",
        ),
      );
    } else {
      results.push(pass("robots.txt allows crawling", "no blanket disallow"));
    }
    if (
      body.includes("Sitemap:") &&
      (body.includes("/sitemap.xml") || body.includes("/sitemap-index.xml"))
    ) {
      results.push(pass("robots.txt references sitemap"));
    } else {
      results.push(fail("robots.txt references sitemap"));
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push(fail("robots.txt check", msg));
  }
  return results;
}

// ── D) Sitemap correctness ────────────────────────────────────────────

async function checkSitemap(base: string): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const required = ["/sitemap/states.xml", "/sitemap/core.xml"];
  const segmentPaths = ["/sitemap/core.xml", "/sitemap/states.xml", "/sitemap/cities.xml", "/sitemap/appliances.xml", "/sitemap/estimators.xml"];
  try {
    const candidates = ["/sitemap.xml", "/sitemap-index.xml", "/sitemap/core.xml"];
    let selected: string | null = null;
    let body: string | null = null;
    for (const candidate of candidates) {
      const res = await fetchWithTimeout(`${base}${candidate}`);
      if (res.ok) {
        selected = candidate;
        body = await res.text();
        break;
      }
    }
    if (!selected || !body) {
      results.push(fail("sitemap endpoint reachable", "tried /sitemap.xml, /sitemap-index.xml, /sitemap/core.xml"));
      return results;
    }
    results.push(pass(`${selected} reachable`));
    for (const slug of required) {
      if (body.includes(slug)) {
        results.push(pass(`${selected} contains ${slug}`));
      } else {
        results.push(fail(`${selected} contains ${slug}`));
      }
    }

    const allPathnames: string[] = [];
    for (const segmentPath of segmentPaths) {
      const segmentRes = await fetchWithTimeout(`${base}${segmentPath}`);
      if (!segmentRes.ok) {
        results.push(fail(`${segmentPath} reachable`, `status ${segmentRes.status}`));
        continue;
      }
      results.push(pass(`${segmentPath} reachable`));
      const xml = await segmentRes.text();
      allPathnames.push(...extractSitemapPathnames(xml));
    }

    const estimatorProfilePath =
      /^\/electricity-bill-estimator\/([a-z-]+)\/(apartment|small-home|medium-home|large-home)\/?$/;
    const foundEstimatorProfileUrls = new Set(
      allPathnames
        .filter((pathname) => estimatorProfilePath.test(pathname))
        .map((pathname) => pathname.replace(/\/+$/, "")),
    );
    const expectedEstimatorProfileUrls = new Set(
      getActiveBillEstimatorProfilePages().map(
        (entry) => `/electricity-bill-estimator/${entry.slug}/${entry.profile}`,
      ),
    );
    const unexpectedEstimatorProfileUrls = [...foundEstimatorProfileUrls].filter(
      (url) => !expectedEstimatorProfileUrls.has(url),
    );
    const missingEstimatorProfileUrls = [...expectedEstimatorProfileUrls].filter(
      (url) => !foundEstimatorProfileUrls.has(url),
    );

    if (unexpectedEstimatorProfileUrls.length > 0) {
      results.push(
        fail(
          "estimator profile sitemap leakage is blocked",
          `unexpected profile URLs: ${unexpectedEstimatorProfileUrls.slice(0, 5).join(", ")}`,
        ),
      );
    } else {
      results.push(pass("estimator profile sitemap leakage is blocked"));
    }

    if (missingEstimatorProfileUrls.length > 0) {
      results.push(
        fail(
          "allowlisted estimator profile URLs are present in sitemap",
          `missing allowlisted profile URLs: ${missingEstimatorProfileUrls.slice(0, 5).join(", ")}`,
        ),
      );
    } else {
      results.push(pass("allowlisted estimator profile URLs are present in sitemap"));
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
    const unexpectedCityBillUrls = [...foundCityBillUrls].filter(
      (url) => !expectedCityBillUrls.has(url),
    );
    const missingCityBillUrls = [...expectedCityBillUrls].filter(
      (url) => !foundCityBillUrls.has(url),
    );

    if (unexpectedCityBillUrls.length > 0) {
      results.push(
        fail(
          "city bill sitemap leakage is blocked",
          `unexpected city bill URLs: ${unexpectedCityBillUrls.slice(0, 5).join(", ")}`,
        ),
      );
    } else {
      results.push(pass("city bill sitemap leakage is blocked"));
    }

    if (missingCityBillUrls.length > 0) {
      results.push(
        fail(
          "allowlisted city bill URLs are present in sitemap",
          `missing allowlisted city bill URLs: ${missingCityBillUrls.slice(0, 5).join(", ")}`,
        ),
      );
    } else {
      results.push(pass("allowlisted city bill URLs are present in sitemap"));
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
      results.push(
        fail(
          "appliance city sitemap leakage is blocked",
          `unexpected appliance city URLs: ${unexpectedApplianceCityUrls.slice(0, 5).join(", ")}`,
        ),
      );
    } else {
      results.push(pass("appliance city sitemap leakage is blocked"));
    }

    if (missingApplianceCityUrls.length > 0) {
      results.push(
        fail(
          "allowlisted appliance city URLs are present in sitemap",
          `missing allowlisted appliance city URLs: ${missingApplianceCityUrls.slice(0, 5).join(", ")}`,
        ),
      );
    } else {
      results.push(pass("allowlisted appliance city URLs are present in sitemap"));
    }

    const utilitiesListPath = /^\/([a-z-]+)\/utilities\/?$/;
    const statesWithUtilitiesInSitemap = new Set(
      allPathnames
        .filter((p) => utilitiesListPath.test(p))
        .map((p) => p.match(utilitiesListPath)![1]),
    );
    const statesWithNoUtilityData = [...statesWithUtilitiesInSitemap].filter(
      (stateSlug) => getUtilitiesByState(stateSlug).length === 0,
    );
    if (statesWithNoUtilityData.length > 0) {
      results.push(
        fail(
          "all sitemap utilities pages have backing data",
          `${statesWithNoUtilityData.length} state(s) with no utility records: ${statesWithNoUtilityData.slice(0, 5).join(", ")}`,
        ),
      );
    } else {
      results.push(pass("all sitemap utilities pages have backing data"));
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push(fail("sitemap check", msg));
  }
  return results;
}

// ── E) Security headers ──────────────────────────────────────────────

async function checkSecurityHeaders(base: string): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const required = [
    "x-content-type-options",
    "x-frame-options",
    "referrer-policy",
  ];
  try {
    const res = await fetchWithTimeout(`${base}/`);
    for (const header of required) {
      const value = res.headers.get(header);
      if (value) {
        results.push(pass(`header ${header}`, value));
      } else {
        results.push(fail(`header ${header}`, "missing"));
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push(fail("security headers check", msg));
  }
  return results;
}

// ── F) API contract ──────────────────────────────────────────────────

async function checkApiContract(base: string): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  try {
    const res = await fetchWithTimeout(`${base}/api/v1/states`);
    if (!res.ok) {
      results.push(fail("api/v1/states responds", `status ${res.status}`));
      return results;
    }
    const body = (await res.json()) as {
      version?: string;
      states?: unknown[];
    };
    if (body.version === "v1") {
      results.push(pass("api/v1/states version is v1"));
    } else {
      results.push(
        fail("api/v1/states version is v1", `got "${body.version}"`),
      );
    }
    if (Array.isArray(body.states) && body.states.length > 0) {
      results.push(
        pass("api/v1/states has states", `count: ${body.states.length}`),
      );
    } else {
      results.push(fail("api/v1/states has states", "empty or missing"));
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push(fail("api/v1/states contract", msg));
  }
  return results;
}

// ── G) Release metadata ──────────────────────────────────────────────

async function checkReleaseMetadata(base: string): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  try {
    const statusRes = await fetchWithTimeout(`${base}/status`);
    if (!statusRes.ok) {
      results.push(fail("/status reachable", `status ${statusRes.status}`));
    } else {
      const html = await statusRes.text();
      if (html.includes("Commit") && html.includes("Built at")) {
        results.push(pass("/status shows release metadata"));
      } else {
        results.push(
          fail("/status shows release metadata", "missing commit or builtAt"),
        );
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push(fail("/status check", msg));
  }

  try {
    const healthRes = await fetchWithTimeout(`${base}/health`);
    if (!healthRes.ok) {
      results.push(fail("/health reachable", `status ${healthRes.status}`));
    } else {
      const body = (await healthRes.json()) as {
        commit?: string;
        dataVersion?: string;
      };
      if (body.commit && body.dataVersion) {
        results.push(
          pass(
            "/health returns release fields",
            `commit=${body.commit} data=${body.dataVersion}`,
          ),
        );
      } else {
        results.push(
          fail("/health returns release fields", "missing commit or dataVersion"),
        );
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push(fail("/health check", msg));
  }

  return results;
}

async function checkTrafficDiscovery(base: string): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const checks: Array<{
    path: string;
    required: string[];
    label: string;
  }> = [
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
      label: "electricity-hubs links canonical clusters",
    },
    {
      path: "/energy-comparison",
      required: [
        "/electricity-cost-comparison/",
        "/electricity-usage-cost/",
        "/cost-to-run/",
        "/electricity-bill-estimator/",
        "/average-electricity-bill",
        "/electricity-cost-calculator",
        "/electricity-providers",
      ],
      label: "energy-comparison links canonical clusters",
    },
    {
      path: "/electricity-hubs/comparisons",
      required: [
        "/electricity-cost-comparison",
        "/compare",
        "/electricity-providers",
      ],
      label: "comparison hub links provider discovery",
    },
    {
      path: "/electricity-cost-comparison",
      required: [
        "/electricity-providers",
        "/electricity-cost",
      ],
      label: "comparison index links provider discovery",
    },
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
      label: "provider index links marketplace clusters",
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
      label: "provider state links canonical state clusters",
    },
    {
      path: "/texas",
      required: [
        "/electricity-providers/texas",
        "/offers/texas",
      ],
      label: "state page revenue pathway links",
    },
    {
      path: "/electricity-bill-estimator/texas",
      required: [
        "/electricity-providers/texas",
        "/offers/texas",
      ],
      label: "bill estimator revenue pathway links",
    },
  ];

  for (const check of checks) {
    try {
      const res = await fetchWithTimeout(`${base}${check.path}`);
      if (!res.ok) {
        results.push(fail(`${check.path} reachable`, `status ${res.status}`));
        continue;
      }
      results.push(pass(`${check.path} reachable`));
      const html = await res.text();
      for (const expected of check.required) {
        if (html.includes(expected)) {
          results.push(pass(`${check.label}: ${expected}`));
        } else {
          results.push(fail(`${check.label}: ${expected}`));
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push(fail(`${check.path} traffic discovery check`, msg));
    }
  }

  return results;
}

// ── Main ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("\n=== Production Readiness Audit ===\n");

  const port = await resolveTestPort(PREFERRED_TEST_PORT);
  const base = `http://127.0.0.1:${port}`;
  const proc = startNextServer(port);

  try {
    await waitForServerReady(base);

    const checks: CheckResult[] = [
      ...(await checkAvailability(base)),
      ...(await checkCanonical(base)),
      ...(await checkRobots(base)),
      ...(await checkSitemap(base)),
      ...(await checkSecurityHeaders(base)),
      ...(await checkApiContract(base)),
      ...(await checkReleaseMetadata(base)),
      ...(await checkTrafficDiscovery(base)),
    ];

    const passedCount = checks.filter((c) => c.passed).length;
    const failedCount = checks.filter((c) => !c.passed).length;

    const report: ReadinessReport = {
      generatedAt: new Date().toISOString(),
      commit: getCommit(),
      summary: {
        total: checks.length,
        passed: passedCount,
        failed: failedCount,
      },
      checks,
    };

    const outPath = join(process.cwd(), "public", "readiness.json");
    writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
    console.log(`\n  Wrote ${outPath}`);
    console.log(`  ${passedCount} passed, ${failedCount} failed\n`);

    if (failedCount > 0) {
      process.exitCode = 1;
    }
  } finally {
    await stopServer(proc);
  }
}

main().catch((err) => {
  console.error("Readiness audit crashed:", err);
  process.exit(1);
});
