import type { Metadata } from "next";
import Link from "next/link";
import { STATE_LIST } from "@/data/states";
import { computeFreshness } from "@/lib/freshness";
import { LAST_REVIEWED, SITE_URL, UPDATE_CADENCE_TEXT } from "@/lib/site";
import { getRelatedForTool } from "@/lib/related";
import RelatedLinks from "@/app/components/RelatedLinks";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

type SortMode = "high" | "low" | "alpha";

function parseSortMode(sort?: string): SortMode {
  if (sort === "low" || sort === "alpha") {
    return sort;
  }
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
    title: "Compare Electricity Prices by State (¢/kWh) | PriceOfElectricity.com",
    description:
      "Compare average residential electricity prices by state and estimate energy-only monthly bills.",
    alternates: { canonical: `${BASE_URL}/compare` },
    ...(!isKnownSort && { robots: { index: false, follow: true } }),
    openGraph: {
      title: "Compare Electricity Prices by State (¢/kWh) | PriceOfElectricity.com",
      description:
        "Compare average residential electricity prices by state and estimate energy-only monthly bills.",
      url: `${BASE_URL}/compare`,
      siteName: "PriceOfElectricity.com",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: "Compare Electricity Prices by State (¢/kWh) | PriceOfElectricity.com",
      description:
        "Compare average residential electricity prices by state and estimate energy-only monthly bills.",
    },
  };
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const sortMode = parseSortMode(sort);
  const states = [...STATE_LIST].sort((a, b) => {
    if (sortMode === "alpha") {
      return a.name.localeCompare(b.name);
    }
    if (sortMode === "low") {
      return a.avgRateCentsPerKwh - b.avgRateCentsPerKwh;
    }
    return b.avgRateCentsPerKwh - a.avgRateCentsPerKwh;
  });

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Compare Electricity Prices by State",
    url: `${BASE_URL}/compare`,
    description:
      "Compare average residential electricity prices by state and estimate energy-only monthly bills.",
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <h1>
        Compare Electricity Prices by State
      </h1>
      <p className="muted" style={{ marginTop: 0, marginBottom: 8 }}>
        {UPDATE_CADENCE_TEXT} {"•"} Last reviewed {LAST_REVIEWED} {"•"}{" "}
        <Link href="/about">Methodology</Link>
      </p>
      <p className="intro muted" style={{ marginTop: 0 }}>
        Compare average residential electricity prices (¢/kWh) and see example
        energy-only monthly costs at 1000 kWh.
      </p>

      <p style={{ marginBottom: 12 }}>
        Sort:{" "}
        <Link href="/compare?sort=high">Highest rate</Link> |{" "}
        <Link href="/compare?sort=low">Lowest rate</Link> |{" "}
        <Link href="/compare?sort=alpha">A-Z</Link>
      </p>
      <p className="muted" style={{ marginTop: 0 }}>
        Shopping for plans? Start with{" "}
        <Link href="/texas/plans">Texas plans</Link>.
      </p>
      <p className="muted" style={{ marginTop: 6 }}>
        Looking for relative cost context? View the{" "}
        <Link href="/affordability">Electricity Affordability Index</Link>,{" "}
        <Link href="/value-ranking">Electricity Value Score™ ranking</Link>, or{" "}
        <Link href="/index-ranking">Electricity Price Index™</Link>.
      </p>
      <p className="muted" style={{ marginTop: 6 }}>
        Explore the cluster: <Link href="/topics/electricity-prices">Electricity Prices</Link>.
      </p>
      <p className="muted" style={{ marginTop: 6 }}>
        Get monthly updates - <Link href="/newsletter">join the newsletter</Link>.
      </p>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">State</th>
              <th scope="col">Avg rate (¢/kWh)</th>
              <th scope="col">Example bill @ 1000 kWh (energy-only)</th>
              <th scope="col">Freshness</th>
            </tr>
          </thead>
          <tbody>
            {states.map((state) => (
              <tr key={state.slug}>
                <td>
                  <Link href={`/${state.slug}`}>{state.name}</Link>
                </td>
                <td>{state.avgRateCentsPerKwh.toFixed(2)}</td>
                <td>${(state.avgRateCentsPerKwh * 10).toFixed(2)}</td>
                <td>{computeFreshness(state.updated).label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="muted" style={{ marginTop: 16, fontSize: 14 }}>
        Looking for deals? <Link href="/offers">Browse offers & savings</Link>.
      </p>

      <RelatedLinks links={getRelatedForTool("compare")} />

      <section
        style={{
          marginTop: 24,
          paddingTop: 12,
          borderTop: "1px solid #eeeeee",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Partner with us</h2>
        <p className="muted" style={{ marginTop: 0, marginBottom: 0 }}>
          For advertising, partnerships, or data corrections, <Link href="/contact">contact us</Link>.
        </p>
      </section>
    </main>
  );
}
