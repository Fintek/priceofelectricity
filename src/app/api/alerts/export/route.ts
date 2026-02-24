import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type StoredSignup = {
  createdAt?: string;
  email?: string;
  area?: string;
  state?: string;
  region?: string;
  frequency?: string;
  topics?: string[];
};

function getStorePath(): string {
  return path.join(process.cwd(), ".data", "alert-signups.jsonl");
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCsv(rows: StoredSignup[]): string {
  const header = [
    "createdAt",
    "email",
    "area",
    "state",
    "region",
    "frequency",
    "topics",
  ];

  const lines = rows.map((row) =>
    [
      row.createdAt ?? "",
      row.email ?? "",
      row.area ?? "",
      row.state ?? "",
      row.region ?? "",
      row.frequency ?? "",
      (row.topics ?? []).join("|"),
    ]
      .map((v) => csvEscape(v))
      .join(",")
  );

  return [header.join(","), ...lines].join("\n");
}

function unauthorized(): NextResponse {
  return NextResponse.json(
    { ok: false, error: "unauthorized" },
    { status: 401, headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET(request: Request) {
  const expectedToken = process.env.ALERT_EXPORT_TOKEN?.trim();
  if (!expectedToken) {
    return unauthorized();
  }

  const reqUrl = new URL(request.url);
  const provided =
    request.headers.get("x-export-token")?.trim() ??
    reqUrl.searchParams.get("token")?.trim();
  if (!provided || provided !== expectedToken) {
    return unauthorized();
  }

  const sinkMode = process.env.EMAIL_SINK?.trim().toLowerCase() || "log";
  if (sinkMode !== "file") {
    return new NextResponse(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    const raw = await readFile(getStorePath(), "utf8");
    const rows = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as StoredSignup;
        } catch {
          return null;
        }
      })
      .filter((row): row is StoredSignup => row !== null);

    if (rows.length === 0) {
      return new NextResponse(null, {
        status: 204,
        headers: { "Cache-Control": "no-store" },
      });
    }

    return new NextResponse(buildCsv(rows), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="alert-signups.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new NextResponse(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
