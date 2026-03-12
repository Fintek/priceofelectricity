import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STATES } from "@/data/states";
import { normalizeSlug } from "@/data/slug";
import { getActiveCitiesForState } from "@/lib/longtail/rollout";
import { isValidStateSlug } from "@/lib/slugGuard";
import { getUtilitiesByState } from "@/data/utilities";
import { LAST_REVIEWED, SITE_URL, UPDATE_CADENCE_TEXT } from "@/lib/site";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

type StateParams = Promise<{ state: string }>;

export function generateStaticParams() {
  return Object.keys(STATES).map((state) => ({ state }));
}

function resolveState(rawState: string) {
  const slug = normalizeSlug(rawState);
  if (!isValidStateSlug(slug)) return null;
  const info = STATES[slug];
  return { slug, info };
}

export async function generateMetadata({
  params,
}: {
  params: StateParams;
}): Promise<Metadata> {
  const { state } = await params;
  const resolved = resolveState(state);

  if (!resolved) {
    return {
      title: "State not found | PriceOfElectricity.com",
      description: "State page not found.",
      alternates: { canonical: `${BASE_URL}/` },
    };
  }

  const { slug, info } = resolved;
  const canonicalUrl = `${BASE_URL}/${slug}/utilities`;
  return {
    title: `${info.name} Utilities | PriceOfElectricity.com`,
    description: `Electric utilities serving ${info.name}. (Manual MVP list)`,
    alternates: { canonical: canonicalUrl },
  };
}

export default async function StateUtilitiesPage({
  params,
}: {
  params: StateParams;
}) {
  const { state: stateParam } = await params;
  const resolved = resolveState(stateParam);
  if (!resolved) {
    notFound();
  }

  const { slug, info } = resolved;
  const utilities = getUtilitiesByState(slug);
  const cities = getActiveCitiesForState(slug);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${info.name} Utilities`,
    url: `${BASE_URL}/${slug}/utilities`,
    description: `Electric utilities serving ${info.name}. (Manual MVP list)`,
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <h1>{info.name} Utilities</h1>
      <p className="muted" style={{ marginTop: 0, marginBottom: 8 }}>
        {UPDATE_CADENCE_TEXT} {"•"} Last reviewed {LAST_REVIEWED} {"•"}{" "}
        <Link href="/about">Methodology</Link>
      </p>

      {utilities.length === 0 ? (
        <>
          <p className="intro muted">Utility list coming soon.</p>
          <p>
            <Link href={`/${slug}`}>Back to {info.name} electricity page</Link>
          </p>
        </>
      ) : (
        <>
          <p className="intro muted">
            Manual MVP list of electric utilities in {info.name}.
          </p>
          <ul style={{ paddingLeft: 20 }}>
            {utilities.map((utility) => (
              <li key={utility.slug} style={{ marginBottom: 10 }}>
                <Link href={`/${slug}/utility/${utility.slug}`}>{utility.name}</Link>
                {utility.avgRateCentsPerKwh ? (
                  <span style={{ color: "#777" }}>
                    {" "}
                    - {utility.avgRateCentsPerKwh.toFixed(2)}¢/kWh
                  </span>
                ) : (
                  <span style={{ color: "#777" }}> - Uses state average by default</span>
                )}
              </li>
            ))}
          </ul>
          {cities.length > 0 ? (
            <p className="muted" style={{ marginTop: 8 }}>
              <Link href={`/electricity-cost/${slug}/${cities[0].slug}`}>Serving cities in {info.name}</Link>
            </p>
          ) : null}
          <p>
            <Link href={`/${slug}`}>Back to {info.name} electricity page</Link>
          </p>
        </>
      )}
    </main>
  );
}
