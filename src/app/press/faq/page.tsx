import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";

const BASE_URL = SITE_URL;

export const metadata: Metadata = {
  title: "How to Cite | Press FAQ | PriceOfElectricity.com",
  description:
    "How to cite PriceOfElectricity.com in APA, MLA, and web formats. Energy-only estimates, data sources, and update cadence.",
  alternates: { canonical: `${BASE_URL}/press/faq` },
  openGraph: {
    title: "How to Cite | Press FAQ | PriceOfElectricity.com",
    description:
      "How to cite PriceOfElectricity.com in APA, MLA, and web formats.",
    url: `${BASE_URL}/press/faq`,
    siteName: "PriceOfElectricity.com",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "How to Cite | Press FAQ | PriceOfElectricity.com",
    description:
      "How to cite PriceOfElectricity.com in APA, MLA, and web formats.",
  },
};

const FAQ_ITEMS = [
  {
    q: "How do I cite PriceOfElectricity.com in APA style?",
    a: "PriceOfElectricity.com. (n.d.). Average residential electricity prices by state. Retrieved [date], from https://priceofelectricity.com/",
  },
  {
    q: "How do I cite PriceOfElectricity.com in MLA style?",
    a: '"Average Residential Electricity Prices by State." PriceOfElectricity.com, [date], https://priceofelectricity.com/.',
  },
  {
    q: "What does 'energy-only estimates' mean?",
    a: "Our bill estimates use the energy charge (¢/kWh × usage) only. They exclude delivery fees, taxes, fixed customer charges, demand charges, and other utility fees that appear on real bills. Actual bills vary by utility and customer class.",
  },
  {
    q: "Where does the data come from?",
    a: "We source electricity rate data from authoritative public sources including the U.S. Energy Information Administration (EIA), state public utility commissions, and other aggregated datasets. See our Sources page and About page for details.",
  },
  {
    q: "How often is the data updated?",
    a: "State rates are reviewed and updated on a monthly cadence. We aim to reflect the latest published data from our sources. See our data policy for freshness definitions (fresh, aging, stale) and update cadence.",
  },
  {
    q: "Can I use the data in my publication or report?",
    a: "Yes. We provide downloadable datasets (JSON and CSV) for all 50 states. Please attribute PriceOfElectricity.com and link to our site when possible. See our brand guidelines for attribution details.",
  },
];

export default function PressFaqPage() {
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData),
        }}
      />

      <h1>How to Cite PriceOfElectricity.com</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        Citation guidelines for journalists, researchers, and publishers.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Citation styles</h2>

        <h3 style={{ fontSize: 18, marginTop: 16, marginBottom: 6 }}>
          APA-style
        </h3>
        <p style={{ marginTop: 0 }}>
          PriceOfElectricity.com. (n.d.). Average residential electricity
          prices by state. Retrieved [date], from{" "}
          <a href={BASE_URL}>{BASE_URL}/</a>
        </p>

        <h3 style={{ fontSize: 18, marginTop: 16, marginBottom: 6 }}>
          MLA-style
        </h3>
        <p style={{ marginTop: 0 }}>
          &quot;Average Residential Electricity Prices by State.&quot;
          PriceOfElectricity.com, [date], {BASE_URL}/.
        </p>

        <h3 style={{ fontSize: 18, marginTop: 16, marginBottom: 6 }}>
          Simple web citation
        </h3>
        <p style={{ marginTop: 0 }}>
          PriceOfElectricity.com. Average residential electricity prices by
          state (¢/kWh). Accessed [date]. {BASE_URL}/
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Frequently asked</h2>
        <dl style={{ marginTop: 0 }}>
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <dt style={{ fontWeight: 600, marginBottom: 4 }}>{item.q}</dt>
              <dd style={{ marginLeft: 0, color: "var(--color-muted)" }}>
                {item.q.includes("Where does") ? (
                  <>
                    We source electricity rate data from authoritative public
                    sources including the U.S. Energy Information
                    Administration (EIA), state public utility commissions, and
                    other aggregated datasets. See our{" "}
                    <Link href="/sources">Sources</Link> page and{" "}
                    <Link href="/about">About</Link> page for details.
                  </>
                ) : item.q.includes("How often") ? (
                  <>
                    State rates are reviewed and updated on a monthly cadence.
                    We aim to reflect the latest published data from our
                    sources. See our{" "}
                    <Link href="/data-policy">data policy</Link> for freshness
                    definitions (fresh, aging, stale) and update cadence.
                  </>
                ) : item.q.includes("Can I use") ? (
                  <>
                    Yes. We provide downloadable datasets (JSON and CSV) for all
                    50 states. Please attribute PriceOfElectricity.com and link
                    to our site when possible. See our{" "}
                    <Link href="/press/brand">brand guidelines</Link> for
                    attribution details.
                  </>
                ) : (
                  item.a
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/press">Press & Media Kit</Link> {" | "}
        <Link href="/sources">Sources</Link> {" | "}
        <Link href="/about">About</Link> {" | "}
        <Link href="/data-policy">Data policy</Link>
      </p>
    </main>
  );
}
