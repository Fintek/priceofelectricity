import { NextResponse } from "next/server";
import { buildAllNormalizedStates } from "@/lib/stateBuilder";
import type { ApiStateSummary, ApiStatesResponse } from "@/lib/apiSchemas";
import { log } from "@/lib/logger";

export const dynamic = "force-static";
export const revalidate = 86400;

const AVG_MONTHLY_KWH = 1000;

function toSummary(s: ReturnType<typeof buildAllNormalizedStates>[number]): ApiStateSummary {
  return {
    slug: s.slug,
    name: s.name,
    avgResidentialRate: s.avgRateCentsPerKwh,
    avgMonthlyBill: Math.round(((AVG_MONTHLY_KWH * s.avgRateCentsPerKwh) / 100) * 100) / 100,
    affordabilityIndex: s.affordabilityIndex,
    valueScore: s.valueScore,
    lastUpdated: s.updated,
  };
}

export function GET(): NextResponse<ApiStatesResponse> {
  const all = buildAllNormalizedStates()
    .sort((a, b) => a.name.localeCompare(b.name));

  const body: ApiStatesResponse = {
    version: "v1",
    generatedAt: new Date().toISOString(),
    states: all.map(toSummary),
  };

  log("debug", "api/v1/states generated", {
    route: "/api/v1/states",
    count: all.length,
  });

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
