import { NextResponse } from "next/server";
import { buildAllNormalizedStates } from "@/lib/stateBuilder";
import { toCSV } from "@/lib/csv";

export const dynamic = "force-static";
export const revalidate = 86400;

export function GET() {
  const rows = buildAllNormalizedStates()
    .sort((a, b) => b.affordabilityIndex - a.affordabilityIndex || a.name.localeCompare(b.name))
    .map((ns, i) => ({
      rank: i + 1,
      slug: ns.slug,
      name: ns.name,
      affordabilityIndex: ns.affordabilityIndex,
      affordabilityCategory: ns.affordabilityCategory,
      avgRateCentsPerKwh: ns.avgRateCentsPerKwh,
      updated: ns.updated,
    }));

  return new NextResponse(toCSV(rows), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="affordability.csv"',
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
