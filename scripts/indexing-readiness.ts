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
  const expectedSitemap = `Sitemap: ${SITE_URL}/sitemap-index.xml`;
  if (body.includes("Sitemap:") && (body.includes("/sitemap.xml") || body.includes("/sitemap-index.xml"))) {
    pass(`/robots.txt contains sitemap directive`);
  } else {
    fail(`/robots.txt contains sitemap directive`, `expected "${expectedSitemap}"`);
  }
}

async function checkSitemap(base: string): Promise<void> {
  const candidates = ["/sitemap.xml", "/sitemap-index.xml", "/sitemap/states.xml"];
  let body: string | null = null;
  let selected: string | null = null;
  for (const candidate of candidates) {
    const res = await fetchWithTimeout(`${base}${candidate}`);
    if (res.ok) {
      body = await res.text();
      selected = candidate;
      break;
    }
  }
  if (!body || !selected) {
    fail("sitemap endpoint reachable", "tried /sitemap.xml, /sitemap-index.xml, /sitemap/states.xml");
    return;
  }
  pass(`${selected} reachable`);

  if (selected === "/sitemap-index.xml") {
    if (body.includes("/sitemap/states.xml")) {
      pass("/sitemap-index.xml references /sitemap/states.xml");
    } else {
      fail("/sitemap-index.xml references /sitemap/states.xml");
    }
    return;
  }
  if (body.includes("<loc>") && body.includes("/texas</loc>")) {
    pass(`${selected} contains /texas`);
  } else if (body.includes("/texas")) {
    pass(`${selected} references /texas`);
  } else {
    fail(`${selected} contains /texas`);
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
      label: "electricity-hubs discovery links",
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
        "/electricity-providers",
        "/electricity-cost",
      ],
      label: "comparison index provider discovery links",
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
