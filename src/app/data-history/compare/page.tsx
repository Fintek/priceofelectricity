import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import {
  compareSnapshots,
  getSnapshotVersions,
  getSnapshot,
} from "@/lib/snapshotLoader";
import { STATES } from "@/data/states";

const BASE_URL = SITE_URL;

export function generateMetadata({
  searchParams,
}: {
  searchParams: { v1?: string; v2?: string };
}): Metadata {
  const v1 = searchParams.v1;
  const v2 = searchParams.v2;
  const hasValid = v1 && v2 && getSnapshot(v1) && getSnapshot(v2);

  return {
    title: hasValid
      ? `Compare ${v1} vs ${v2} | Data History | PriceOfElectricity.com`
      : "Compare Data Snapshots | PriceOfElectricity.com",
    description: hasValid
      ? `Side-by-side comparison of electricity rate snapshots ${v1} and ${v2} across all 50 states.`
      : "Compare historical electricity rate data snapshots to see how prices changed over time.",
    alternates: { canonical: `${BASE_URL}/data-history/compare` },
    openGraph: {
      title: "Compare Data Snapshots | PriceOfElectricity.com",
      description:
        "Compare historical electricity rate data snapshots across all 50 states.",
      url: `${BASE_URL}/data-history/compare`,
    },
  };
}

export default function DataHistoryComparePage({
  searchParams,
}: {
  searchParams: { v1?: string; v2?: string };
}) {
  const versions = getSnapshotVersions();
  const v1 = searchParams.v1;
  const v2 = searchParams.v2;
  const deltas = v1 && v2 ? compareSnapshots(v1, v2) : null;

  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Compare Data Snapshots",
    description:
      "Compare historical electricity rate data snapshots across states.",
    url: `${BASE_URL}/data-history/compare`,
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

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/data-history">Data History</Link> {"→"} Compare
      </p>

      <h1>Compare Data Snapshots</h1>

      {!v1 || !v2 || !deltas ? (
        <section>
          <p className="intro muted" style={{ marginTop: 0 }}>
            Select two snapshot versions to compare electricity rates
            side-by-side. Add <code>?v1=&lt;version&gt;&amp;v2=&lt;version&gt;</code>{" "}
            to the URL.
          </p>
          <p>Available versions: {versions.join(", ")}</p>
          {versions.length >= 2 && (
            <p>
              <Link
                href={`/data-history/compare?v1=${versions[0]}&v2=${versions[versions.length - 1]}`}
              >
                Compare {versions[0]} vs {versions[versions.length - 1]}
              </Link>
            </p>
          )}
        </section>
      ) : (
        <>
          <p className="intro muted" style={{ marginTop: 0 }}>
            Showing rate changes from <strong>{v1}</strong> to{" "}
            <strong>{v2}</strong> across {deltas.length} states.
          </p>

          <table>
            <thead>
              <tr>
                <th>State</th>
                <th style={{ textAlign: "right" }}>
                  {v1} (¢/kWh)
                </th>
                <th style={{ textAlign: "right" }}>
                  {v2} (¢/kWh)
                </th>
                <th style={{ textAlign: "right" }}>Delta</th>
              </tr>
            </thead>
            <tbody>
              {deltas.map((d) => {
                const stateInfo = STATES[d.slug];
                const name = stateInfo ? stateInfo.name : d.slug;
                const sign = d.delta > 0 ? "+" : "";
                return (
                  <tr key={d.slug}>
                    <td>
                      <Link href={`/${d.slug}`}>{name}</Link>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {d.oldRate.toFixed(2)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {d.newRate.toFixed(2)}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        color:
                          d.delta > 0
                            ? "#c0392b"
                            : d.delta < 0
                              ? "#27ae60"
                              : undefined,
                      }}
                    >
                      {sign}
                      {d.delta.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/data-history">← Back to Data History</Link> {" | "}
        <Link href="/datasets">Data downloads</Link>
      </p>
    </main>
  );
}
