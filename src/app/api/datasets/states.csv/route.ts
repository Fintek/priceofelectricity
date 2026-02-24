import { NextResponse } from "next/server";
import { buildAllNormalizedStates } from "@/lib/stateBuilder";
import { toCSV } from "@/lib/csv";

export const dynamic = "force-static";
export const revalidate = 86400;

export function GET() {
  const rows = buildAllNormalizedStates()
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

  return new NextResponse(toCSV(rows), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="states.csv"',
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
