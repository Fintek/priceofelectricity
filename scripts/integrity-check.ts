import type { ChildProcess } from "node:child_process";
import { buildContentRegistry } from "../src/lib/contentRegistry";
import {
  PREFERRED_TEST_PORT,
  resolveTestPort,
  startNextServer,
  stopServer,
  fetchWithTimeout,
  waitForServerReady,
} from "./_server";

const COLD_ISR_TIMEOUT_MS = 30_000;
const FETCH_CONCURRENCY = 8;
const PROGRESS_EVERY = 100;

async function runWithConcurrency<T>(
  items: T[],
  worker: (item: T) => Promise<void>,
  onProgress: (completed: number, total: number) => void,
): Promise<void> {
  if (items.length === 0) return;
  let nextIndex = 0;
  let completed = 0;
  const workerCount = Math.min(FETCH_CONCURRENCY, items.length);
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (true) {
        const idx = nextIndex++;
        if (idx >= items.length) return;
        await worker(items[idx] as T);
        completed++;
        if (completed % PROGRESS_EVERY === 0 || completed === items.length) {
          onProgress(completed, items.length);
        }
      }
    }),
  );
}

type RegistryError = {
  kind: string;
  detail: string;
};

type HttpFailure = {
  source: "registry" | "sitemap" | "hub-links";
  path: string;
  status?: number;
  detail?: string;
};

function toLocalPath(url: string): string | null {
  if (url.startsWith("/")) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  }
  return null;
}

function validateRegistry(): {
  errors: RegistryError[];
  internalPaths: string[];
} {
  const errors: RegistryError[] = [];
  const nodes = buildContentRegistry();

  const idSet = new Set<string>();
  const urlSet = new Set<string>();

  for (const node of nodes) {
    if (idSet.has(node.id)) {
      errors.push({ kind: "duplicate-id", detail: node.id });
    } else {
      idSet.add(node.id);
    }

    if (urlSet.has(node.url)) {
      errors.push({ kind: "duplicate-url", detail: node.url });
    } else {
      urlSet.add(node.url);
    }

    if (
      !(
        node.url.startsWith("/") ||
        node.url.startsWith("https://") ||
        node.url.startsWith("http://")
      )
    ) {
      errors.push({ kind: "invalid-url", detail: `${node.id}: ${node.url}` });
    }
  }

  for (const node of nodes) {
    if (node.parent && !idSet.has(node.parent)) {
      errors.push({
        kind: "missing-parent",
        detail: `${node.id} -> ${node.parent}`,
      });
    }
    if (node.related) {
      for (const relatedId of node.related) {
        if (!idSet.has(relatedId)) {
          errors.push({
            kind: "missing-related",
            detail: `${node.id} -> ${relatedId}`,
          });
        }
      }
    }
  }

  const internalPathSet = new Set<string>();
  for (const node of nodes) {
    const localPath = toLocalPath(node.url);
    if (localPath) internalPathSet.add(localPath);
  }

  return {
    errors,
    internalPaths: [...internalPathSet].sort((a, b) => a.localeCompare(b)),
  };
}

async function fetchLocalPath(
  baseUrl: string,
  path: string,
  timeoutMs?: number,
): Promise<{ ok: true } | { ok: false; status?: number; detail: string }> {
  try {
    const res = await fetchWithTimeout(`${baseUrl}${path}`, timeoutMs);
    if (res.status >= 500) {
      return { ok: false, status: res.status, detail: "server error" };
    }
    if (res.status === 404) {
      return { ok: false, status: res.status, detail: "not found" };
    }
    if (res.status === 200) {
      return { ok: true };
    }
    return { ok: false, status: res.status, detail: "non-success status" };
  } catch (error: unknown) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

async function collectSitemapPaths(baseUrl: string): Promise<string[]> {
  const candidates = ["/sitemap.xml", "/sitemap-index.xml", "/sitemap/core.xml"];
  let xml: string | null = null;
  for (const candidate of candidates) {
    try {
      const res = await fetchWithTimeout(`${baseUrl}${candidate}`, COLD_ISR_TIMEOUT_MS);
      if (res.status === 200) {
        xml = await res.text();
        break;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`  sitemap probe failed for ${candidate}: ${message}`);
    }
  }
  if (!xml) {
    throw new Error("Failed to fetch sitemap source (tried /sitemap.xml, /sitemap-index.xml, /sitemap/core.xml)");
  }
  const locRegex = /<loc>(.*?)<\/loc>/g;
  const paths = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = locRegex.exec(xml)) !== null) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    const local = toLocalPath(raw);
    if (local) paths.add(local);
  }
  return [...paths].sort((a, b) => a.localeCompare(b));
}

async function collectInternalLinksFromHubs(baseUrl: string): Promise<string[]> {
  const hubs = ["/", "/guides", "/research", "/topics", "/offers", "/methodology"];
  const hrefRegex = /href="(\/[^"#?][^"]*)"/g;
  const links = new Set<string>();

  for (const hub of hubs) {
    const res = await fetchWithTimeout(`${baseUrl}${hub}`, COLD_ISR_TIMEOUT_MS);
    if (res.status !== 200) continue;
    const html = await res.text();
    let match: RegExpExecArray | null;
    while ((match = hrefRegex.exec(html)) !== null) {
      const href = match[1];
      if (!href) continue;
      if (href.startsWith("/out/")) continue;
      links.add(href);
    }
  }

  return [...links].sort((a, b) => a.localeCompare(b));
}

async function main(): Promise<void> {
  const registryValidation = validateRegistry();

  console.log(`Registry nodes: ${registryValidation.internalPaths.length} internal URLs`);
  if (registryValidation.errors.length > 0) {
    console.error("Registry validation failed:");
    for (const err of registryValidation.errors) {
      console.error(`  - ${err.kind}: ${err.detail}`);
    }
    process.exit(1);
  }
  console.log("Registry structure checks passed.");

  const port = await resolveTestPort(PREFERRED_TEST_PORT);
  const baseUrl = `http://127.0.0.1:${port}`;
  let serverProc: ChildProcess | undefined;

  const failures: HttpFailure[] = [];
  let passCount = 0;

  try {
    console.log(`Starting production server on ${baseUrl}`);
    serverProc = startNextServer(port);
    await waitForServerReady(baseUrl);
    console.log("Server ready. Running integrity checks...");

    console.log(
      `Registry HTTP checks: ${registryValidation.internalPaths.length} URLs (concurrency ${FETCH_CONCURRENCY})`,
    );
    await runWithConcurrency(
      registryValidation.internalPaths,
      async (path) => {
        const result = await fetchLocalPath(baseUrl, path);
        if (result.ok) {
          passCount++;
        } else {
          failures.push({
            source: "registry",
            path,
            status: result.status,
            detail: result.detail,
          });
        }
      },
      (done, total) => console.log(`  registry: ${done}/${total}`),
    );

    const sitemapPaths = await collectSitemapPaths(baseUrl);
    console.log(`Sitemap URLs: ${sitemapPaths.length}`);
    await runWithConcurrency(
      sitemapPaths,
      async (path) => {
        const result = await fetchLocalPath(baseUrl, path);
        if (result.ok) {
          passCount++;
        } else {
          failures.push({
            source: "sitemap",
            path,
            status: result.status,
            detail: result.detail,
          });
        }
      },
      (done, total) => console.log(`  sitemap: ${done}/${total}`),
    );

    const alreadyChecked = new Set<string>([
      ...registryValidation.internalPaths,
      ...sitemapPaths,
    ]);
    const hubLinks = await collectInternalLinksFromHubs(baseUrl);
    const newHubLinks = hubLinks.filter((p) => !alreadyChecked.has(p));
    console.log(
      `Hub internal links: ${hubLinks.length} total, ${newHubLinks.length} new (${hubLinks.length - newHubLinks.length} already checked)`,
    );
    await runWithConcurrency(
      newHubLinks,
      async (path) => {
        const result = await fetchLocalPath(baseUrl, path, COLD_ISR_TIMEOUT_MS);
        if (result.ok) {
          passCount++;
        } else {
          failures.push({
            source: "hub-links",
            path,
            status: result.status,
            detail: result.detail,
          });
        }
      },
      (done, total) => console.log(`  hub-links: ${done}/${total}`),
    );

    console.log("");
    console.log(
      `Integrity summary: ${passCount} passed, ${failures.length} failed`
    );

    if (failures.length > 0) {
      console.error("Integrity failures:");
      for (const f of failures) {
        const statusPart = f.status ? ` status=${f.status}` : "";
        const detailPart = f.detail ? ` ${f.detail}` : "";
        console.error(`  - [${f.source}] ${f.path}${statusPart}${detailPart}`);
      }
      process.exit(1);
    }
  } finally {
    if (serverProc) {
      await stopServer(serverProc);
    }
  }
}

void main();
