import type { Metadata } from "next";
import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STATES } from "@/data/states";
import { SITE_URL, LAST_REVIEWED, formatPublicReviewDate } from "@/lib/site";
import { isValidStateSlug } from "@/lib/slugGuard";
import { getRateCasesForState } from "@/content/regulatory";

const BASE_URL = SITE_URL;
export const dynamicParams = true;
export const revalidate = 2592000;

type PageParams = Promise<{ state: string }>;

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { state } = await params;
  if (!isValidStateSlug(state)) return {};
  const s = STATES[state];
  const title = `${s.name} Rate Cases`;
  const description = `All tracked electricity rate cases in ${s.name}, including open, closed, and unknown status cases.`;

  return {
    title: `${title} | PriceOfElectricity.com`,
    description,
    alternates: { canonical: `${BASE_URL}/regulatory/${state}/rate-cases` },
    openGraph: {
      title: `${title} | PriceOfElectricity.com`,
      description,
      url: `${BASE_URL}/regulatory/${state}/rate-cases`,
    },
  };
}

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  closed: "Closed",
  unknown: "Unknown",
};

const CONFIDENCE_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export default function RateCasesPage({
  params,
}: {
  params: PageParams;
}) {
  const { state } = use(params);
  if (!isValidStateSlug(state)) notFound();

  const s = STATES[state];
  const cases = getRateCasesForState(state);

  const webPageData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${s.name} Rate Cases`,
    description: `Tracked electricity rate cases in ${s.name}.`,
    url: `${BASE_URL}/regulatory/${state}/rate-cases`,
    dateModified: LAST_REVIEWED,
  };

  const itemListData =
    cases.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Rate Cases in ${s.name}`,
          numberOfItems: cases.length,
          itemListElement: cases.map((rc, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: rc.utility ?? rc.docket ?? rc.id,
            url: `${BASE_URL}/regulatory/${state}/rate-cases`,
          })),
        }
      : null;

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageData) }}
      />
      {itemListData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListData) }}
        />
      )}

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/">Home</Link> {" → "}
        <Link href="/regulatory">Regulatory</Link> {" → "}
        <Link href={`/regulatory/${state}`}>{s.name}</Link> {" → "} Rate Cases
      </p>

      <h1>{s.name} Rate Cases</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        All tracked electricity rate cases for {s.name}. Rate cases are filed by
        utilities with the state public utility commission and can result in
        changes to residential electricity rates.
      </p>

      {cases.length > 0 ? (
        <div style={{ overflowX: "auto", marginTop: 20 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
                <th style={{ padding: "8px 12px" }}>Utility</th>
                <th style={{ padding: "8px 12px" }}>Docket</th>
                <th style={{ padding: "8px 12px" }}>Filed</th>
                <th style={{ padding: "8px 12px" }}>Status</th>
                <th style={{ padding: "8px 12px" }}>Confidence</th>
                <th style={{ padding: "8px 12px" }}>Reviewed</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((rc) => (
                <tr key={rc.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px 12px" }}>
                    {rc.utility ?? "—"}
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    {rc.docket ?? "—"}
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    {rc.filedDate ?? "—"}
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    {STATUS_LABELS[rc.status]}
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    {CONFIDENCE_LABELS[rc.confidence]}
                  </td>
                  <td style={{ padding: "8px 12px" }}>{formatPublicReviewDate(rc.lastReviewed)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {cases.map((rc) => (
            <div key={rc.id} style={{ marginTop: 16 }}>
              <p style={{ margin: 0 }}>
                <b>{rc.utility ?? rc.docket ?? rc.id}</b>
              </p>
              <p className="muted" style={{ margin: "4px 0 0", fontSize: 14 }}>
                {rc.summary}
              </p>
              {rc.relatedInternalLinks && rc.relatedInternalLinks.length > 0 && (
                <p style={{ margin: "4px 0 0", fontSize: 13 }}>
                  {rc.relatedInternalLinks.map((link, i) => (
                    <span key={link.href}>
                      {i > 0 && " · "}
                      <Link href={link.href}>{link.title}</Link>
                    </span>
                  ))}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="muted" style={{ marginTop: 20 }}>
          No rate cases published yet for {s.name}. As regulatory data becomes
          available, cases will appear here.
        </p>
      )}

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href={`/regulatory/${state}`}>{s.name} regulation overview</Link>
        {" | "}
        <Link href={`/regulatory/${state}/timeline`}>{s.name} timeline</Link>
        {" | "}
        <Link href={`/${state}`}>{s.name} electricity rates</Link>
        {" | "}
        <Link href="/regulatory">All states</Link>
      </p>
    </main>
  );
}
