import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { STATE_SLUGS } from "@/data/stateSlugs";
import { LEGACY_REDIRECTS } from "@/lib/redirectMap";
import { rateLimit, getClientIp } from "@/lib/rateLimiter";

const STATE_SLUG_SET = new Set<string>(STATE_SLUGS);

function normalizeCandidateSlug(input: string): string {
  let value = input;
  try {
    value = decodeURIComponent(input);
  } catch {
    value = input;
  }

  return value
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const ROUTE_ALLOWED_PARAMS: Record<string, string[]> = {
  "/compare": ["sort"],
  "/affordability": ["sort"],
  "/index-ranking": ["sort"],
  "/value-ranking": ["sort"],
  "/search": ["q"],
};

function getAllowedParams(pathname: string): Set<string> {
  if (pathname in ROUTE_ALLOWED_PARAMS) {
    return new Set(ROUTE_ALLOWED_PARAMS[pathname]);
  }

  if (/^\/[a-z0-9-]+\/plans$/.test(pathname)) {
    return new Set(["sort"]);
  }

  return new Set();
}

const SPAM_BOT_PATTERNS = ["python-requests", "scrapy"];

function isSpamBot(request: NextRequest): boolean {
  const ua = request.headers.get("user-agent")?.toLowerCase() ?? "";
  if (!ua) return false;

  for (const pattern of SPAM_BOT_PATTERNS) {
    if (ua.includes(pattern)) return true;
  }

  if (ua.includes("curl/") && !request.headers.get("x-request-id")) {
    return true;
  }

  return false;
}

const API_RATE_LIMITS: Record<string, { windowMs: number; max: number }> = {
  "/api/v1/states": { windowMs: 60_000, max: 60 },
  "/api/v1/state": { windowMs: 60_000, max: 60 },
  "/api/alerts/signup": { windowMs: 600_000, max: 5 },
  "/api/indexnow": { windowMs: 3_600_000, max: 10 },
};

function matchRateLimitRoute(pathname: string): string | null {
  if (pathname === "/api/v1/states") return "/api/v1/states";
  if (pathname.startsWith("/api/v1/state/")) return "/api/v1/state";
  if (pathname === "/api/alerts/signup") return "/api/alerts/signup";
  if (pathname === "/api/indexnow") return "/api/indexnow";
  return null;
}

function addSecurityHeaders(response: NextResponse): void {
  if (!response.headers.has("X-Content-Type-Options")) {
    response.headers.set("X-Content-Type-Options", "nosniff");
  }
  if (!response.headers.has("X-Frame-Options")) {
    response.headers.set("X-Frame-Options", "DENY");
  }
  if (!response.headers.has("Referrer-Policy")) {
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  }
  if (!response.headers.has("Permissions-Policy")) {
    response.headers.set(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=()",
    );
  }
  if (
    process.env.NODE_ENV === "production" &&
    !response.headers.has("Strict-Transport-Security")
  ) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  let needsRedirect = false;

  // --- Legacy redirect map (301) ---
  const legacyTarget = LEGACY_REDIRECTS[url.pathname];
  if (legacyTarget) {
    url.pathname = legacyTarget;
    return NextResponse.redirect(url, 301);
  }

  // --- Force lowercase ---
  const lowered = url.pathname.toLowerCase();
  if (url.pathname !== lowered) {
    url.pathname = lowered;
    needsRedirect = true;
  }

  // --- Remove trailing slash (except root) ---
  if (url.pathname !== "/" && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
    needsRedirect = true;
  }

  // --- State slug normalization (single-segment, non-file paths) ---
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length === 1) {
    const segment = segments[0];
    if (!segment.includes(".")) {
      const normalized = normalizeCandidateSlug(segment);
      if (STATE_SLUG_SET.has(normalized) && segment !== normalized) {
        url.pathname = `/${normalized}`;
        needsRedirect = true;
      }
    }
  }

  // --- Strip disallowed query params (skip /api/ routes) ---
  if (!url.pathname.startsWith("/api/")) {
    const allowed = getAllowedParams(url.pathname);
    const keys = [...url.searchParams.keys()];
    const toRemove = keys.filter((k) => !allowed.has(k));
    if (toRemove.length > 0) {
      for (const k of toRemove) {
        url.searchParams.delete(k);
      }
      needsRedirect = true;
    }
  }

  if (needsRedirect) {
    return NextResponse.redirect(url, 308);
  }

  // --- API route protections ---
  if (url.pathname.startsWith("/api/")) {
    // Bot filtering
    if (isSpamBot(request)) {
      const blocked = NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 },
      );
      addSecurityHeaders(blocked);
      return blocked;
    }

    // Rate limiting
    const rateLimitRoute = matchRateLimitRoute(url.pathname);
    if (rateLimitRoute) {
      const ip = getClientIp(request);
      const limitKey = `${rateLimitRoute}:${ip}`;
      const config = API_RATE_LIMITS[rateLimitRoute];
      const { allowed, remaining } = rateLimit(limitKey, config);

      if (!allowed) {
        console.warn(
          JSON.stringify({
            level: "warn",
            message: "rate_limit_exceeded",
            timestamp: new Date().toISOString(),
            route: rateLimitRoute,
            ip,
          }),
        );
        const limited = NextResponse.json(
          { ok: false, error: "rate_limited" },
          { status: 429 },
        );
        limited.headers.set("Retry-After", String(Math.ceil(config.windowMs / 1000)));
        addSecurityHeaders(limited);
        return limited;
      }

      const requestId =
        request.headers.get("x-request-id") ?? crypto.randomUUID();

      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-request-id", requestId);

      const response = NextResponse.next({
        request: { headers: requestHeaders },
        headers: { "x-request-id": requestId },
      });
      response.headers.set("X-RateLimit-Remaining", String(remaining));
      addSecurityHeaders(response);
      return response;
    }

    // Non-rate-limited API routes still get request ID + security headers
    const requestId =
      request.headers.get("x-request-id") ?? crypto.randomUUID();

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-request-id", requestId);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
      headers: { "x-request-id": requestId },
    });
    addSecurityHeaders(response);
    return response;
  }

  // --- Non-API routes: security headers only ---
  const response = NextResponse.next();
  addSecurityHeaders(response);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
