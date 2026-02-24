import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import { AI_ENERGY_WATCHLIST } from "@/content/aiEnergy";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

const TITLE = "AI Data Center Electricity Price Watchlist";
const DESCRIPTION =
  "Key indicators and signals to track when monitoring how AI data center growth may affect electricity prices, grid capacity, and consumer rates.";
const CANONICAL = `${BASE_URL}/v/ai-energy/watchlist`;

export const metadata: Metadata = {
  title: `${TITLE} | PriceOfElectricity.com`,
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: `${TITLE} | PriceOfElectricity.com`,
    description: DESCRIPTION,
    url: CANONICAL,
  },
};

export default function WatchlistPage() {
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    description: DESCRIPTION,
    url: CANONICAL,
    dateModified: LAST_REVIEWED,
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: TITLE,
    description: DESCRIPTION,
    url: CANONICAL,
    numberOfItems: AI_ENERGY_WATCHLIST.length,
    itemListElement: AI_ENERGY_WATCHLIST.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.title,
      description: item.description,
    })),
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/">Home</Link> {" → "}
        <Link href="/v/ai-energy">AI Data Centers & Electricity Prices</Link>{" "}
        {" → "} Watchlist
      </p>

      <h1>{TITLE}</h1>

      <p className="intro muted" style={{ marginTop: 0, fontSize: 15 }}>
        Tracking the impact of AI data center growth on electricity markets
        requires monitoring signals across grid operations, regulatory
        proceedings, and infrastructure development. The items below represent
        categories of indicators that may be relevant to assessing whether and
        how data center demand is affecting electricity prices in a given region.
        No specific numeric thresholds are implied; the significance of any
        indicator depends on regional context.
      </p>

      <nav
        style={{
          marginTop: 16,
          marginBottom: 24,
          paddingTop: 10,
          paddingBottom: 10,
          borderTop: "1px solid #eee",
          borderBottom: "1px solid #eee",
          fontSize: 14,
        }}
      >
        <span className="muted" style={{ marginRight: 8 }}>
          AI & Energy:
        </span>
        <Link href="/v/ai-energy/overview">Overview</Link>
        {" · "}
        <Link href="/v/ai-energy/load-growth">Load Growth</Link>
        {" · "}
        <Link href="/v/ai-energy/where-prices-rise">Where Prices Rise</Link>
        {" · "}
        <strong>Watchlist</strong>
        {" · "}
        <Link href="/v/ai-energy/monitoring">Monitoring</Link>
        {" · "}
        <Link href="/v/ai-energy/glossary">Glossary</Link>
      </nav>

      {AI_ENERGY_WATCHLIST.map((item, i) => (
        <section
          key={item.id}
          id={item.id}
          style={{
            marginTop: i === 0 ? 8 : 28,
            paddingTop: i === 0 ? 0 : 20,
            borderTop: i === 0 ? "none" : "1px solid #f0f0f0",
          }}
        >
          <h2 style={{ fontSize: 20, marginBottom: 6 }}>
            {i + 1}. {item.title}
          </h2>

          <p style={{ marginTop: 0, lineHeight: 1.7 }}>{item.description}</p>

          <h3
            style={{
              fontSize: 15,
              marginBottom: 4,
              marginTop: 12,
              color: "#444",
            }}
          >
            Why it matters
          </h3>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>{item.whyItMatters}</p>

          <h3
            style={{
              fontSize: 15,
              marginBottom: 4,
              marginTop: 12,
              color: "#444",
            }}
          >
            How to monitor
          </h3>
          <ul style={{ marginTop: 0, paddingLeft: 20, lineHeight: 1.9 }}>
            {item.howToMonitor.map((step, j) => (
              <li key={j}>{step}</li>
            ))}
          </ul>

          {item.relatedLinks.length > 0 && (
            <>
              <h3
                style={{
                  fontSize: 15,
                  marginBottom: 4,
                  marginTop: 12,
                  color: "#444",
                }}
              >
                Related
              </h3>
              <ul style={{ marginTop: 0, paddingLeft: 20, lineHeight: 1.9 }}>
                {item.relatedLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} prefetch={false}>
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      ))}

      <section
        style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid #eee" }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Next steps</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li>
            <Link href="/v/ai-energy/monitoring">
              How to monitor AI data center electricity impacts
            </Link>{" "}
            — Sources, cadences, and what to look for
          </li>
          <li>
            <Link href="/v/ai-energy/glossary">
              AI, data centers, and grid pricing glossary
            </Link>{" "}
            — Definitions for key terms used in this watchlist
          </li>
          <li>
            <Link href="/v/ai-energy">
              Back to AI Data Centers & Electricity Prices hub
            </Link>
          </li>
        </ul>
      </section>

      <p className="muted" style={{ marginTop: 24, fontSize: 13 }}>
        <Link href="/sources">Sources</Link>
        {" | "}
        <Link href="/data-policy">Data policy</Link>
        {" | "}
        <Link href="/research">Research</Link>
        {" | "}
        <Link href="/methodology">Methodology</Link>
      </p>
    </main>
  );
}
