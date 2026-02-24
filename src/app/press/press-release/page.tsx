import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";

const BASE_URL = SITE_URL;

export const metadata: Metadata = {
  title: "Press Release Template | Press | PriceOfElectricity.com",
  description:
    "Template press release for PriceOfElectricity.com coverage and announcements.",
  alternates: { canonical: `${BASE_URL}/press/press-release` },
  openGraph: {
    title: "Press Release Template | Press | PriceOfElectricity.com",
    description:
      "Template press release for PriceOfElectricity.com coverage and announcements.",
    url: `${BASE_URL}/press/press-release`,
    siteName: "PriceOfElectricity.com",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Press Release Template | Press | PriceOfElectricity.com",
    description:
      "Template press release for PriceOfElectricity.com coverage and announcements.",
  },
};

export default function PressReleasePage() {
  return (
    <main className="container">
      <h1>Press Release (Template)</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        Use this template for announcements or coverage. Wording is factual and
        non-promotional.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Headline</h2>
        <p style={{ marginTop: 0, fontWeight: 600 }}>
          PriceOfElectricity.com Launches State-by-State Electricity Price
          Comparison and Data Downloads
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Subheadline</h2>
        <p style={{ marginTop: 0, color: "var(--color-muted)" }}>
          Free resource provides average residential electricity rates for all
          50 U.S. states with comparison tools, bill estimates, and downloadable
          datasets.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>What it does</h2>
        <p style={{ marginTop: 0 }}>
          PriceOfElectricity.com displays state-level average residential
          electricity prices in cents per kilowatt-hour (¢/kWh) for all 50 U.S.
          states. The site helps consumers, researchers, and journalists
          compare rates, estimate bills, and access structured data. All
          estimates are energy-only and exclude delivery fees, taxes, and other
          utility charges. Data is sourced from authoritative public sources and
          updated monthly.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Key features</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          <li>
            <strong>Compare</strong> — Side-by-side state rate comparison and
            affordability rankings
          </li>
          <li>
            <strong>Calculator</strong> — Bill estimator for common usage levels
          </li>
          <li>
            <strong>Data downloads</strong> — JSON and CSV datasets for all 50
            states
          </li>
          <li>
            <strong>Sources</strong> — Transparent sourcing with links to EIA,
            state commissions, and methodology
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Boilerplate</h2>
        <p style={{ marginTop: 0 }}>
          PriceOfElectricity.com is an informational resource for state-level
          average residential electricity prices in the United States. The site
          does not sell electricity or endorse specific providers. For
          methodology and data policy, visit{" "}
          <a href={`${BASE_URL}/about`}>{BASE_URL}/about</a>.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Contact</h2>
        <p style={{ marginTop: 0 }}>
          For media inquiries: <Link href="/contact">Contact</Link>
        </p>
      </section>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/press">Press & Media Kit</Link> {" | "}
        <Link href="/press/faq">How to cite</Link> {" | "}
        <Link href="/press/brand">Brand guidelines</Link> {" | "}
        <Link href="/contact">Contact</Link>
      </p>
    </main>
  );
}
