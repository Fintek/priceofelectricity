import { NextResponse } from "next/server";
import { log } from "@/lib/logger";

const INDEXNOW_ENDPOINT = "https://www.bing.com/indexnow";
const MAX_URLS = 10_000;

function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    "https://priceofelectricity.com"
  );
}

function getHostname(siteUrl: string): string {
  try {
    return new URL(siteUrl).hostname;
  } catch {
    return "priceofelectricity.com";
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = request.headers.get("x-request-id") ?? "";
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    log("warn", "indexnow key not configured", {
      requestId,
      route: "/api/indexnow",
    });
    return NextResponse.json(
      { error: "INDEXNOW_KEY not configured" },
      { status: 401 },
    );
  }

  const headerKey = request.headers.get("x-indexnow-key");
  if (headerKey !== key) {
    log("warn", "indexnow unauthorized", {
      requestId,
      route: "/api/indexnow",
    });
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (process.env.INDEXNOW_ENABLED !== "true") {
    log("info", "indexnow disabled", {
      requestId,
      route: "/api/indexnow",
    });
    return NextResponse.json(
      { error: "IndexNow disabled. Set INDEXNOW_ENABLED=true to enable." },
      { status: 409 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    log("warn", "indexnow invalid json", {
      requestId,
      route: "/api/indexnow",
    });
    return NextResponse.json(
      { error: "invalid JSON body" },
      { status: 400 },
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("urls" in body) ||
    !Array.isArray((body as Record<string, unknown>).urls)
  ) {
    return NextResponse.json(
      { error: 'body must contain { urls: string[] }' },
      { status: 400 },
    );
  }

  const urls = (body as { urls: unknown[] }).urls;

  if (urls.length === 0) {
    return NextResponse.json(
      { error: "urls array is empty" },
      { status: 400 },
    );
  }

  if (urls.length > MAX_URLS) {
    return NextResponse.json(
      { error: `max ${MAX_URLS} urls per request` },
      { status: 400 },
    );
  }

  const siteUrl = getSiteUrl();

  for (const u of urls) {
    if (typeof u !== "string" || !u.startsWith(siteUrl)) {
      return NextResponse.json(
        { error: `all urls must start with ${siteUrl}` },
        { status: 400 },
      );
    }
  }

  const hostname = getHostname(siteUrl);
  const keyLocation = `${siteUrl}/api/indexnow/key.txt`;

  const payload = {
    host: hostname,
    key,
    keyLocation,
    urlList: urls,
  };

  try {
    const resp = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });

    log("info", "indexnow success", {
      requestId,
      route: "/api/indexnow",
      submitted: urls.length,
      bingStatus: resp.status,
    });

    return NextResponse.json(
      {
        ok: true,
        bingStatus: resp.status,
        bingBody: await resp.text().catch(() => ""),
        submitted: urls.length,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log("error", "indexnow outbound fetch failed", {
      requestId,
      route: "/api/indexnow",
      detail: message,
    });
    return NextResponse.json(
      { ok: false, error: "outbound fetch failed", detail: message },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
