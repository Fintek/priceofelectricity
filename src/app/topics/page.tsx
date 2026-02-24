import type { Metadata } from "next";
import Link from "next/link";
import { TOPICS } from "@/data/topics";
import { SITE_URL } from "@/lib/site";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

export const metadata: Metadata = {
  title: "Topics | PriceOfElectricity.com",
  description: "Explore electricity topic hubs across pricing, bills, affordability, and markets.",
  alternates: {
    canonical: `${BASE_URL}/topics`,
  },
  openGraph: {
    title: "Topics | PriceOfElectricity.com",
    description: "Explore electricity topic hubs across pricing, bills, affordability, and markets.",
    url: `${BASE_URL}/topics`,
    siteName: "PriceOfElectricity.com",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Topics | PriceOfElectricity.com",
    description: "Explore electricity topic hubs across pricing, bills, affordability, and markets.",
  },
};

export default function TopicsIndexPage() {
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Topics",
    url: `${BASE_URL}/topics`,
    description: "Explore electricity topic hubs across pricing, bills, affordability, and markets.",
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageStructuredData) }}
      />
      <h1>Topics</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Browse curated topic hubs linking related guides, question pages, and comparison tools.
      </p>

      <ul style={{ paddingLeft: 20 }}>
        {TOPICS.map((topic) => (
          <li key={topic.slug} style={{ marginBottom: 12 }}>
            <Link href={`/topics/${topic.slug}`} prefetch={false}>
              {topic.name}
            </Link>
            <div className="muted">{topic.description}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
