import { NextResponse } from "next/server";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const message =
      typeof body.message === "string" ? body.message : "Unknown error";
    const digest =
      typeof body.digest === "string" ? body.digest : undefined;

    log("error", "unhandled render error", {
      requestId: request.headers.get("x-request-id") ?? "",
      route: "error-boundary",
      errorMessage: message,
      digest,
    });
  } catch {
    log("error", "unhandled render error", {
      route: "error-boundary",
      errorMessage: "failed to parse error report",
    });
  }

  return NextResponse.json({ ok: true }, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
