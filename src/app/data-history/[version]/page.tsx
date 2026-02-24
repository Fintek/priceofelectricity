import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import {
  getSnapshot,
  getSnapshotVersions,
  getCurrentSnapshot,
} from "@/lib/snapshotLoader";
import { STATES } from "@/data/states";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 2592000;

export function generateStaticParams() {
  return getSnapshotVersions().map((version) => ({ version }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ version: string }>;
}): Promise<Metadata> {
  const { version } = await params;
  const snap = getSnapshot(version);
  if (!snap) return {};

  return {
    title: `Data Snapshot ${snap.version} | PriceOfElectricity.com`,
    description: `Electricity rate data snapshot ${snap.version}, released ${snap.releasedAt}. Average residential rates for all 50 states.`,
    alternates: { canonical: `${BASE_URL}/data-history/${snap.version}` },
    openGraph: {
      title: `Data Snapshot ${snap.version} | PriceOfElectricity.com`,
      description: `Electricity rate data snapshot ${snap.version} covering all 50 states.`,
      url: `${BASE_URL}/data-history/${snap.version}`,
    },
  };
}

export default async function SnapshotVersionPage({
  params,
}: {
  params: Promise<{ version: string }>;
}) {
  const { version } = await params;
  const snap = getSnapshot(version);
  if (!snap) notFound();

  const current = getCurrentSnapshot();
  const isCurrent = snap.version === current.version;
  const sorted = [...snap.states].sort((a, b) =>
    a.slug.localeCompare(b.slug)
  );

  const creativeWorkStructuredData = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: `Electricity Rate Snapshot ${snap.version}`,
    description: `Average residential electricity rates for all 50 US states as of ${snap.releasedAt}.`,
    url: `${BASE_URL}/data-history/${snap.version}`,
    datePublished: snap.releasedAt,
    dateModified: LAST_REVIEWED,
    author: {
      "@type": "Organization",
      name: "PriceOfElectricity.com",
    },
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(creativeWorkStructuredData),
        }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/data-history">Data History</Link> {"→"} {snap.version}
      </p>

      <h1>
        Data Snapshot: {snap.version}
        {isCurrent && (
          <span className="chip" style={{ marginLeft: 8, fontSize: 13 }}>
            current
          </span>
        )}
      </h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        Released <strong>{snap.releasedAt}</strong>. Contains average
        residential electricity rates (¢/kWh) for {snap.states.length} states.
      </p>

      <table>
        <thead>
          <tr>
            <th>State</th>
            <th style={{ textAlign: "right" }}>Rate (¢/kWh)</th>
            <th>Data period</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s) => {
            const stateInfo = STATES[s.slug];
            const name = stateInfo ? stateInfo.name : s.slug;
            return (
              <tr key={s.slug}>
                <td>
                  <Link href={`/${s.slug}`}>{name}</Link>
                </td>
                <td style={{ textAlign: "right" }}>{s.rate.toFixed(2)}</td>
                <td className="muted">{s.updated}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/data-history">← Back to Data History</Link>
      </p>
    </main>
  );
}
