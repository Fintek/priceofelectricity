import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

export const metadata: Metadata = {
  title: "Data Policy | PriceOfElectricity.com",
  description:
    "How PriceOfElectricity.com sources, updates, and labels electricity data freshness.",
  alternates: {
    canonical: `${BASE_URL}/data-policy`,
  },
  openGraph: {
    title: "Data Policy | PriceOfElectricity.com",
    description:
      "How PriceOfElectricity.com sources, updates, and labels electricity data freshness.",
    url: `${BASE_URL}/data-policy`,
    siteName: "PriceOfElectricity.com",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Data Policy | PriceOfElectricity.com",
    description:
      "How PriceOfElectricity.com sources, updates, and labels electricity data freshness.",
  },
};

export default function DataPolicyPage() {
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Data Policy",
    url: `${BASE_URL}/data-policy`,
    description:
      "How PriceOfElectricity.com sources, updates, and labels electricity data freshness.",
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageStructuredData) }}
      />

      <h1>Data Policy</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Transparency on where electricity data comes from, how often it is refreshed, and how
        freshness labels are applied.
      </p>

      <h2>Update cadence</h2>
      <p>
        State-level electricity data is reviewed on a monthly cadence. Pages are statically
        generated from the latest available state dataset in this repository.
      </p>

      <h2>Data source</h2>
      <p>
        Source information is shown on state pages, including source name and source URL. Current
        values are benchmark averages used for comparisons and energy-only bill estimates.
      </p>

      <h2>Freshness scoring</h2>
      <p>
        Each state record includes an <code>updated</code> field. We compute age in days from that
        value and classify freshness:
      </p>
      <ul style={{ paddingLeft: 20 }}>
        <li>
          <b>Fresh</b>: less than 45 days old
        </li>
        <li>
          <b>Aging</b>: 45 to 90 days old
        </li>
        <li>
          <b>Stale</b>: more than 90 days old
        </li>
      </ul>
      <p>
        Invalid or missing dates are treated as stale and flagged as potentially outdated.
      </p>

      <h2>Interpretation notes</h2>
      <p>
        Bill examples on this site are energy-only. They do not include delivery charges, taxes,
        fixed customer charges, or other local utility line items.
      </p>
      <p>
        For methodological details, see <Link href="/about">About / Methodology</Link>.
      </p>
    </main>
  );
}
