import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

export const metadata: Metadata = {
  title: "Performance | PriceOfElectricity.com",
  description:
    "How PriceOfElectricity.com stays fast with static generation, long revalidation, and minimal client JavaScript.",
  alternates: {
    canonical: `${BASE_URL}/performance`,
  },
  openGraph: {
    title: "Performance | PriceOfElectricity.com",
    description:
      "How PriceOfElectricity.com stays fast with static generation, long revalidation, and minimal client JavaScript.",
    url: `${BASE_URL}/performance`,
    siteName: "PriceOfElectricity.com",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Performance | PriceOfElectricity.com",
    description:
      "How PriceOfElectricity.com stays fast with static generation, long revalidation, and minimal client JavaScript.",
  },
};

export default function PerformancePage() {
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Performance",
    url: `${BASE_URL}/performance`,
    description:
      "How PriceOfElectricity.com stays fast with static generation, long revalidation, and minimal client JavaScript.",
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageStructuredData) }}
      />
      <h1>Performance</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        This site is optimized for speed and stability at scale.
      </p>
      <ul style={{ paddingLeft: 20 }}>
        <li>Static generation is used for most pages to keep response times low.</li>
        <li>Revalidation is monthly on content pages to limit server work.</li>
        <li>Client-side JavaScript is kept minimal and limited to interactive features.</li>
        <li>Heavy dependency bundles are avoided to improve Core Web Vitals.</li>
      </ul>
      <p style={{ marginTop: 12 }}>
        For data transparency details, see <Link href="/data-policy">Data Policy</Link>.
      </p>
    </main>
  );
}
