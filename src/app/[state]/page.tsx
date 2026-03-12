import type { Metadata } from "next";
import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import BillEstimator from "../components/BillEstimator";
import SetPreferredStateButton from "../components/SetPreferredStateButton";
import TrackedOutboundLink from "../components/TrackedOutboundLink";
import { STATES } from "@/data/states";
import { HISTORY_BY_STATE } from "@/data/history";
import { getUtilitiesByState } from "@/data/utilities";
import { getRegionByStateSlug } from "@/data/regions";
import { normalizeSlug } from "@/data/slug";
import { isValidStateSlug } from "@/lib/slugGuard";
import { buildNormalizedState } from "@/lib/stateBuilder";
import { buildStateSchema } from "@/lib/schema";
import { getElectricityPriceIndexForState } from "@/lib/priceIndex";
import { LAST_REVIEWED, SITE_URL, UPDATE_CADENCE_TEXT } from "@/lib/site";
import {
  getPrevNextByName,
  getRelatedByRate,
  getStatesSortedByName,
} from "@/lib/nav";
import { getRelatedLinks } from "@/lib/related";
import RelatedLinks from "@/app/components/RelatedLinks";
import CommercialPlacement from "@/components/monetization/CommercialPlacement";
import { getRateCasesForState, getTimelineForState } from "@/content/regulatory";
import { getTopDriversForState, DRIVER_CATEGORY_LABELS } from "@/content/drivers";
import { getActiveCitiesForState } from "@/lib/longtail/rollout";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

type StateParams = Promise<{ state: string }>;

export function generateStaticParams() {
  return Object.keys(STATES).map((state) => ({ state }));
}

function resolveSlug(rawState: string): string | null {
  const slug = normalizeSlug(rawState);
  return isValidStateSlug(slug) ? slug : null;
}

export async function generateMetadata({
  params,
}: {
  params: StateParams;
}): Promise<Metadata> {
  const { state } = await params;
  const slug = resolveSlug(state);

  if (!slug) {
    return {
      title: "State not found | PriceOfElectricity.com",
      description: "State page not found.",
      alternates: { canonical: `${BASE_URL}/` },
      openGraph: {
        title: "State not found | PriceOfElectricity.com",
        description: "State page not found.",
        url: `${BASE_URL}/`,
        siteName: "PriceOfElectricity.com",
        type: "website",
      },
      twitter: {
        card: "summary",
        title: "State not found | PriceOfElectricity.com",
        description: "State page not found.",
      },
    };
  }

  const ns = buildNormalizedState(slug);
  const title = `${ns.name} Electricity Price (¢/kWh) + Bill Estimator | PriceOfElectricity.com`;
  const description = `${ns.name} average residential electricity rate is ${ns.avgRateCentsPerKwh}¢/kWh (updated ${ns.updated}). Estimate your monthly bill with our quick calculator.`;
  const canonicalUrl = `${BASE_URL}/${slug}`;

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

function PriceDriversPanel({ slug, stateName }: { slug: string; stateName: string }) {
  const topDrivers = getTopDriversForState(slug, 3);

  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 22, marginBottom: 8 }}>
        Price drivers (qualitative)
      </h2>
      {topDrivers.length > 0 ? (
        <>
          <ul style={{ marginTop: 0, paddingLeft: 20, lineHeight: 2 }}>
            {topDrivers.map((d) => (
              <li key={d.id}>
                <b>{DRIVER_CATEGORY_LABELS[d.category]}:</b> {d.title}
              </li>
            ))}
          </ul>
          <p className="muted" style={{ marginTop: 6 }}>
            <Link href={`/drivers/${slug}`}>
              View full drivers analysis for {stateName}
            </Link>
          </p>
        </>
      ) : (
        <p className="muted" style={{ marginTop: 0 }}>
          No drivers published yet.{" "}
          <Link href="/drivers">View all price drivers</Link>.
        </p>
      )}
    </section>
  );
}

function RegulatorySignals({ slug, stateName }: { slug: string; stateName: string }) {
  const openCases = getRateCasesForState(slug).filter((rc) => rc.status === "open");
  const timeline = getTimelineForState(slug);
  const mostRecent = timeline.length > 0 ? timeline[0] : null;

  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 22, marginBottom: 8 }}>Regulatory signals</h2>
      <ul style={{ marginTop: 0, paddingLeft: 20, lineHeight: 2 }}>
        <li>
          Open rate cases: <b>{openCases.length}</b>
        </li>
        {mostRecent && (
          <li>
            Most recent event: <b>{mostRecent.title}</b>{" "}
            <span className="muted">({mostRecent.date})</span>
          </li>
        )}
        {!mostRecent && openCases.length === 0 && (
          <li className="muted">No regulatory events tracked yet.</li>
        )}
      </ul>
      <p className="muted" style={{ marginTop: 6 }}>
        <Link href={`/regulatory/${slug}`}>
          View regulatory overview for {stateName}
        </Link>
      </p>
    </section>
  );
}

export default function StatePage({
  params,
}: {
  params: StateParams;
}) {
  const { state } = use(params);
  const slug = resolveSlug(state);
  if (!slug) {
    notFound();
  }

  const ns = buildNormalizedState(slug);
  const history = HISTORY_BY_STATE[slug];
  const latestSeries = history?.series.at(-1);
  const previousSeries = history && history.series.length >= 2 ? history.series.at(-2) : undefined;
  const momDeltaCents =
    latestSeries && previousSeries
      ? latestSeries.avgRateCentsPerKwh - previousSeries.avgRateCentsPerKwh
      : null;
  const momDeltaPct =
    momDeltaCents !== null && previousSeries && previousSeries.avgRateCentsPerKwh !== 0
      ? (momDeltaCents / previousSeries.avgRateCentsPerKwh) * 100
      : null;

  if (!Number.isFinite(ns.avgRateCentsPerKwh)) {
    notFound();
  }

  const schema = buildStateSchema(ns);
  const epi = getElectricityPriceIndexForState(slug);

  const freshnessDotColor =
    ns.freshnessStatus === "fresh"
      ? "#2e7d32"
      : ns.freshnessStatus === "aging"
        ? "#b26a00"
        : "#b00020";

  const sortedStates = getStatesSortedByName(STATES);
  const { prev, next } = getPrevNextByName(slug, sortedStates);
  const relatedStates = getRelatedByRate(slug, STATES, 5);
  const majorCities = getActiveCitiesForState(slug);
  const majorUtilities = getUtilitiesByState(slug);
  const region = getRegionByStateSlug(slug);
  const otherStatesInRegion = region
    ? region.states
        .filter((stateSlug) => stateSlug !== slug && Boolean(STATES[stateSlug]))
        .map((stateSlug) => ({
          slug: stateSlug,
          name: STATES[stateSlug].name,
          rate: STATES[stateSlug].avgRateCentsPerKwh,
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  const billByKwh = Object.fromEntries(
    ns.exampleBills.map((b) => [b.kwh, b.estimated])
  ) as Record<number, number>;

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema.webPage),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema.faq),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema.breadcrumb),
        }}
      />
      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/">Home</Link> {"→"} <Link href="/compare">Compare</Link>{" "}
        {"→"} <span>{ns.name}</span>
      </p>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h1 style={{ margin: 0 }}>{ns.name}</h1>
        <SetPreferredStateButton stateSlug={slug} />
      </div>

      <p className="intro muted" style={{ marginTop: 0 }}>
        Avg residential rate (manual MVP): <b>{ns.avgRateCentsPerKwh}¢/kWh</b>
      </p>
      <p className="muted" style={{ marginTop: 0, marginBottom: 8 }}>
        {UPDATE_CADENCE_TEXT} {"•"} Last reviewed {LAST_REVIEWED} {"•"}{" "}
        <Link href="/about">Methodology</Link>
      </p>

      <p className="muted">Last updated: {ns.updated}</p>
      <p className="muted" style={{ marginTop: 6 }}>
        Previous month:{" "}
        {previousSeries ? (
          <>
            {previousSeries.ym} ({previousSeries.avgRateCentsPerKwh.toFixed(2)}¢/kWh) {"•"}{" "}
            MoM: {momDeltaCents !== null ? (momDeltaCents >= 0 ? "+" : "") : ""}
            {momDeltaCents !== null ? `${momDeltaCents.toFixed(2)}¢` : "N/A"} (
            {momDeltaPct !== null
              ? `${momDeltaPct >= 0 ? "+" : ""}${momDeltaPct.toFixed(2)}%`
              : "N/A"}
            )
          </>
        ) : (
          "N/A"
        )}
      </p>
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
        <span>{ns.freshnessLabel}</span>
      </p>
      <p className="muted" style={{ marginTop: 6 }}>
        Source:{" "}
        {ns.source.slug ? (
          <>
            <Link href={`/sources/${ns.source.slug}`}>{ns.source.name}</Link>
            {" · "}
            <TrackedOutboundLink
              href={ns.source.url}
              eventName="SourceLinkClick"
              props={{ state: slug }}
            >
              External data
            </TrackedOutboundLink>
          </>
        ) : (
          <TrackedOutboundLink
            href={ns.source.url}
            eventName="SourceLinkClick"
            props={{ state: slug }}
          >
            {ns.source.name}
          </TrackedOutboundLink>
        )}
      </p>
      <p className="muted" style={{ marginTop: 6 }}>
        Methodology: {ns.methodology}
      </p>
      <p className="muted" style={{ marginTop: 6 }}>
        <Link href="/data-policy">Data policy</Link>
      </p>
      <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>
        {ns.disclaimer}
      </p>
      <section style={{ marginTop: 8 }}>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>More for {ns.name}</h2>
        <p style={{ marginTop: 0 }}>
          <Link href={`/${slug}/utilities`}>Utilities in {ns.name}</Link> {" | "}
          <Link href={`/${slug}/plans`}>Plans in {ns.name}</Link> {" | "}
          <Link href={`/${slug}/history`}>History in {ns.name}</Link> {" | "}
          <Link href={`/offers/${slug}`}>Offers in {ns.name}</Link> {" | "}
          <Link href={`/electricity-providers/${slug}`}>Provider context in {ns.name}</Link> {" | "}
          <Link href={`/electricity-shopping/by-state`}>Electricity shopping pathways</Link> {" | "}
          <Link href="/compare">Compare all states</Link> {" | "}
          <Link href="/energy-comparison/states">State comparison hub</Link> {" | "}
          <Link href="/electricity-cost-calculator">National calculator</Link> {" | "}
          <Link href="/affordability">Affordability index</Link>
        </p>
        <p className="muted" style={{ marginTop: 6 }}>
          Learn more:{" "}
          <Link href="/guides/why-electricity-prices-vary-by-state">
            Why electricity prices vary by state
          </Link>
          .
        </p>
        <p className="muted" style={{ marginTop: 6 }}>
          <Link href={`/questions/average-electric-bill-in-${slug}`}>
            Common questions about electricity in {ns.name}
          </Link>
          .
        </p>
        <p className="muted" style={{ marginTop: 6 }}>
          <Link href={`/${slug}/plan-types`}>Explore plan types in {ns.name}</Link>.
        </p>
        <p className="muted" style={{ marginTop: 6 }}>
          Common usage scenarios:{" "}
          <Link href={`/${slug}/bill/1000`}>1000 kWh bill</Link>
          {" | "}
          <Link href={`/${slug}/bill/1500`}>1500 kWh bill</Link>
        </p>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>Major utilities in {ns.name}</h2>
        {majorUtilities.length > 0 ? (
          <ul style={{ marginTop: 0, paddingLeft: 20 }}>
            {majorUtilities.map((utility) => (
              <li key={utility.slug} style={{ marginBottom: 6 }}>
                <Link href={`/${slug}/utility/${utility.slug}`}>{utility.name}</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted" style={{ marginTop: 0 }}>
            Utility-specific pages are coming soon for {ns.name}.
          </p>
        )}
      </section>

      <h2 style={{ fontSize: 24, marginTop: 24, marginBottom: 8 }}>
        Average electricity price in {ns.name}
      </h2>
      <p style={{ marginTop: 0 }}>
        {ns.name}'s average residential electricity rate is{" "}
        <b>{ns.avgRateCentsPerKwh}¢/kWh</b> (updated {ns.updated}) based on {ns.source.name}.
      </p>
      <p>
        The estimator is energy-only and excludes delivery fees, taxes, fixed
        charges, and other utility fees.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 24, marginBottom: 8 }}>Electricity Affordability Index</h2>
        <p style={{ marginTop: 0 }}>
          Score: <b>{ns.affordabilityIndex}</b> / 100
        </p>
        <p style={{ marginTop: 6 }}>
          Category: <b>{ns.affordabilityCategory}</b>
        </p>
        <p className="muted" style={{ marginTop: 6 }}>
          Higher score means lower electricity price relative to other states.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 24, marginBottom: 8 }}>Electricity Value Score™</h2>
        <p style={{ marginTop: 0 }}>
          Score: <b>{ns.valueScore}</b> / 100
        </p>
        <p style={{ marginTop: 6 }}>
          Tier: <b>{ns.valueTier}</b>
        </p>
        <p className="muted" style={{ marginTop: 6 }}>
          Composite score based on price, affordability, and data freshness.
        </p>
        <p className="muted" style={{ marginTop: 6 }}>
          <Link href="/value-ranking">View full value ranking</Link>
        </p>
      </section>

      {epi && (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>
            Electricity Price Index™
          </h2>
          <p style={{ marginTop: 0 }}>
            Index: <b>{epi.indexValue}</b> (Base = 100 national average)
          </p>
          <p style={{ marginTop: 6 }}>
            Position: <b>{epi.relativePosition}</b>
          </p>
          <p className="muted" style={{ marginTop: 6 }}>
            An index above 100 indicates higher-than-average electricity prices.
          </p>
          <p className="muted" style={{ marginTop: 6 }}>
            <Link href="/index-ranking">
              View full Electricity Price Index™ ranking
            </Link>
          </p>
        </section>
      )}

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 24, marginBottom: 8 }}>State snapshot</h2>
        <ul style={{ marginTop: 0, paddingLeft: 20 }}>
          <li>Rate tier: {ns.rateTierLabel}</li>
          <li>
            Example monthly energy cost at 500 kWh: $
            {billByKwh[500].toFixed(2)}
          </li>
          <li>
            Example monthly energy cost at 1000 kWh: $
            {billByKwh[1000].toFixed(2)}
          </li>
          <li>
            Example monthly energy cost at 1500 kWh: $
            {billByKwh[1500].toFixed(2)}
          </li>
        </ul>
        <p style={{ marginTop: 8 }}>
          <b>What this means:</b> {ns.shortSummary}
        </p>
      </section>

      <hr style={{ margin: "24px 0" }} />

      <BillEstimator rateCentsPerKwh={ns.avgRateCentsPerKwh} stateSlug={slug} />

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>Browse nearby states</h2>
        <p style={{ marginTop: 0 }}>
          {prev ? (
            <Link href={`/${prev.slug}`}>{"←"} Previous: {prev.name}</Link>
          ) : (
            <span className="muted">{"←"} Previous: None</span>
          )}
          {" | "}
          {next ? (
            <Link href={`/${next.slug}`}>Next: {next.name} {"→"}</Link>
          ) : (
            <span className="muted">Next: None {"→"}</span>
          )}
        </p>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>Similar-priced states</h2>
        <ul style={{ marginTop: 0, paddingLeft: 20 }}>
          {relatedStates.map((related) => (
            <li key={related.slug} style={{ marginBottom: 6 }}>
              <Link href={`/${related.slug}`}>{related.name}</Link> {"—"}{" "}
              {related.avgRateCentsPerKwh.toFixed(2)}¢/kWh
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>Region</h2>
        {region ? (
          <>
            <p style={{ marginTop: 0 }}>
              <Link href={`/region/${region.slug}`}>{region.name}</Link>
            </p>
            <h3 style={{ marginTop: 8, marginBottom: 8 }}>
              Other states in this region
            </h3>
            <ul style={{ marginTop: 0, paddingLeft: 20 }}>
              {otherStatesInRegion.map((state) => (
                <li key={state.slug} style={{ marginBottom: 6 }}>
                  <Link href={`/${state.slug}`}>{state.name}</Link> {"—"}{" "}
                  {state.rate.toFixed(2)}¢/kWh
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="muted" style={{ marginTop: 0 }}>
            Region information coming soon.
          </p>
        )}
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>Major cities in {ns.name}</h2>
        {majorCities.length > 0 ? (
          <ul style={{ marginTop: 0, paddingLeft: 20 }}>
            {majorCities.map((city) => (
              <li key={city.slug} style={{ marginBottom: 6 }}>
                <Link href={`/electricity-cost/${slug}/${city.slug}`}>{city.name}</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted" style={{ marginTop: 0 }}>
            City pages for {ns.name} are coming soon.
          </p>
        )}
      </section>

      <PriceDriversPanel slug={slug} stateName={ns.name} />

      <RegulatorySignals slug={slug} stateName={ns.name} />

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Explore related electricity clusters</h2>
        <ul style={{ marginTop: 0, paddingLeft: 20, lineHeight: 1.9 }}>
          <li>
            <Link href={`/electricity-cost/${slug}`}>{ns.name} electricity cost authority page</Link>
          </li>
          <li>
            <Link href={`/electricity-bill-estimator/${slug}`}>{ns.name} electricity bill estimator</Link>
          </li>
          <li>
            <Link href={`/cost-to-run/refrigerator/${slug}`}>Appliance operating cost pages in {ns.name}</Link>
          </li>
          <li>
            <Link href={`/electricity-providers/${slug}`}>Provider marketplace discovery for {ns.name}</Link>
          </li>
          <li>
            <Link href="/energy-comparison">Energy Comparison Hub</Link>
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>FAQ</h2>
        {schema.faqItems.map((item, i) => (
          <div key={i} style={i > 0 ? { marginTop: 16 } : undefined}>
            <p>
              <b>{item.question}</b>
            </p>
            <p style={{ marginTop: 6 }}>{item.answer}</p>
          </div>
        ))}
      </section>

      <CommercialPlacement
        pageFamily="state-electricity-pages"
        context={{
          pageType: "state-authority",
          state: slug,
          stateName: ns.name,
        }}
      />

      <RelatedLinks links={getRelatedLinks({ kind: "state", state: slug })} />
    </main>
  );
}
