import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CITIES, getCitiesByState } from "@/data/cities";
import { STATES } from "@/data/states";
import { normalizeSlug } from "@/data/slug";
import { isValidStateSlug, isValidCitySlug } from "@/lib/slugGuard";
import { computeAffordability } from "@/lib/affordability";
import { computeFreshness } from "@/lib/freshness";
import { LAST_REVIEWED, SITE_URL, UPDATE_CADENCE_TEXT } from "@/lib/site";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 2592000;

type CityParams = Promise<{ state: string; citySlug: string }>;

export function generateStaticParams() {
  return CITIES.map((city) => ({ state: city.stateSlug, citySlug: city.slug }));
}

function resolveCity(rawState: string, rawCitySlug: string) {
  const stateSlug = normalizeSlug(rawState);
  const citySlug = normalizeSlug(rawCitySlug);
  if (!isValidStateSlug(stateSlug)) return null;
  if (!isValidCitySlug(stateSlug, citySlug)) return null;

  const state = STATES[stateSlug];
  const city = getCitiesByState(stateSlug).find((entry) => entry.slug === citySlug);
  if (!city) return null;

  return { stateSlug, citySlug, state, city };
}

export async function generateMetadata({
  params,
}: {
  params: CityParams;
}): Promise<Metadata> {
  const { state, citySlug } = await params;
  const resolved = resolveCity(state, citySlug);
  if (!resolved) {
    return {
      title: "City not found | PriceOfElectricity.com",
      description: "City page not found.",
      alternates: { canonical: `${BASE_URL}/` },
    };
  }

  const { stateSlug, city, state: stateInfo } = resolved;
  const title = `${city.name} Electricity Rates | ${stateInfo.name}`;
  const description = `Estimated electricity rates for ${city.name}, ${stateInfo.name}, including an energy-only bill example at 1000 kWh.`;
  const canonicalUrl = `${BASE_URL}/${stateSlug}/city/${city.slug}`;

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

export default async function CityRatePage({
  params,
}: {
  params: CityParams;
}) {
  const { state, citySlug } = await params;
  const resolved = resolveCity(state, citySlug);
  if (!resolved) {
    notFound();
  }

  const { stateSlug, state: stateInfo, city } = resolved;
  const rateCentsPerKwh = city.avgRateCentsPerKwh ?? stateInfo.avgRateCentsPerKwh;
  if (!Number.isFinite(rateCentsPerKwh)) {
    notFound();
  }

  const billAt1000Kwh = (rateCentsPerKwh * 1000) / 100;
  const affordabilityByState = Object.fromEntries(
    computeAffordability(STATES).map((entry) => [entry.slug, entry]),
  );
  const affordability = affordabilityByState[stateSlug];
  const freshness = computeFreshness(stateInfo.updated);
  const freshnessDotColor =
    freshness.status === "fresh"
      ? "#2e7d32"
      : freshness.status === "aging"
        ? "#b26a00"
        : "#b00020";

  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${city.name} Electricity Rates`,
    url: `${BASE_URL}/${stateSlug}/city/${city.slug}`,
    description: `Estimated electricity rates for ${city.name}, ${stateInfo.name}.`,
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "City-level estimate",
        value: city.avgRateCentsPerKwh ? "city override" : "state average fallback",
      },
    ],
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageStructuredData) }}
      />
      <h1>{city.name} Electricity Rates</h1>
      <p className="muted" style={{ marginTop: 0, marginBottom: 8 }}>
        {UPDATE_CADENCE_TEXT} {"•"} Last reviewed {LAST_REVIEWED}
      </p>
      <p style={{ marginTop: 0 }}>
        Rate: <b>{rateCentsPerKwh.toFixed(2)}¢/kWh</b>
      </p>
      <p>
        Example bill at 1000 kWh (energy-only): <b>${billAt1000Kwh.toFixed(2)}</b>
      </p>
      {affordability ? (
        <p style={{ marginTop: 6 }}>
          State affordability index: <b>{affordability.indexScore}</b> ({affordability.category})
        </p>
      ) : null}
      <p className="muted" style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
        <span
          aria-hidden
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: freshnessDotColor,
            display: "inline-block",
          }}
        />
        <span>{freshness.label}</span>
      </p>
      <p className="muted" style={{ marginTop: 6 }}>
        Electricity rates in {city.name} are based on state averages unless otherwise noted.
      </p>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ marginBottom: 8 }}>Related links</h2>
        <p style={{ marginTop: 0 }}>
          <Link href={`/${stateSlug}`}>{stateInfo.name} electricity page</Link> {" | "}
          <Link href={`/${stateSlug}/utilities`}>Utilities in {stateInfo.name}</Link> {" | "}
          <Link href="/compare">Compare all states</Link>
        </p>
      </section>
    </main>
  );
}
