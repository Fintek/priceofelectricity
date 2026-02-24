import type { Metadata } from "next";
import Link from "next/link";
import { STATES } from "@/data/states";
import { computeAffordability } from "@/lib/affordability";
import { computeFreshness } from "@/lib/freshness";
import { LAST_REVIEWED, SITE_URL, UPDATE_CADENCE_TEXT } from "@/lib/site";
import { getRelatedForTool } from "@/lib/related";
import RelatedLinks from "@/app/components/RelatedLinks";

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
    title: "Electricity Affordability by State (Index) | PriceOfElectricity.com",
    description: "Compare electricity affordability scores across states.",
    alternates: { canonical: `${BASE_URL}/affordability` },
    ...(!isKnownSort && { robots: { index: false, follow: true } }),
    openGraph: {
      title: "Electricity Affordability by State (Index) | PriceOfElectricity.com",
      description: "Compare electricity affordability scores across states.",
      url: `${BASE_URL}/affordability`,
      siteName: "PriceOfElectricity.com",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: "Electricity Affordability by State (Index) | PriceOfElectricity.com",
      description: "Compare electricity affordability scores across states.",
    },
  };
}

export default async function AffordabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const sortMode = parseSortMode(sort);

  const affordability = computeAffordability(STATES)
    .filter((record) => Boolean(STATES[record.slug]))
    .map((record) => ({
      ...record,
      stateName: STATES[record.slug].name,
    }))
    .sort((a, b) => {
      if (sortMode === "alpha") {
        return a.stateName.localeCompare(b.stateName);
      }
      if (sortMode === "worst") {
        return a.indexScore - b.indexScore;
      }
      return b.indexScore - a.indexScore;
    });

  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Electricity Affordability by State",
    url: `${BASE_URL}/affordability`,
    description: "Compare electricity affordability scores across states.",
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageStructuredData) }}
      />

      <h1>Electricity Affordability by State</h1>
      <p className="muted" style={{ marginTop: 0, marginBottom: 8 }}>
        {UPDATE_CADENCE_TEXT} {"•"} Last reviewed {LAST_REVIEWED} {"•"}{" "}
        <Link href="/about">Methodology</Link>
      </p>
      <p className="muted" style={{ marginTop: 0 }}>
        The Electricity Affordability Index is derived from state average residential rates.
        Scores are normalized from 0 to 100, where higher means cheaper electricity relative to
        other states.
      </p>

      <p style={{ marginBottom: 12 }}>
        Sort: <Link href="/affordability?sort=best">Best affordability</Link> |{" "}
        <Link href="/affordability?sort=worst">Worst affordability</Link> |{" "}
        <Link href="/affordability?sort=alpha">A-Z</Link>
      </p>
      <p className="muted" style={{ marginTop: 0 }}>
        <Link href="/value-ranking">Electricity Value Score™ ranking</Link> {" | "}
        Get monthly updates - <Link href="/newsletter">join the newsletter</Link>.
      </p>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">State</th>
              <th scope="col">Avg Rate (¢/kWh)</th>
              <th scope="col">Affordability Score</th>
              <th scope="col">Category</th>
              <th scope="col">Freshness</th>
            </tr>
          </thead>
          <tbody>
            {affordability.map((record) => (
              <tr key={record.slug}>
                <td>
                  <Link href={`/${record.slug}`}>{record.stateName}</Link>
                </td>
                <td>{record.avgRateCentsPerKwh.toFixed(2)}</td>
                <td>{record.indexScore}</td>
                <td>{record.category}</td>
                <td>{computeFreshness(STATES[record.slug].updated).label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RelatedLinks links={getRelatedForTool("affordability")} />
    </main>
  );
}
