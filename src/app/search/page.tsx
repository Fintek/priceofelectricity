import type { Metadata } from "next";
import Link from "next/link";
import { search } from "@/lib/search";
import { SITE_URL } from "@/lib/site";

const BASE_URL = SITE_URL;
export const revalidate = 2592000;

const TYPE_LABELS: Record<
  "state" | "utility" | "guide" | "question" | "topic" | "tool",
  string
> = {
  state: "States",
  utility: "Utilities",
  guide: "Guides",
  question: "Questions",
  topic: "Topics",
  tool: "Tools",
};

const TYPE_ORDER: Array<"state" | "utility" | "guide" | "question" | "topic" | "tool"> = [
  "state",
  "utility",
  "guide",
  "question",
  "topic",
  "tool",
];

export const metadata: Metadata = {
  title: "Search | PriceOfElectricity.com",
  description: "Search states, utilities, guides, topics, and tools.",
  alternates: {
    canonical: `${BASE_URL}/search`,
  },
  openGraph: {
    title: "Search | PriceOfElectricity.com",
    description: "Search states, utilities, guides, topics, and tools.",
    url: `${BASE_URL}/search`,
    siteName: "PriceOfElectricity.com",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Search | PriceOfElectricity.com",
    description: "Search states, utilities, guides, topics, and tools.",
  },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query ? search(query) : [];
  const grouped = TYPE_ORDER.map((type) => ({
    type,
    items: results.filter((result) => result.type === type),
  })).filter((group) => group.items.length > 0);

  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Search",
    url: `${BASE_URL}/search`,
    description: "Search states, utilities, guides, topics, and tools.",
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageStructuredData) }}
      />

      <h1>{query ? `Search results for "${query}"` : "Search"}</h1>
      <form action="/search" method="get" style={{ marginTop: 8 }}>
        <label htmlFor="search-q" style={{ display: "block", marginBottom: 6 }}>
          Search
        </label>
        <input
          id="search-q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Try: texas, affordability, kWh, PG&E"
          style={{ width: "100%", maxWidth: 420, padding: "8px 10px" }}
        />
        <div style={{ marginTop: 10 }}>
          <button type="submit">Search</button>
        </div>
      </form>

      {!query ? (
        <p className="muted" style={{ marginTop: 14 }}>
          Enter a query to find states, utilities, guides, topics, questions, and tools.
        </p>
      ) : results.length === 0 ? (
        <p className="muted" style={{ marginTop: 14 }}>No results found.</p>
      ) : (
        grouped.map((group) => (
          <section key={group.type} style={{ marginTop: 22 }}>
            <h2 style={{ marginBottom: 8 }}>{TYPE_LABELS[group.type]}</h2>
            <ul style={{ marginTop: 0, paddingLeft: 20 }}>
              {group.items.map((result) => (
                <li key={`${result.type}-${result.href}`} style={{ marginBottom: 6 }}>
                  <Link href={result.href}>{result.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  );
}
