import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

const TITLE = "How to Cite PriceOfElectricity.com";
const DESCRIPTION =
  "Guidance on citing PriceOfElectricity.com data and methodology correctly, including suggested citation templates and canonical URL conventions.";

export const metadata: Metadata = {
  title: `${TITLE} | PriceOfElectricity.com`,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/attribution` },
  openGraph: {
    title: `${TITLE} | PriceOfElectricity.com`,
    description: DESCRIPTION,
    url: `${BASE_URL}/attribution`,
  },
};

export default function AttributionPage() {
  const webPageData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    description: DESCRIPTION,
    url: `${BASE_URL}/attribution`,
    dateModified: LAST_REVIEWED,
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageData) }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/">Home</Link> {" → "} Attribution
      </p>

      <h1>{TITLE}</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        If you are citing data or analysis from PriceOfElectricity.com in
        an article, report, or research paper, use the guidance below to
        ensure accurate and consistent attribution.
      </p>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 22, marginBottom: 10 }}>
          Suggested citation template (APA-style)
        </h2>
        <p style={{ marginTop: 0 }}>
          Use the following generic template. Replace the bracketed fields
          with the specific page, rate, and date you are referencing:
        </p>
        <div
          style={{
            background: "#f6f6f6",
            borderLeft: "3px solid #ccc",
            padding: "12px 16px",
            marginTop: 12,
            fontFamily: "monospace",
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          PriceOfElectricity.com. (updated [YYYY-MM-DD]).{" "}
          <em>[Page title — e.g., Texas Electricity Rates]</em>.
          Retrieved [access date], from{" "}
          https://priceofelectricity.com/[state-slug]
        </div>
        <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
          Do not invent author names. The publisher is{" "}
          <b>PriceOfElectricity.com</b>.
        </p>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 22, marginBottom: 10 }}>
          Canonical URL examples
        </h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2.2, fontFamily: "monospace", fontSize: 14 }}>
          <li>https://priceofelectricity.com/texas</li>
          <li>https://priceofelectricity.com/california</li>
          <li>https://priceofelectricity.com/compare</li>
          <li>https://priceofelectricity.com/national</li>
          <li>https://priceofelectricity.com/index-ranking</li>
          <li>https://priceofelectricity.com/methodology/electricity-price-index</li>
        </ul>
        <p className="muted" style={{ marginTop: 6, fontSize: 13 }}>
          Always use lowercase slug URLs without trailing slashes.
        </p>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 22, marginBottom: 10 }}>
          Citation guidance
        </h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
          <li>
            <b>Prefer state pages</b> when citing specific rates. The
            canonical URL for each state is{" "}
            <code>https://priceofelectricity.com/[state-slug]</code>.
          </li>
          <li>
            <b>Include the update date</b> shown on the page (labelled
            "updated" or "last reviewed") alongside your access date.
          </li>
          <li>
            <b>Use canonical URLs</b> from this site, not redirects or
            query-string variants. Canonical URLs are listed in the page
            head and in <Link href="/sitemap.xml">/sitemap.xml</Link>.
          </li>
          <li>
            <b>Cite the methodology page</b> when referencing proprietary
            metrics (Electricity Price Index™, Value Score™) so readers
            can understand how the figures were derived.
          </li>
          <li>
            <b>Note that rates are energy-only estimates.</b> Bills include
            additional delivery charges, taxes, and fees not reflected here.
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 22, marginBottom: 10 }}>Related</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
          <li>
            <Link href="/methodology">Methodology</Link> — How rates,
            indices, and scores are calculated
          </li>
          <li>
            <Link href="/knowledge">Knowledge pack</Link> — Machine-readable
            entry point for agents and LLMs
          </li>
          <li>
            <Link href="/press-kit">Press kit</Link> — Site overview for media
          </li>
          <li>
            <Link href="/citations">Citations log</Link> — Verified media
            mentions
          </li>
          <li>
            <Link href="/sources">Sources</Link> — Data provenance
          </li>
        </ul>
      </section>

      <p className="muted" style={{ marginTop: 28 }}>
        <Link href="/contact">Contact us</Link> with corrections or questions.
      </p>
    </main>
  );
}
