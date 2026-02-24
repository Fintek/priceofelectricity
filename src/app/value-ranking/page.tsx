import type { Metadata } from "next";
import Link from "next/link";
import { STATES } from "@/data/states";
import { computeAffordability } from "@/lib/affordability";
import { computeValueScores } from "@/lib/valueScore";
import { LAST_REVIEWED, SITE_URL, UPDATE_CADENCE_TEXT } from "@/lib/site";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

type SortMode = "best" | "worst" | "alpha";

function parseSortMode(sort?: string): SortMode {
  if (sort === "worst" || sort === "alpha") {
    return sort;
  }
  return "best";
}

const VALID_SORTS = new Set(["best", "worst", "alpha"]);

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}): Promise<Metadata> {
  const { sort } = await searchParams;
  const isKnownSort = !sort || VALID_SORTS.has(sort);

  return {
    title: "Electricity Value Ranking by State | PriceOfElectricity.com",
    description:
      "Compare states by Electricity Value Score™ — a composite of price, affordability, and data freshness.",
    alternates: { canonical: `${BASE_URL}/value-ranking` },
    ...(!isKnownSort && { robots: { index: false, follow: true } }),
    openGraph: {
      title: "Electricity Value Ranking by State | PriceOfElectricity.com",
      description:
        "Compare states by Electricity Value Score™ — a composite of price, affordability, and data freshness.",
      url: `${BASE_URL}/value-ranking`,
      siteName: "PriceOfElectricity.com",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: "Electricity Value Ranking by State | PriceOfElectricity.com",
      description:
        "Compare states by Electricity Value Score™ — a composite of price, affordability, and data freshness.",
    },
  };
}

export default async function ValueRankingPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const sortMode = parseSortMode(sort);

  const affordability = computeAffordability(STATES);
  const valueScores = computeValueScores(STATES, affordability);

  const rows = valueScores
    .filter((v) => Boolean(STATES[v.slug]))
    .map((v) => ({
      ...v,
      stateName: STATES[v.slug].name,
      avgRateCentsPerKwh: STATES[v.slug].avgRateCentsPerKwh,
    }))
    .sort((a, b) => {
      if (sortMode === "alpha") {
        return a.stateName.localeCompare(b.stateName);
      }
      if (sortMode === "worst") {
        return a.score - b.score;
      }
      return b.score - a.score;
    });

  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Electricity Value Ranking by State",
    url: `${BASE_URL}/value-ranking`,
    description:
      "Compare states by Electricity Value Score™ — a composite of price, affordability, and data freshness.",
  };

  const itemListStructuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Electricity Value Ranking by State",
    numberOfItems: rows.length,
    itemListElement: rows.map((row, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Place",
        name: row.stateName,
        url: `${BASE_URL}/${row.slug}`,
      },
    })),
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageStructuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListStructuredData),
        }}
      />

      <h1>Electricity Value Ranking by State</h1>
      <p className="muted" style={{ marginTop: 0, marginBottom: 8 }}>
        {UPDATE_CADENCE_TEXT} {"•"} Last reviewed {LAST_REVIEWED} {"•"}{" "}
        <Link href="/about">Methodology</Link>
      </p>
      <p className="intro muted" style={{ marginTop: 0 }}>
        The Electricity Value Score™ blends price, affordability index, and data
        freshness into a single 0–100 composite metric. Higher scores indicate
        better value.
      </p>

      <p style={{ marginBottom: 12 }}>
        Sort:{" "}
        <Link href="/value-ranking?sort=best">Best value</Link> |{" "}
        <Link href="/value-ranking?sort=worst">Worst value</Link> |{" "}
        <Link href="/value-ranking?sort=alpha">A-Z</Link>
      </p>
      <p className="muted" style={{ marginTop: 0 }}>
        <Link href="/affordability">Affordability index</Link> {" | "}
        <Link href="/compare">Compare rates</Link>
      </p>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">State</th>
              <th scope="col">Value Score</th>
              <th scope="col">Tier</th>
              <th scope="col">Avg Rate (¢/kWh)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.slug}>
                <td>{sortMode === "alpha" ? "—" : i + 1}</td>
                <td>
                  <Link href={`/${row.slug}`}>{row.stateName}</Link>
                </td>
                <td>{row.score}</td>
                <td>{row.tier}</td>
                <td>{row.avgRateCentsPerKwh.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/compare">Compare rates</Link> {" | "}
        <Link href="/index-ranking">Price Index™</Link> {" | "}
        <Link href="/affordability">Affordability index</Link> {" | "}
        <Link href="/national">National overview</Link> {" | "}
        <Link href="/research">Research</Link>
      </p>
    </main>
  );
}
