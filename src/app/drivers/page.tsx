import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import { DRIVER_TAXONOMY } from "@/content/drivers";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

const TITLE = "Electricity Price Drivers";
const DESCRIPTION =
  "Understand why electricity prices differ across U.S. states. A structured taxonomy of qualitative price drivers including generation mix, fuel costs, regulation, demand growth, and data center impacts.";

export const metadata: Metadata = {
  title: `${TITLE} | PriceOfElectricity.com`,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/drivers` },
  openGraph: {
    title: `${TITLE} | PriceOfElectricity.com`,
    description: DESCRIPTION,
    url: `${BASE_URL}/drivers`,
  },
};

export default function DriversHubPage() {
  const webPageData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    description: DESCRIPTION,
    url: `${BASE_URL}/drivers`,
    dateModified: LAST_REVIEWED,
  };

  const definedTermSetData = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: "Electricity Price Driver Taxonomy",
    description:
      "A structured set of categories used to classify qualitative electricity price drivers across U.S. states.",
    url: `${BASE_URL}/drivers`,
    hasDefinedTerm: DRIVER_TAXONOMY.map((t) => ({
      "@type": "DefinedTerm",
      name: t.label,
      description: t.description,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermSetData) }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/">Home</Link> {" → "} Price Drivers
      </p>

      <h1>{TITLE}</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        Electricity rates vary widely across U.S. states. This section explains
        the qualitative factors — price drivers — that contribute to those
        differences. Drivers are maintained manually and updated over time as
        new signals emerge. No quantitative claims are made without supporting
        data.
      </p>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Driver categories</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
          {DRIVER_TAXONOMY.map((t) => (
            <li key={t.category} style={{ marginBottom: 10 }}>
              <b>{t.label}</b>
              <br />
              <span className="muted" style={{ fontSize: 14 }}>
                {t.description}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Related</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
          <li>
            <Link href="/v/ai-energy/overview">AI & Energy overview</Link>
          </li>
          <li>
            <Link href="/regulatory">Regulatory & rate-case tracking</Link>
          </li>
          <li>
            <Link href="/methodology">Methodology</Link>
          </li>
          <li>
            <Link href="/national">National overview</Link>
          </li>
          <li>
            <Link href="/compare">Compare all states</Link>
          </li>
          <li>
            <Link href="/research">Research & insights</Link>
          </li>
        </ul>
      </section>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/">Home</Link> {" | "}
        <Link href="/sources">Sources</Link> {" | "}
        <Link href="/data-policy">Data policy</Link>
      </p>
    </main>
  );
}
