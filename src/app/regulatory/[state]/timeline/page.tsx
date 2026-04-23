import type { Metadata } from "next";
import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STATES } from "@/data/states";
import { SITE_URL, LAST_REVIEWED, formatPublicReviewDate } from "@/lib/site";
import { isValidStateSlug } from "@/lib/slugGuard";
import { getTimelineForState, EVENT_TYPE_LABELS } from "@/content/regulatory";

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
  const title = `${s.name} Regulatory Timeline`;
  const description = `Chronological timeline of electricity regulatory events in ${s.name}.`;

  return {
    title: `${title} | PriceOfElectricity.com`,
    description,
    alternates: { canonical: `${BASE_URL}/regulatory/${state}/timeline` },
    openGraph: {
      title: `${title} | PriceOfElectricity.com`,
      description,
      url: `${BASE_URL}/regulatory/${state}/timeline`,
    },
  };
}

const CONFIDENCE_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export default function TimelinePage({
  params,
}: {
  params: PageParams;
}) {
  const { state } = use(params);
  if (!isValidStateSlug(state)) notFound();

  const s = STATES[state];
  const events = getTimelineForState(state);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${s.name} Regulatory Timeline`,
    description: `Chronological timeline of electricity regulatory events in ${s.name}.`,
    url: `${BASE_URL}/regulatory/${state}/timeline`,
    dateModified: LAST_REVIEWED,
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/">Home</Link> {" → "}
        <Link href="/regulatory">Regulatory</Link> {" → "}
        <Link href={`/regulatory/${state}`}>{s.name}</Link> {" → "} Timeline
      </p>

      <h1>{s.name} Regulatory Timeline</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        A chronological view of regulatory events affecting electricity prices
        in {s.name}. Events are listed from most recent to oldest.
      </p>

      {events.length > 0 ? (
        <>
          <ol
            style={{
              paddingLeft: 20,
              marginTop: 20,
              listStyleType: "none",
            }}
          >
            {events.map((e) => (
              <li
                key={e.id}
                style={{
                  marginBottom: 20,
                  paddingLeft: 16,
                  borderLeft: "3px solid #ddd",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#666",
                  }}
                >
                  {e.date} · {EVENT_TYPE_LABELS[e.type]} · Confidence:{" "}
                  {CONFIDENCE_LABELS[e.confidence]}
                </p>
                <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{e.title}</p>
                <p
                  className="muted"
                  style={{ margin: "4px 0 0", fontSize: 14 }}
                >
                  {e.summary}
                </p>
                <p
                  className="muted"
                  style={{ margin: "2px 0 0", fontSize: 12 }}
                >
                  Last reviewed: {formatPublicReviewDate(e.lastReviewed)}
                </p>
                {e.relatedInternalLinks &&
                  e.relatedInternalLinks.length > 0 && (
                    <p style={{ margin: "4px 0 0", fontSize: 13 }}>
                      {e.relatedInternalLinks.map((link, i) => (
                        <span key={link.href}>
                          {i > 0 && " · "}
                          <Link href={link.href}>{link.title}</Link>
                        </span>
                      ))}
                    </p>
                  )}
              </li>
            ))}
          </ol>

          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>
              Event type legend
            </h2>
            <ul
              style={{
                paddingLeft: 20,
                lineHeight: 1.8,
                fontSize: 14,
                columnCount: 2,
                columnGap: 24,
              }}
            >
              {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                <li key={key} className="muted">
                  {label}
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <p className="muted" style={{ marginTop: 20 }}>
          No timeline events published yet for {s.name}. As data becomes
          available, events will appear here in chronological order.
        </p>
      )}

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href={`/regulatory/${state}`}>{s.name} regulation overview</Link>
        {" | "}
        <Link href={`/regulatory/${state}/rate-cases`}>
          {s.name} rate cases
        </Link>
        {" | "}
        <Link href={`/${state}`}>{s.name} electricity rates</Link>
        {" | "}
        <Link href="/regulatory">All states</Link>
      </p>
    </main>
  );
}
