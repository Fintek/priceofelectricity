import { NextResponse } from "next/server";
import { buildAllNormalizedStates } from "@/lib/stateBuilder";

export const dynamic = "force-static";
export const revalidate = 86400;

export function GET() {
  const states = buildAllNormalizedStates()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((ns) => ({
      slug: ns.slug,
      name: ns.name,
      avgRateCentsPerKwh: ns.avgRateCentsPerKwh,
      affordabilityIndex: ns.affordabilityIndex,
      affordabilityCategory: ns.affordabilityCategory,
      valueScore: ns.valueScore,
      valueTier: ns.valueTier,
      freshnessStatus: ns.freshnessStatus,
      updated: ns.updated,
    }));

  return NextResponse.json(states, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
