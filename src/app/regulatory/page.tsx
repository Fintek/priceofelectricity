import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import { STATES } from "@/data/states";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

const TITLE = "Regulatory & Rate-Case Intelligence";
const DESCRIPTION =
  "Track electricity rate cases, regulatory decisions, and timeline events across all U.S. states. Understand how regulation affects electricity prices.";

export const metadata: Metadata = {
  title: `${TITLE} | PriceOfElectricity.com`,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/regulatory` },
  openGraph: {
    title: `${TITLE} | PriceOfElectricity.com`,
    description: DESCRIPTION,
    url: `${BASE_URL}/regulatory`,
  },
};

export default function RegulatoryHubPage() {
  const sortedStates = Object.entries(STATES)
    .map(([slug, s]) => ({ slug, name: s.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const webPageData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    description: DESCRIPTION,
    url: `${BASE_URL}/regulatory`,
    dateModified: LAST_REVIEWED,
  };

  const itemListData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "State Regulatory Pages",
    numberOfItems: sortedStates.length,
    itemListElement: sortedStates.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${s.name} Regulatory Overview`,
      url: `${BASE_URL}/regulatory/${s.slug}`,
    })),
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListData) }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/">Home</Link> {" → "} Regulatory
      </p>

      <h1>{TITLE}</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        Electricity prices are shaped by regulatory decisions at the state level.
        Public utility commissions review rate cases filed by utilities, approve
        or deny proposed rate changes, and set the rules that determine how much
        consumers pay. This section tracks those decisions qualitatively and is
        maintained manually. It is not legal advice.
      </p>

      <p className="muted" style={{ marginTop: 8, marginBottom: 0, fontSize: 14 }}>
        <Link href="/regulatory/queue">View regulatory update queue →</Link>
        {" · "}
        <Link href="/alerts/regulatory">Get regulatory alerts →</Link>
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>
          Why regulation matters
        </h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li>
            Rate cases determine how much utilities can charge residential
            customers.
          </li>
          <li>
            Approved increases directly raise the average rate in a state.
          </li>
          <li>
            Regulatory timelines signal when price changes may take effect.
          </li>
          <li>
            Understanding pending cases helps anticipate future electricity
            costs.
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Browse by state</h2>
        <ul
          style={{
            paddingLeft: 20,
            columnCount: 3,
            columnGap: 24,
            lineHeight: 2.1,
          }}
        >
          {sortedStates.map((s) => (
            <li key={s.slug}>
              <Link href={`/regulatory/${s.slug}`} prefetch={false}>
                {s.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/v/ai-energy/overview">AI & Energy overview</Link> {" | "}
        <Link href="/methodology">Methodology</Link> {" | "}
        <Link href="/national">National overview</Link> {" | "}
        <Link href="/drivers">Price drivers</Link> {" | "}
        <Link href="/research">Research</Link> {" | "}
        <Link href="/sources">Sources</Link>
      </p>
    </main>
  );
}
