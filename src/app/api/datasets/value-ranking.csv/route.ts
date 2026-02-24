import { NextResponse } from "next/server";
import { buildAllNormalizedStates } from "@/lib/stateBuilder";
import { toCSV } from "@/lib/csv";

export const dynamic = "force-static";
export const revalidate = 86400;

export function GET() {
  const rows = buildAllNormalizedStates()
    .sort((a, b) => b.valueScore - a.valueScore || a.name.localeCompare(b.name))
    .map((ns, i) => ({
      rank: i + 1,
      slug: ns.slug,
      name: ns.name,
      valueScore: ns.valueScore,
      valueTier: ns.valueTier,
      avgRateCentsPerKwh: ns.avgRateCentsPerKwh,
      affordabilityIndex: ns.affordabilityIndex,
      updated: ns.updated,
    }));

  return new NextResponse(toCSV(rows), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="value-ranking.csv"',
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
