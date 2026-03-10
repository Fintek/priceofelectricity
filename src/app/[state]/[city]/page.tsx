import type { Metadata } from "next";
import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STATES } from "@/data/states";
import { CITIES_BY_STATE } from "@/data/cities";
import { normalizeSlug } from "@/data/slug";
import { isValidStateSlug, isValidCitySlug } from "@/lib/slugGuard";

const BASE_URL = "https://priceofelectricity.com";
export const dynamic = "force-static";
export const revalidate = 2592000;

type CityParams = Promise<{ state: string; city: string }>;

export function generateStaticParams() {
  return Object.entries(CITIES_BY_STATE).flatMap(([state, cities]) =>
    cities.map((city) => ({ state, city: city.slug }))
  );
}

function resolveCityPage(rawState: string, rawCity: string) {
  const stateSlug = normalizeSlug(rawState);
  const citySlug = normalizeSlug(rawCity);
  if (!isValidStateSlug(stateSlug)) return null;
  if (!isValidCitySlug(stateSlug, citySlug)) return null;

  const state = STATES[stateSlug];
  const city = (CITIES_BY_STATE[stateSlug] ?? []).find(
    (entry) => entry.slug === citySlug
  );
  if (!city) return null;

  return { stateSlug, citySlug, state, city };
}

export async function generateMetadata({
  params,
}: {
  params: CityParams;
}): Promise<Metadata> {
  const { state, city } = await params;
  const resolved = resolveCityPage(state, city);

  if (!resolved) {
    return {
      title: "City not found | PriceOfElectricity.com",
      description: "City page not found.",
      alternates: { canonical: `${BASE_URL}/` },
    };
  }

  const { stateSlug, citySlug, state: stateInfo, city: cityInfo } = resolved;
  const rate = Number(stateInfo.avgRateCentsPerKwh);
  const title = `Electricity Price in ${cityInfo.name}, ${stateInfo.name} (¢/kWh Estimate)`;
  const description = `${cityInfo.name}, ${stateInfo.name} reference electricity price uses the state average of ${rate}¢/kWh (updated ${stateInfo.updated}) for energy-only bill estimates.`;
  const canonicalUrl = `${BASE_URL}/${stateSlug}/${citySlug}`;

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

export default function CityPage({
  params,
}: {
  params: CityParams;
}) {
  const { state, city } = use(params);
  const resolved = resolveCityPage(state, city);
  if (!resolved) {
    notFound();
  }

  const { stateSlug, citySlug, state: stateInfo, city: cityInfo } = resolved;
  const rate = Number(stateInfo.avgRateCentsPerKwh);
  if (!Number.isFinite(rate)) {
    notFound();
  }

  const exampleCost = (rate * 1000) / 100;
  const description = `${cityInfo.name}, ${stateInfo.name} reference electricity price uses the state average of ${rate}¢/kWh (updated ${stateInfo.updated}) for energy-only bill estimates.`;
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Electricity Price in ${cityInfo.name}, ${stateInfo.name}`,
    url: `${BASE_URL}/${stateSlug}/${citySlug}`,
    description,
  };

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageStructuredData),
        }}
      />
      <h1 style={{ fontSize: 36, marginBottom: 8 }}>
        Electricity Price in {cityInfo.name}, {stateInfo.name}
      </h1>

      <p style={{ fontSize: 18, color: "#555", marginTop: 0 }}>
        State average reference rate: <b>{rate}¢/kWh</b>
      </p>
      <p style={{ color: "#555", marginTop: 8 }}>
        Example energy-only cost at 1000 kWh: <b>${exampleCost.toFixed(2)}</b>
      </p>
      <p style={{ color: "#777", marginTop: 8 }}>
        This page uses the statewide average electricity price as a reference, not a
        city-specific utility tariff.
      </p>
      <p style={{ color: "#777", marginTop: 8 }}>
        City residents are billed by local utilities and plans, and rates can vary by
        provider, delivery charges, and taxes.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>Related links</h2>
        <p style={{ marginTop: 0 }}>
          <Link href={`/${stateSlug}`}>{stateInfo.name} electricity price page</Link>{" "}
          {" | "} <Link href={`/${stateSlug}/utilities`}>Utilities in {stateInfo.name}</Link>{" "}
          {" | "} <Link href="/electricity-cost-calculator">National calculator</Link> {" | "}{" "}
          <Link href="/compare">Compare all states</Link>
        </p>
      </section>
    </main>
  );
}
