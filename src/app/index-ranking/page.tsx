import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import {
  computeElectricityPriceIndex,
  getNationalAverageRate,
} from "@/lib/priceIndex";

const BASE_URL = SITE_URL;

export const dynamic = "force-static";
export const revalidate = 2592000;

type SortMode = "high" | "low" | "alpha";

function parseSortMode(sort?: string): SortMode {
  if (sort === "low" || sort === "alpha") return sort;
  return "high";
}

const VALID_SORTS = new Set(["high", "low", "alpha"]);

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}): Promise<Metadata> {
  const { sort } = await searchParams;
  const isKnownSort = !sort || VALID_SORTS.has(sort);

  return {
    title: "Electricity Price Index™ by State | PriceOfElectricity.com",
    description:
      "Compare state electricity prices using the Electricity Price Index™. Base 100 = national average. See which states pay above or below average.",
    alternates: { canonical: `${BASE_URL}/index-ranking` },
    ...(!isKnownSort && { robots: { index: false, follow: true } }),
    openGraph: {
      title: "Electricity Price Index™ by State | PriceOfElectricity.com",
      description:
        "Compare state electricity prices using the Electricity Price Index™.",
      url: `${BASE_URL}/index-ranking`,
      siteName: "PriceOfElectricity.com",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: "Electricity Price Index™ by State | PriceOfElectricity.com",
      description:
        "Compare state electricity prices using the Electricity Price Index™.",
    },
  };
}

export default async function IndexRankingPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const sortMode = parseSortMode(sort);
  const allEntries = computeElectricityPriceIndex();
  const nationalAvg = getNationalAverageRate();

  const sorted = [...allEntries].sort((a, b) => {
    if (sortMode === "alpha") return a.name.localeCompare(b.name);
    if (sortMode === "low") return a.indexValue - b.indexValue;
    return b.indexValue - a.indexValue;
  });

  const itemListStructuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Electricity Price Index™ by State",
    url: `${BASE_URL}/index-ranking`,
    numberOfItems: sorted.length,
    itemListElement: sorted.slice(0, 10).map((entry, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${entry.name} — EPI ${entry.indexValue}`,
      url: `${BASE_URL}/${entry.slug}`,
    })),
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListStructuredData),
        }}
      />

      <h1>Electricity Price Index™ by State</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        The Electricity Price Index™ (EPI) normalizes each state&apos;s average
        residential electricity rate to a national baseline of{" "}
        <strong>100</strong>. The current national average is{" "}
        <strong>{nationalAvg.toFixed(2)}¢/kWh</strong>. An index value above
        100 means the state&apos;s rate is higher than the national average; below
        100 means it is lower.
      </p>

      <p style={{ marginBottom: 12 }}>
        Sort:{" "}
        <Link href="/index-ranking?sort=high">Highest index</Link> |{" "}
        <Link href="/index-ranking?sort=low">Lowest index</Link> |{" "}
        <Link href="/index-ranking?sort=alpha">A–Z</Link>
      </p>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">State</th>
              <th scope="col">Rate (¢/kWh)</th>
              <th scope="col">Index (Base 100)</th>
              <th scope="col">Position</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry, i) => (
              <tr key={entry.slug}>
                <td>{i + 1}</td>
                <td>
                  <Link href={`/${entry.slug}`} prefetch={false}>
                    {entry.name}
                  </Link>
                </td>
                <td>{entry.rawRate.toFixed(2)}</td>
                <td>
                  <strong>{entry.indexValue}</strong>
                </td>
                <td>{entry.relativePosition}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/compare">Compare rates</Link> {" | "}
        <Link href="/value-ranking">Value ranking</Link> {" | "}
        <Link href="/affordability">Affordability index</Link> {" | "}
        <Link href="/national">National overview</Link> {" | "}
        <Link href="/research">Research</Link>
      </p>
    </main>
  );
}
