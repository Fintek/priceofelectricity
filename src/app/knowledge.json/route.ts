import { NextResponse } from "next/server";
import { buildKnowledgePack } from "@/lib/knowledgePack";

export const dynamic = "force-static";
export const revalidate = 86400;

export function GET() {
  const body = buildKnowledgePack();

  return NextResponse.json(body, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
