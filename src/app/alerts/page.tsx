import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import { STATES } from "@/data/states";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

const TITLE = "Electricity Price Alerts";
const DESCRIPTION =
  "Sign up for optional email alerts on electricity rate changes, regulatory decisions, and AI data center demand growth. No spam. Unsubscribe anytime.";

export const metadata: Metadata = {
  title: `${TITLE} | PriceOfElectricity.com`,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/alerts` },
  openGraph: {
    title: `${TITLE} | PriceOfElectricity.com`,
    description: DESCRIPTION,
    url: `${BASE_URL}/alerts`,
  },
};

export default function AlertsHubPage() {
  const sortedStates = Object.entries(STATES)
    .map(([slug, s]) => ({ slug, name: s.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    description: DESCRIPTION,
    url: `${BASE_URL}/alerts`,
    dateModified: LAST_REVIEWED,
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/">Home</Link> {" → "} Alerts
      </p>

      <h1>{TITLE}</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        Get optional email alerts when electricity rates change, rate cases are
        filed or decided, or new signals emerge in AI data center energy demand.
        All subscriptions are free. No spam. You can unsubscribe at any time.
      </p>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>
          A) Regulatory alerts
        </h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Stay informed on rate case filings, commission decisions, settlements,
          and fuel adjustments across any U.S. state.
        </p>
        <p style={{ marginTop: 8 }}>
          <Link
            href="/alerts/regulatory"
            style={{
              display: "inline-block",
              padding: "8px 18px",
              border: "1px solid #333",
              borderRadius: 4,
              fontWeight: 600,
              textDecoration: "none",
              fontSize: 15,
            }}
          >
            Set up Regulatory Alerts →
          </Link>
        </p>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>
          B) AI &amp; Data Center alerts
        </h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Track load growth signals, transmission constraints, capacity price
          movements, and regulatory impacts related to data center electricity
          demand.
        </p>
        <p style={{ marginTop: 8 }}>
          <Link
            href="/alerts/ai-energy"
            style={{
              display: "inline-block",
              padding: "8px 18px",
              border: "1px solid #333",
              borderRadius: 4,
              fontWeight: 600,
              textDecoration: "none",
              fontSize: 15,
            }}
          >
            Set up AI &amp; Energy Alerts →
          </Link>
        </p>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>C) State alerts</h2>
        <p className="muted" style={{ marginTop: 0, marginBottom: 12 }}>
          Get alerts specific to your state: rate changes, regulatory updates,
          and demand growth signals.
        </p>
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
              <Link href={`/alerts/${s.slug}`} prefetch={false}>
                {s.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="muted" style={{ marginTop: 28 }}>
        <Link href="/regulatory">Regulatory hub</Link> {" | "}
        <Link href="/v/ai-energy">AI & Energy vertical</Link> {" | "}
        <Link href="/newsletter">Newsletter</Link> {" | "}
        <Link href="/disclosures">Disclosures</Link>
      </p>
    </main>
  );
}
