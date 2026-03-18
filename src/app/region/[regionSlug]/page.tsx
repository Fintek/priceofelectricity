import type { Metadata } from "next";
import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { REGION_BY_SLUG } from "@/data/regions";
import { STATES } from "@/data/states";
import { normalizeSlug } from "@/data/slug";

const BASE_URL = "https://priceofelectricity.com";
export const dynamicParams = true;
export const revalidate = 2592000;

type RegionParams = Promise<{ regionSlug: string }>;

function resolveRegion(rawRegionSlug: string) {
  const regionSlug = normalizeSlug(rawRegionSlug);
  const region = REGION_BY_SLUG[regionSlug];
  if (!region) {
    return null;
  }
  return { regionSlug, region };
}

export async function generateMetadata({
  params,
}: {
  params: RegionParams;
}): Promise<Metadata> {
  const { regionSlug } = await params;
  const resolved = resolveRegion(regionSlug);

  if (!resolved) {
    return {
      title: "Region not found | PriceOfElectricity.com",
      description: "Region page not found.",
      alternates: { canonical: `${BASE_URL}/` },
    };
  }

  const { region, regionSlug: canonicalRegionSlug } = resolved;
  const title = `${region.name} Electricity Prices (¢/kWh)`;
  const description = `Compare average residential electricity prices across ${region.name} states and view energy-only bill examples.`;
  const canonicalUrl = `${BASE_URL}/region/${canonicalRegionSlug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "PriceOfElectricity.com",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default function RegionPage({
  params,
}: {
  params: RegionParams;
}) {
  const { regionSlug } = use(params);
  const resolved = resolveRegion(regionSlug);
  if (!resolved) {
    notFound();
  }

  const { region, regionSlug: canonicalRegionSlug } = resolved;
  const rows = region.states
    .map((slug) => {
      const state = STATES[slug];
      if (!state) {
        return null;
      }
      return {
        slug,
        name: state.name,
        rate: state.avgRateCentsPerKwh,
        exampleBill1000: Number(((state.avgRateCentsPerKwh * 1000) / 100).toFixed(2)),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => a.name.localeCompare(b.name));

  const description = `Compare average residential electricity prices across ${region.name} states and view energy-only bill examples.`;
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${region.name} Electricity Prices`,
    url: `${BASE_URL}/region/${canonicalRegionSlug}`,
    description,
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageStructuredData) }}
      />
      <h1>{region.name} Electricity Prices</h1>
      <p className="muted intro" style={{ marginTop: 0 }}>
        Compare state-level average residential rates within the {region.name} and
        review energy-only example monthly costs at 1000 kWh.
      </p>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">State</th>
              <th scope="col">Avg rate (¢/kWh)</th>
              <th scope="col">1000 kWh example bill</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.slug}>
                <td>
                  <Link href={`/${row.slug}`}>{row.name}</Link>
                </td>
                <td>{row.rate.toFixed(2)}</td>
                <td>${row.exampleBill1000.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
