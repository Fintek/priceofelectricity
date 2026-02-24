import { NextResponse } from "next/server";
import { buildContentRegistry } from "@/lib/contentRegistry";

export const dynamic = "force-static";
export const revalidate = 86400;

export function GET() {
  const nodes = buildContentRegistry();

  const body = {
    version: "1.0",
    generatedAt: new Date().toISOString(),
    totalNodes: nodes.length,
    nodes,
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
