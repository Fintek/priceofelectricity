import type { Metadata } from "next";
import Link from "next/link";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { SITE_URL } from "@/lib/site";

const BASE_URL = SITE_URL;

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Operational Metrics | PriceOfElectricity.com",
  description:
    "Operational metrics dashboard for PriceOfElectricity.com.",
  alternates: { canonical: `${BASE_URL}/metrics` },
  robots: { index: false, follow: false },
};

type ReleaseMetadata = {
  commit: string;
  builtAt: string;
  dataVersion: string;
  appVersion: string;
};

type ReadinessSummary = {
  generatedAt: string;
  commit: string;
  summary: { total: number; passed: number; failed: number };
};

async function readJson<T>(filename: string): Promise<T | null> {
  try {
    const raw = await readFile(join(process.cwd(), "public", filename), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function countSignupLines(): Promise<number | null> {
  const signupPath = join(process.cwd(), ".data", "alert-signups.jsonl");
  try {
    const info = await stat(signupPath);
    if (info.size === 0) return 0;
    const raw = await readFile(signupPath, "utf8");
    return raw.trim().split("\n").filter(Boolean).length;
  } catch {
    return null;
  }
}

export default async function MetricsPage() {
  const release = await readJson<ReleaseMetadata>("release.json");
  const readiness = await readJson<ReadinessSummary>("readiness.json");
  const signupCount = await countSignupLines();

  return (
    <main className="container">
      <h1>Operational Metrics</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        Internal operational dashboard. Data is from the most recent build.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Release</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
          <li>
            Commit: <code>{release?.commit ?? "unknown"}</code>
          </li>
          <li>Built at: {release?.builtAt ?? "unknown"}</li>
          <li>Data version: {release?.dataVersion ?? "unknown"}</li>
          <li>App version: {release?.appVersion ?? "unknown"}</li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Readiness</h2>
        {readiness ? (
          <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
            <li>
              Checks: {readiness.summary.passed}/{readiness.summary.total}{" "}
              passed
              {readiness.summary.failed > 0 && (
                <span style={{ color: "#dc2626" }}>
                  {" "}
                  ({readiness.summary.failed} failed)
                </span>
              )}
            </li>
            <li>Generated: {readiness.generatedAt}</li>
            <li>
              Audit commit: <code>{readiness.commit}</code>
            </li>
          </ul>
        ) : (
          <p className="muted">
            Not generated yet. Run <code>npm run readiness:audit</code>.
          </p>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Email Capture</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
          <li>
            Alert signups recorded:{" "}
            {signupCount !== null ? signupCount : "File sink not active"}
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>
          Future Metrics (Placeholder)
        </h2>
        <ul
          style={{
            paddingLeft: 20,
            lineHeight: 1.9,
            color: "#9ca3af",
          }}
        >
          <li>API request counts — not yet instrumented</li>
          <li>Offer click-through rate — not yet instrumented</li>
          <li>Error rate — not yet instrumented</li>
        </ul>
      </section>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/health">Health</Link> {" | "}
        <Link href="/status">Status</Link> {" | "}
        <Link href="/readiness">Readiness</Link> {" | "}
        <Link href="/api/v1/states" prefetch={false}>
          API v1
        </Link>
      </p>
    </main>
  );
}
