import type { Metadata } from "next";
import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STATES } from "@/data/states";
import { SITE_URL, LAST_REVIEWED, formatPublicReviewDate } from "@/lib/site";
import { isValidStateSlug } from "@/lib/slugGuard";
import {
  getDriversForState,
  DRIVER_CATEGORY_LABELS,
  type DriverCategory,
  type DriverSignal,
} from "@/content/drivers";
import { getRelatedLinks } from "@/lib/related";
import RelatedLinks from "@/app/components/RelatedLinks";

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
  const title = `${s.name} Electricity Price Drivers`;
  const description = `Qualitative analysis of factors driving electricity prices in ${s.name}, including generation mix, fuel costs, regulation, and demand growth.`;

  return {
    title: `${title} | PriceOfElectricity.com`,
    description,
    alternates: { canonical: `${BASE_URL}/drivers/${state}` },
    openGraph: {
      title: `${title} | PriceOfElectricity.com`,
      description,
      url: `${BASE_URL}/drivers/${state}`,
    },
  };
}

const CONFIDENCE_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

function groupByCategory(
  signals: DriverSignal[]
): Map<DriverCategory, DriverSignal[]> {
  const map = new Map<DriverCategory, DriverSignal[]>();
  for (const s of signals) {
    const list = map.get(s.category) ?? [];
    list.push(s);
    map.set(s.category, list);
  }
  return map;
}

export default function StateDriversPage({
  params,
}: {
  params: PageParams;
}) {
  const { state } = use(params);
  if (!isValidStateSlug(state)) notFound();

  const s = STATES[state];
  const signals = getDriversForState(state);
  const grouped = groupByCategory(signals);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${s.name} Electricity Price Drivers`,
    description: `Qualitative analysis of factors driving electricity prices in ${s.name}.`,
    url: `${BASE_URL}/drivers/${state}`,
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
        <Link href="/drivers">Price Drivers</Link> {" → "} {s.name}
      </p>

      <h1>{s.name} Electricity Price Drivers</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        Qualitative signals that may help explain electricity pricing in{" "}
        {s.name}. These are maintained manually and do not represent forecasts
        or investment advice.
      </p>

      {signals.length === 0 ? (
        <p className="muted" style={{ marginTop: 20 }}>
          No drivers published yet for {s.name}. As analysis is added, signals
          will appear here grouped by category.
        </p>
      ) : (
        [...grouped.entries()].map(([category, items]) => (
          <section key={category} style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 10 }}>
              {DRIVER_CATEGORY_LABELS[category]}
            </h2>
            {items.map((sig) => (
              <div
                key={sig.id}
                style={{
                  marginBottom: 20,
                  paddingLeft: 16,
                  borderLeft: "3px solid #ddd",
                }}
              >
                <p style={{ margin: 0, fontWeight: 600 }}>{sig.title}</p>
                <p
                  className="muted"
                  style={{ margin: "4px 0 0", fontSize: 14 }}
                >
                  {sig.explanation}
                </p>
                <p
                  className="muted"
                  style={{ margin: "4px 0 0", fontSize: 12 }}
                >
                  Confidence: {CONFIDENCE_LABELS[sig.confidence]} · Last
                  reviewed: {formatPublicReviewDate(sig.lastReviewed)}
                </p>
                {sig.related.length > 0 && (
                  <p style={{ margin: "4px 0 0", fontSize: 13 }}>
                    {sig.related.map((link, i) => (
                      <span key={link.href}>
                        {i > 0 && " · "}
                        <Link href={link.href}>{link.title}</Link>
                      </span>
                    ))}
                  </p>
                )}
              </div>
            ))}
          </section>
        ))
      )}

      <RelatedLinks links={getRelatedLinks({ kind: "state", state, from: "drivers" })} />
    </main>
  );
}
