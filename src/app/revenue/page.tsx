import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { getRevenueSummary } from "@/lib/revenueMetrics";

const BASE_URL = SITE_URL;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Revenue Metrics | PriceOfElectricity.com",
  description: "Internal revenue funnel metrics for PriceOfElectricity.com.",
  alternates: { canonical: `${BASE_URL}/revenue` },
  robots: { index: false, follow: false },
};

function pct(value: number): string {
  return (value * 100).toFixed(2) + "%";
}

export default async function RevenuePage() {
  const summary = await getRevenueSummary();
  const topFive = summary.topStates.slice(0, 5);

  return (
    <main className="container">
      <h1>Revenue Metrics</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        Internal revenue funnel dashboard. Data is aggregated from
        server-side event logs.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Funnel Summary</h2>
        <table
          style={{
            borderCollapse: "collapse",
            fontSize: 14,
            width: "100%",
            maxWidth: 480,
          }}
        >
          <tbody>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={{ padding: "8px 12px", fontWeight: 600 }}>
                Offer Impressions
              </td>
              <td style={{ padding: "8px 12px", textAlign: "right" }}>
                {summary.impressions.toLocaleString()}
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={{ padding: "8px 12px", fontWeight: 600 }}>
                Offer Clicks
              </td>
              <td style={{ padding: "8px 12px", textAlign: "right" }}>
                {summary.clicks.toLocaleString()}
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={{ padding: "8px 12px", fontWeight: 600 }}>CTR</td>
              <td style={{ padding: "8px 12px", textAlign: "right" }}>
                {pct(summary.ctr)}
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={{ padding: "8px 12px", fontWeight: 600 }}>
                Alert Signups
              </td>
              <td style={{ padding: "8px 12px", textAlign: "right" }}>
                {summary.signups.toLocaleString()}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", fontWeight: 600 }}>
                Signup Rate
              </td>
              <td style={{ padding: "8px 12px", textAlign: "right" }}>
                {pct(summary.signupRate)}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {topFive.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>
            Top States by Clicks
          </h2>
          <table
            style={{
              borderCollapse: "collapse",
              fontSize: 14,
              width: "100%",
              maxWidth: 480,
            }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                <th style={{ padding: "8px 12px" }}>State</th>
                <th style={{ padding: "8px 12px", textAlign: "right" }}>
                  Impressions
                </th>
                <th style={{ padding: "8px 12px", textAlign: "right" }}>
                  Clicks
                </th>
              </tr>
            </thead>
            <tbody>
              {topFive.map((row) => (
                <tr
                  key={row.state}
                  style={{ borderBottom: "1px solid #f3f4f6" }}
                >
                  <td style={{ padding: "6px 12px" }}>{row.state}</td>
                  <td style={{ padding: "6px 12px", textAlign: "right" }}>
                    {row.impressions.toLocaleString()}
                  </td>
                  <td style={{ padding: "6px 12px", textAlign: "right" }}>
                    {row.clicks.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/offers">Offers</Link> {" | "}
        <Link href="/metrics">Metrics</Link> {" | "}
        <Link href="/api/revenue/summary" prefetch={false}>
          Revenue API
        </Link>
      </p>
    </main>
  );
}
