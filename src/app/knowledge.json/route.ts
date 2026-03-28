import { NextResponse } from "next/server";
import { buildKnowledgePack } from "@/lib/knowledgePack";

export const dynamic = "force-dynamic";

export function GET() {
  const body = buildKnowledgePack();

  return NextResponse.json(body, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
