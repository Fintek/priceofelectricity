import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import { STATES } from "@/data/states";
import {
  getAllSnapshots,
  compareSnapshots,
  type SnapshotDelta,
} from "@/lib/snapshotLoader";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

const TITLE = "Electricity Rate Change Trends";
const DESCRIPTION =
  "Which U.S. states have seen the largest electricity rate increases and decreases between data snapshots.";

export const metadata: Metadata = {
  title: `${TITLE} | PriceOfElectricity.com`,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/national/trends` },
  openGraph: {
    title: `${TITLE} | PriceOfElectricity.com`,
    description: DESCRIPTION,
    url: `${BASE_URL}/national/trends`,
  },
};

export default function NationalTrendsPage() {
  const snapshots = getAllSnapshots();
  const hasHistory = snapshots.length >= 2;

  let increases: SnapshotDelta[] = [];
  let decreases: SnapshotDelta[] = [];
  let oldVersion = "";
  let newVersion = "";

  if (hasHistory) {
    const oldest = snapshots[0];
    const newest = snapshots[snapshots.length - 1];
    oldVersion = oldest.version;
    newVersion = newest.version;
    const deltas = compareSnapshots(oldVersion, newVersion);
    if (deltas) {
      increases = [...deltas]
        .filter((d) => d.delta > 0)
        .sort((a, b) => b.delta - a.delta)
        .slice(0, 10);
      decreases = [...deltas]
        .filter((d) => d.delta < 0)
        .sort((a, b) => a.delta - b.delta)
        .slice(0, 10);
    }
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    description: DESCRIPTION,
    url: `${BASE_URL}/national/trends`,
    dateModified: LAST_REVIEWED,
  };

  function stateName(slug: string): string {
    return STATES[slug]?.name ?? slug;
  }

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/">Home</Link> {" → "}
        <Link href="/national">National Overview</Link> {" → "} Trends
      </p>

      <h1>{TITLE}</h1>

      {hasHistory ? (
        <>
          <p className="intro muted" style={{ marginTop: 0 }}>
            Rate changes between snapshot {oldVersion} and {newVersion}. Deltas
            reflect the difference in average residential electricity rate
            (¢/kWh) between the two data versions.
          </p>

          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 22, marginBottom: 12 }}>
              Largest rate increases
            </h2>
            {increases.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 14,
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: "2px solid #ddd" }}>
                      <th
                        style={{ textAlign: "left", padding: "8px 12px 8px 0" }}
                      >
                        State
                      </th>
                      <th style={{ textAlign: "right", padding: "8px 12px" }}>
                        Old rate
                      </th>
                      <th style={{ textAlign: "right", padding: "8px 12px" }}>
                        New rate
                      </th>
                      <th
                        style={{ textAlign: "right", padding: "8px 0 8px 12px" }}
                      >
                        Change
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {increases.map((d, i) => (
                      <tr
                        key={d.slug}
                        style={{
                          borderBottom: "1px solid #eee",
                          backgroundColor:
                            i % 2 === 0 ? "transparent" : "#fafafa",
                        }}
                      >
                        <td style={{ padding: "6px 12px 6px 0" }}>
                          <Link href={`/${d.slug}`}>{stateName(d.slug)}</Link>
                        </td>
                        <td
                          style={{ padding: "6px 12px", textAlign: "right" }}
                        >
                          {d.oldRate.toFixed(2)}
                        </td>
                        <td
                          style={{ padding: "6px 12px", textAlign: "right" }}
                        >
                          {d.newRate.toFixed(2)}
                        </td>
                        <td
                          style={{
                            padding: "6px 0 6px 12px",
                            textAlign: "right",
                            color: "#c33",
                          }}
                        >
                          +{d.delta.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">No rate increases detected.</p>
            )}
          </section>

          <section style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 22, marginBottom: 12 }}>
              Largest rate decreases
            </h2>
            {decreases.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 14,
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: "2px solid #ddd" }}>
                      <th
                        style={{ textAlign: "left", padding: "8px 12px 8px 0" }}
                      >
                        State
                      </th>
                      <th style={{ textAlign: "right", padding: "8px 12px" }}>
                        Old rate
                      </th>
                      <th style={{ textAlign: "right", padding: "8px 12px" }}>
                        New rate
                      </th>
                      <th
                        style={{ textAlign: "right", padding: "8px 0 8px 12px" }}
                      >
                        Change
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {decreases.map((d, i) => (
                      <tr
                        key={d.slug}
                        style={{
                          borderBottom: "1px solid #eee",
                          backgroundColor:
                            i % 2 === 0 ? "transparent" : "#fafafa",
                        }}
                      >
                        <td style={{ padding: "6px 12px 6px 0" }}>
                          <Link href={`/${d.slug}`}>{stateName(d.slug)}</Link>
                        </td>
                        <td
                          style={{ padding: "6px 12px", textAlign: "right" }}
                        >
                          {d.oldRate.toFixed(2)}
                        </td>
                        <td
                          style={{ padding: "6px 12px", textAlign: "right" }}
                        >
                          {d.newRate.toFixed(2)}
                        </td>
                        <td
                          style={{
                            padding: "6px 0 6px 12px",
                            textAlign: "right",
                            color: "#393",
                          }}
                        >
                          {d.delta.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">No rate decreases detected.</p>
            )}
          </section>
        </>
      ) : (
        <section style={{ marginTop: 24 }}>
          <p>
            Trend analysis requires at least two data snapshots. Currently only
            one snapshot is available. As additional snapshots are generated
            through the data build pipeline, this page will automatically show
            rate change trends.
          </p>
          <p>
            See <Link href="/data-history">data history</Link> for available
            snapshots and <Link href="/datasets">data downloads</Link> for
            current state data.
          </p>
        </section>
      )}

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/national">National overview</Link> {" | "}
        <Link href="/national/rankings">Rankings</Link> {" | "}
        <Link href="/data-history">Data history</Link> {" | "}
        <Link href="/research">Research</Link>
      </p>
    </main>
  );
}
