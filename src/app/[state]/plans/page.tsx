import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import OutboundLink from "@/app/components/OutboundLink";
import { STATES } from "@/data/states";
import { normalizeSlug } from "@/data/slug";
import { isValidStateSlug } from "@/lib/slugGuard";
import { getPlansByState } from "@/data/plans";
import { createPartnerLink } from "@/lib/outbound";
import { LAST_REVIEWED, SITE_URL, UPDATE_CADENCE_TEXT } from "@/lib/site";

const BASE_URL = SITE_URL;
export const dynamicParams = true;
export const revalidate = 2592000;

type SortMode = "low" | "high" | "provider";
type PlansParams = Promise<{ state: string }>;
type PlansSearchParams = Promise<{ sort?: string }>;

function parseSortMode(sort?: string): SortMode {
  if (sort === "high" || sort === "provider") {
    return sort;
  }
  return "low";
}

function resolveState(rawState: string) {
  const stateSlug = normalizeSlug(rawState);
  if (!isValidStateSlug(stateSlug)) return null;
  const stateInfo = STATES[stateSlug];
  if (!stateInfo) {
    return null;
  }

  return { stateSlug, stateInfo };
}

export async function generateMetadata({
  params,
}: {
  params: PlansParams;
}): Promise<Metadata> {
  const { state } = await params;
  const resolved = resolveState(state);
  if (!resolved) {
    return {
      title: "State not found | PriceOfElectricity.com",
      description: "State plans page not found.",
      alternates: { canonical: `${BASE_URL}/` },
    };
  }

  const { stateSlug, stateInfo } = resolved;
  const title = `${stateInfo.name} Electricity Plans | PriceOfElectricity.com`;
  const description = `Compare electricity plan examples for ${stateInfo.name} (manual MVP).`;
  const canonicalUrl = `${BASE_URL}/${stateSlug}/plans`;

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

export default async function StatePlansPage({
  params,
  searchParams,
}: {
  params: PlansParams;
  searchParams: PlansSearchParams;
}) {
  const { state } = await params;
  const { sort } = await searchParams;
  const resolved = resolveState(state);
  if (!resolved) {
    notFound();
  }

  const { stateSlug, stateInfo } = resolved;
  const sortMode = parseSortMode(sort);
  const plans = getPlansByState(stateSlug);
  const sortedPlans = [...plans].sort((a, b) => {
    if (sortMode === "provider") {
      return a.providerName.localeCompare(b.providerName);
    }
    if (sortMode === "high") {
      return b.priceCentsPerKwh - a.priceCentsPerKwh;
    }
    return a.priceCentsPerKwh - b.priceCentsPerKwh;
  });

  const description = `Compare electricity plan examples for ${stateInfo.name} (manual MVP).`;
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${stateInfo.name} Electricity Plans`,
    url: `${BASE_URL}/${stateSlug}/plans`,
    description,
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageStructuredData) }}
      />
      <h1>{stateInfo.name} Electricity Plans</h1>
      <p className="muted" style={{ marginTop: 0, marginBottom: 8 }}>
        {UPDATE_CADENCE_TEXT} {"•"} Last reviewed {LAST_REVIEWED} {"•"}{" "}
        <Link href="/about">Methodology</Link>
      </p>
      <p className="muted" style={{ marginTop: 0 }}>
        {description}
      </p>
      <p className="muted" style={{ marginTop: 6 }}>
        Guide:{" "}
        <Link href="/guides/fixed-vs-variable-electricity-rates">
          Fixed vs variable electricity rates
        </Link>
        .
      </p>
      <p className="muted" style={{ marginTop: 6 }}>
        <Link href={`/${stateSlug}/plan-types`}>Explore plan types in {stateInfo.name}</Link>.
      </p>
      <p className="muted" style={{ marginTop: 6 }}>
        Get monthly updates - <Link href="/newsletter">join the newsletter</Link>.
      </p>
      <p className="muted" style={{ marginTop: 6 }}>
        <Link href={`/offers/${stateSlug}`}>See offers & savings in {stateInfo.name}</Link>.
      </p>

      {sortedPlans.length === 0 ? (
        <>
          <p style={{ color: "#777", marginTop: 12 }}>
            Plan shopping coming soon for this state.
          </p>
          <p>
            <Link href={`/${stateSlug}`}>Back to {stateInfo.name} electricity page</Link>
          </p>
        </>
      ) : (
        <>
          <p style={{ marginBottom: 12 }}>
            Sort: <Link href={`/${stateSlug}/plans?sort=low`}>Lowest rate</Link> |{" "}
            <Link href={`/${stateSlug}/plans?sort=high`}>Highest rate</Link> |{" "}
            <Link href={`/${stateSlug}/plans?sort=provider`}>Provider A-Z</Link>
          </p>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Provider</th>
                  <th scope="col">Plan</th>
                  <th scope="col">Rate (¢/kWh)</th>
                  <th scope="col">Rate type</th>
                  <th scope="col">Term</th>
                  <th scope="col">Updated</th>
                  <th scope="col">Link</th>
                </tr>
              </thead>
              <tbody>
                {sortedPlans.map((plan) => (
                  <tr key={plan.id}>
                    <td>{plan.providerName}</td>
                    <td>{plan.planName}</td>
                    <td>{plan.priceCentsPerKwh.toFixed(2)}</td>
                    <td>{plan.rateType ?? "-"}</td>
                    <td>{plan.termMonths ? `${plan.termMonths} mo` : "-"}</td>
                    <td>{plan.updated}</td>
                    <td>
                      {plan.website ? (
                        <OutboundLink
                          {...createPartnerLink(
                            {
                              id: plan.id,
                              label: `${plan.providerName} ${plan.planName}`,
                              href: plan.website,
                            },
                            {
                              campaign: "plans-page",
                              stateSlug,
                            },
                          )}
                          page="state-plans"
                          stateSlug={stateSlug}
                        >
                          Provider site
                        </OutboundLink>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ color: "#777", marginTop: 12 }}>
            Manual MVP examples; verify on provider site.
          </p>
          <p style={{ color: "#999", marginTop: 6 }}>
            {sortedPlans[0]?.notes ?? "Example pricing (manual MVP)"}
          </p>
        </>
      )}

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
