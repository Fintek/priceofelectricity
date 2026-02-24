import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import { getAllSnapshots, getCurrentSnapshot } from "@/lib/snapshotLoader";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

export const metadata: Metadata = {
  title: "Data History | PriceOfElectricity.com",
  description:
    "Browse historical snapshots of electricity rate data. Compare versions to see how rates changed over time.",
  alternates: { canonical: `${BASE_URL}/data-history` },
  openGraph: {
    title: "Data History | PriceOfElectricity.com",
    description:
      "Browse historical snapshots of electricity rate data across all 50 states.",
    url: `${BASE_URL}/data-history`,
  },
};

export default function DataHistoryPage() {
  const snapshots = getAllSnapshots();
  const current = getCurrentSnapshot();

  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Data History",
    description:
      "Historical snapshots of electricity rate data for all 50 US states.",
    url: `${BASE_URL}/data-history`,
    dateModified: LAST_REVIEWED,
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageStructuredData),
        }}
      />

      <h1>Data History</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        PriceOfElectricity.com maintains versioned snapshots of electricity rate
        data. Each snapshot captures state-level average residential rates at a
        point in time. The current version is{" "}
        <strong>{current.version}</strong> (released {current.releasedAt}).
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Available snapshots</h2>
        <table>
          <thead>
            <tr>
              <th>Version</th>
              <th>Released</th>
              <th>States</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {snapshots.map((snap) => (
              <tr key={snap.version}>
                <td>
                  <Link href={`/data-history/${snap.version}`}>
                    {snap.version}
                  </Link>
                  {snap.version === current.version && (
                    <span
                      className="chip"
                      style={{ marginLeft: 6, fontSize: 11 }}
                    >
                      current
                    </span>
                  )}
                </td>
                <td>{snap.releasedAt}</td>
                <td>{snap.states.length}</td>
                <td>
                  <Link href={`/data-history/${snap.version}`}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {snapshots.length >= 2 && (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 22, marginBottom: 8 }}>Compare versions</h2>
          <p style={{ marginTop: 0 }}>
            See how rates changed between snapshots.
          </p>
          <p>
            <Link
              href={`/data-history/compare?v1=${snapshots[0].version}&v2=${snapshots[snapshots.length - 1].version}`}
            >
              Compare {snapshots[0].version} vs{" "}
              {snapshots[snapshots.length - 1].version}
            </Link>
          </p>
        </section>
      )}

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/datasets">Data downloads</Link> {" | "}
        <Link href="/data-policy">Data policy</Link> {" | "}
        <Link href="/methodology">Methodology</Link>
      </p>
    </main>
  );
}
