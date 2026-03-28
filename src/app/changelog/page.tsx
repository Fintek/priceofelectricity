import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

const BASE_URL = SITE_URL;
const CHANGELOG_META_DESCRIPTION =
  "Product and data update log for PriceOfElectricity.com, including new route launches, methodology improvements, and indexing-hardening changes.";

export const dynamic = "force-static";
export const revalidate = 2592000;

const CHANGELOG_ENTRIES = [
  {
    id: "all-50-states",
    date: "2026-02-10",
    title: "Added all 50 states",
    description: "Expanded coverage to all U.S. states with consistent state-level rate pages.",
  },
  {
    id: "bill-calculator-launch",
    date: "2026-02-11",
    title: "Launched bill calculator",
    description: "Added a national kWh-to-dollars calculator for quick energy-only estimates.",
  },
  {
    id: "compare-page",
    date: "2026-02-12",
    title: "Added compare page",
    description: "Released a sortable all-states comparison view for rates and 1000 kWh examples.",
  },
  {
    id: "utilities-plans-pages",
    date: "2026-02-13",
    title: "Added utilities and plans pages",
    description: "Introduced state utility directories and initial Texas plans architecture.",
  },
  {
    id: "faq-jsonld",
    date: "2026-02-14",
    title: "Added FAQ + JSON-LD",
    description: "Improved structured data coverage across pages for machine readability.",
  },
  {
    id: "canonical-redirects",
    date: "2026-02-15",
    title: "Added canonical redirects",
    description: "Implemented middleware redirects to enforce canonical state URL slugs.",
  },
  {
    id: "history-mvp",
    date: "2026-02-21",
    title: "Added history MVP",
    description: "Launched state history pages with initial monthly trend datasets for key states.",
  },
  {
    id: "feeds-llms-api",
    date: "2026-02-22",
    title: "Added feeds, llms.txt, and API",
    description: "Published RSS/Atom feeds, llms.txt guidance, and JSON API endpoints.",
  },
];

export const metadata: Metadata = {
  title: "Changelog | PriceOfElectricity.com",
  description: CHANGELOG_META_DESCRIPTION,
  alternates: {
    canonical: `${BASE_URL}/changelog`,
  },
  openGraph: {
    title: "Changelog | PriceOfElectricity.com",
    description: CHANGELOG_META_DESCRIPTION,
    url: `${BASE_URL}/changelog`,
    siteName: "PriceOfElectricity.com",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Changelog | PriceOfElectricity.com",
    description: CHANGELOG_META_DESCRIPTION,
  },
};

export default function ChangelogPage() {
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Changelog",
    url: `${BASE_URL}/changelog`,
    description: CHANGELOG_META_DESCRIPTION,
  };
  const itemListStructuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: CHANGELOG_ENTRIES.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.title,
      url: `${BASE_URL}/changelog#${entry.id}`,
    })),
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListStructuredData) }}
      />
      <h1>Changelog</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Updates and improvements to PriceOfElectricity.com.
      </p>
      <ul style={{ paddingLeft: 20 }}>
        {CHANGELOG_ENTRIES.map((entry) => (
          <li key={entry.id} id={entry.id} style={{ marginBottom: 12 }}>
            <b>{entry.date}</b> {"—"} <b>{entry.title}</b>
            <div className="muted">{entry.description}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
