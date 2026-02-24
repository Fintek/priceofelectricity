import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";

const BASE_URL = SITE_URL;

export const metadata: Metadata = {
  title: "Brand & Attribution | Press | PriceOfElectricity.com",
  description:
    "Brand guidelines, URL conventions, and attribution requirements for PriceOfElectricity.com.",
  alternates: { canonical: `${BASE_URL}/press/brand` },
  openGraph: {
    title: "Brand & Attribution | Press | PriceOfElectricity.com",
    description:
      "Brand guidelines, URL conventions, and attribution requirements for PriceOfElectricity.com.",
    url: `${BASE_URL}/press/brand`,
    siteName: "PriceOfElectricity.com",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Brand & Attribution | Press | PriceOfElectricity.com",
    description:
      "Brand guidelines, URL conventions, and attribution requirements for PriceOfElectricity.com.",
  },
};

export default function PressBrandPage() {
  return (
    <main className="container">
      <h1>Brand and Attribution Guidelines</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        Simple guidelines for attributing PriceOfElectricity.com in articles,
        charts, and reports.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>
          Preferred site name
        </h2>
        <p style={{ marginTop: 0 }}>
          Use <strong>PriceOfElectricity.com</strong> when referring to the
          site. The domain is the primary identifier; no trademark claims are
          made.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>URL conventions</h2>
        <p style={{ marginTop: 0 }}>
          Canonical URLs use lowercase slugs with hyphens. Examples:
        </p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>
            State pages: <code>{BASE_URL}/texas</code>,{" "}
            <code>{BASE_URL}/california</code>
          </li>
          <li>
            Compare: <code>{BASE_URL}/compare</code>
          </li>
          <li>
            Calculator: <code>{BASE_URL}/calculator</code>
          </li>
          <li>
            Data downloads: <code>{BASE_URL}/datasets</code>
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>
          Attributing charts, tables, and data
        </h2>
        <p style={{ marginTop: 0 }}>
          When using our data in charts, tables, or visualizations, include a
          credit line such as: &quot;Source: PriceOfElectricity.com&quot; or
          &quot;Data: PriceOfElectricity.com.&quot; Link to our{" "}
          <Link href="/datasets">data downloads</Link> page when sharing
          datasets. Our rates are energy-only estimates; see our{" "}
          <Link href="/about">methodology</Link> for details.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Contact</h2>
        <p style={{ marginTop: 0 }}>
          For partnership inquiries, corrections, or questions:{" "}
          <Link href="/contact">Contact us</Link>.
        </p>
      </section>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/press">Press & Media Kit</Link> {" | "}
        <Link href="/press/faq">How to cite</Link> {" | "}
        <Link href="/datasets">Data downloads</Link> {" | "}
        <Link href="/contact">Contact</Link>
      </p>
    </main>
  );
}
