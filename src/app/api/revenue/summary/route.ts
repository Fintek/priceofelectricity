import { NextResponse } from "next/server";
import { getRevenueSummary } from "@/lib/revenueMetrics";
import { rateLimit, getClientIp } from "@/lib/rateLimiter";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const RATE_LIMIT = { windowMs: 60_000, max: 30 };

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const { allowed, remaining } = rateLimit(`revenue:${ip}`, RATE_LIMIT);

  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "Cache-Control": "no-store",
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  const summary = await getRevenueSummary();

  return NextResponse.json(summary, {
    headers: {
      "Cache-Control": "no-store",
      "X-RateLimit-Remaining": String(remaining),
    },
  });
}
