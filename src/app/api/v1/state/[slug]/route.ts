import { NextResponse } from "next/server";
import { STATES } from "@/data/states";
import { buildNormalizedState } from "@/lib/stateBuilder";
import { getDriversForState } from "@/content/drivers";
import { getRateCasesForState, getTimelineForState } from "@/content/regulatory";
import type { ApiStateDetail, ApiStateResponse } from "@/lib/apiSchemas";
import { log } from "@/lib/logger";

export const dynamicParams = false;

const AVG_MONTHLY_KWH = 1000;

export function generateStaticParams() {
  return Object.keys(STATES).map((slug) => ({ slug }));
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;

  if (!STATES[slug]) {
    log("warn", "api/v1/state not found", {
      route: "/api/v1/state/[slug]",
      slug,
    });
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const ns = buildNormalizedState(slug);
  const drivers = getDriversForState(slug);
  const openCases = getRateCasesForState(slug).filter((c) => c.status === "open");
  const timeline = getTimelineForState(slug);

  const detail: ApiStateDetail = {
    slug: ns.slug,
    name: ns.name,
    avgResidentialRate: ns.avgRateCentsPerKwh,
    avgMonthlyBill: Math.round(((AVG_MONTHLY_KWH * ns.avgRateCentsPerKwh) / 100) * 100) / 100,
    affordabilityIndex: ns.affordabilityIndex,
    valueScore: ns.valueScore,
    drivers: drivers.map((d) => d.id),
    openRateCases: openCases.length,
    timelineEvents: timeline.length,
    lastUpdated: ns.updated,
  };

  const body: ApiStateResponse = {
    version: "v1",
    generatedAt: new Date().toISOString(),
    state: detail,
  };

  log("debug", "api/v1/state generated", {
    route: "/api/v1/state/[slug]",
    slug,
  });

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
