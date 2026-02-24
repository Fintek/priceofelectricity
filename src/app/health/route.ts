import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE_URL } from "@/lib/site";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ReleaseMetadata = {
  commit: string;
  builtAt: string;
  dataVersion: string;
};

const UNKNOWN_RELEASE: ReleaseMetadata = {
  commit: "unknown",
  builtAt: "unknown",
  dataVersion: "unknown",
};

async function readReleaseMetadata(): Promise<ReleaseMetadata> {
  try {
    const releasePath = join(process.cwd(), "public", "release.json");
    const raw = await readFile(releasePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<ReleaseMetadata>;
    return {
      commit: typeof parsed.commit === "string" ? parsed.commit : "unknown",
      builtAt: typeof parsed.builtAt === "string" ? parsed.builtAt : "unknown",
      dataVersion:
        typeof parsed.dataVersion === "string" ? parsed.dataVersion : "unknown",
    };
  } catch {
    return UNKNOWN_RELEASE;
  }
}

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? "";
  const release = await readReleaseMetadata();

  log("debug", "health check", {
    requestId,
    route: "/health",
    commit: release.commit,
  });

  return NextResponse.json(
    {
      status: "ok",
      commit: release.commit,
      builtAt: release.builtAt,
      site: SITE_URL,
      dataVersion: release.dataVersion,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
