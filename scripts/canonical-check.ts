import { buildContentRegistry } from "../src/lib/contentRegistry";
import { SITE_URL } from "../src/lib/site";

type Failure = {
  source: "registry";
  id: string;
  url: string;
  reason: string;
};

function isAbsoluteHttpUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

function checkRegistryCanonicals(): Failure[] {
  const failures: Failure[] = [];
  const nodes = buildContentRegistry();

  for (const node of nodes) {
    const url = node.url;
    if (!isAbsoluteHttpUrl(url)) {
      failures.push({
        source: "registry",
        id: node.id,
        url,
        reason: "not-absolute-http-url",
      });
      continue;
    }

    if (!(url === SITE_URL || url.startsWith(`${SITE_URL}/`))) {
      failures.push({
        source: "registry",
        id: node.id,
        url,
        reason: "does-not-start-with-site-url",
      });
    }
  }

  const isProductionCanonical =
    SITE_URL.startsWith("https://") && !SITE_URL.includes("localhost");

  if (isProductionCanonical) {
    for (const node of nodes) {
      if (node.url.includes("localhost")) {
        failures.push({
          source: "registry",
          id: node.id,
          url: node.url,
          reason: "contains-localhost-while-site-url-is-production",
        });
      }
    }
  }

  return failures;
}

function run(): number {
  console.log(`Canonical check using SITE_URL=${SITE_URL}`);
  const failures = checkRegistryCanonicals();

  if (failures.length === 0) {
    console.log("Canonical check passed.");
    return 0;
  }

  console.error(`Canonical check failed (${failures.length} issue(s)):\n`);
  for (const failure of failures) {
    console.error(
      `- [${failure.source}] ${failure.id} -> ${failure.url} (${failure.reason})`
    );
  }
  return 1;
}

process.exit(run());
