import type { Metadata } from "next";
import Link from "next/link";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { computeFreshness } from "@/lib/freshness";
import { LAST_REVIEWED, SITE_URL } from "@/lib/site";
import { buildAllNormalizedStates } from "@/lib/stateBuilder";

const BASE_URL = SITE_URL;

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Status | PriceOfElectricity.com",
  description:
    "Operational status for PriceOfElectricity.com, including release metadata, data version, state coverage, and freshness summary.",
  alternates: { canonical: `${BASE_URL}/status` },
  openGraph: {
    title: "Status | PriceOfElectricity.com",
    description:
      "Operational status for PriceOfElectricity.com, including release metadata, data version, state coverage, and freshness summary.",
    url: `${BASE_URL}/status`,
    siteName: "PriceOfElectricity.com",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Status | PriceOfElectricity.com",
    description:
      "Operational status for PriceOfElectricity.com, including release metadata, data version, state coverage, and freshness summary.",
  },
};

type ReleaseMetadata = {
  commit: string;
  builtAt: string;
  dataVersion: string;
  node: string;
  appVersion: string;
};

const UNKNOWN_RELEASE: ReleaseMetadata = {
  commit: "unknown",
  builtAt: "unknown",
  dataVersion: "unknown",
  node: "unknown",
  appVersion: "unknown",
};

async function getReleaseMetadata(): Promise<ReleaseMetadata> {
  try {
    const releasePath = join(process.cwd(), "public", "release.json");
    const raw = await readFile(releasePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<ReleaseMetadata>;
    return {
      commit: typeof parsed.commit === "string" ? parsed.commit : "unknown",
      builtAt: typeof parsed.builtAt === "string" ? parsed.builtAt : "unknown",
      dataVersion:
        typeof parsed.dataVersion === "string" ? parsed.dataVersion : "unknown",
      node: typeof parsed.node === "string" ? parsed.node : "unknown",
      appVersion:
        typeof parsed.appVersion === "string" ? parsed.appVersion : "unknown",
    };
  } catch {
    return UNKNOWN_RELEASE;
  }
}

export default async function StatusPage() {
  const release = await getReleaseMetadata();
  const states = buildAllNormalizedStates();
  const stateCount = states.length;
  const nationalAverageRate =
    stateCount > 0
      ? states.reduce((sum, state) => sum + state.avgRateCentsPerKwh, 0) /
        stateCount
      : 0;

  const freshnessCounts = states.reduce(
    (acc, state) => {
      const freshness = computeFreshness(state.updated);
      acc[freshness.status] += 1;
      return acc;
    },
    { fresh: 0, aging: 0, stale: 0 }
  );

  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Status",
    url: `${BASE_URL}/status`,
    description:
      "Operational status for PriceOfElectricity.com, including release metadata, data version, state coverage, and freshness summary.",
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageStructuredData),
        }}
      />

      <h1>Status</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        This page provides a lightweight snapshot of current data coverage and
        freshness across the platform.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>Release</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
          <li>Commit: {release.commit}</li>
          <li>Built at: {release.builtAt}</li>
          <li>Data version: {release.dataVersion}</li>
          <li>App version: {release.appVersion}</li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>Current snapshot</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
          <li>States covered: {stateCount}</li>
          <li>National average rate: {nationalAverageRate.toFixed(2)}¢/kWh</li>
          <li>Fresh: {freshnessCounts.fresh}</li>
          <li>Aging: {freshnessCounts.aging}</li>
          <li>Stale: {freshnessCounts.stale}</li>
          <li>Last reviewed: {LAST_REVIEWED}</li>
        </ul>
      </section>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/methodology">Methodology</Link> {" | "}
        <Link href="/datasets">Data</Link> {" | "}
        <Link href="/knowledge">Knowledge</Link>
      </p>
    </main>
  );
}
