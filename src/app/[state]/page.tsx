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
import { SITE_URL } from "@/lib/site";
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
export const dynamicParams = true;
export const revalidate = 2592000;

type StateParams = Promise<{ state: string }>;

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

  const momLabel =
    momDeltaCents !== null && momDeltaPct !== null
      ? `${momDeltaCents >= 0 ? "+" : ""}${momDeltaCents.toFixed(2)}¢ (${momDeltaPct >= 0 ? "+" : ""}${momDeltaPct.toFixed(2)}%)`
      : null;

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

      {/* Breadcrumb */}
      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/">Home</Link> {"→"} <Link href="/compare">Compare</Link>{" "}
        {"→"} <span>{ns.name}</span>
      </p>

      {/* Heading + personalization */}
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
        <h1 style={{ margin: 0 }}>{ns.name} Electricity Rates</h1>
        <SetPreferredStateButton stateSlug={slug} />
      </div>

      {/* ── ANSWER BLOCK ── */}
      <div className="stat-panel" style={{ marginTop: 16, marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-card-value">{ns.avgRateCentsPerKwh}¢</div>
          <div className="stat-card-label">per kWh (avg residential)</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">${billByKwh[1000].toFixed(0)}</div>
          <div className="stat-card-label">est. monthly bill at 1,000 kWh</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{ns.rateTierLabel}</div>
          <div className="stat-card-label">rate tier</div>
        </div>
        {momLabel && (
          <div className="stat-card">
            <div className="stat-card-value">{momLabel}</div>
            <div className="stat-card-label">month-over-month change</div>
          </div>
        )}
      </div>

      {/* Source / freshness line */}
      <p className="muted" style={{ marginTop: 0, marginBottom: 16, fontSize: 13, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span
          aria-hidden
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: freshnessDotColor,
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        Updated {ns.updated} · Source:{" "}
        {ns.source.slug ? (
          <Link href={`/sources/${ns.source.slug}`}>{ns.source.name}</Link>
        ) : (
          <TrackedOutboundLink
            href={ns.source.url}
            eventName="SourceLinkClick"
            props={{ state: slug }}
          >
            {ns.source.name}
          </TrackedOutboundLink>
        )}
        {" · "}
        <Link href="/methodology">Methodology</Link>
      </p>

      {/* Context paragraph */}
      <p style={{ marginTop: 0, marginBottom: 20, maxWidth: "65ch", lineHeight: 1.6 }}>
        {ns.shortSummary}
      </p>

      {/* ── NEXT STEPS ── */}
      <section className="section-gap">
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>What would you like to do?</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <div className="stat-card" style={{ textAlign: "left" }}>
            <p style={{ margin: "0 0 8px", fontWeight: 600, fontSize: 15 }}>Compare costs</p>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8, fontSize: 14 }}>
              <li><Link href="/compare">Compare all states</Link></li>
              <li><Link href={`/electricity-bill-estimator/${slug}`}>Estimate your {ns.name} bill</Link></li>
              <li><Link href="/affordability">Affordability rankings</Link></li>
            </ul>
          </div>
          <div className="stat-card" style={{ textAlign: "left" }}>
            <p style={{ margin: "0 0 8px", fontWeight: 600, fontSize: 15 }}>Shop for providers</p>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8, fontSize: 14 }}>
              <li><Link href={`/electricity-providers/${slug}`}>Providers in {ns.name}</Link></li>
              <li><Link href={`/offers/${slug}`}>Current offers</Link></li>
              <li><Link href={`/${slug}/plans`}>Plan types</Link></li>
            </ul>
          </div>
          <div className="stat-card" style={{ textAlign: "left" }}>
            <p style={{ margin: "0 0 8px", fontWeight: 600, fontSize: 15 }}>Explore data</p>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8, fontSize: 14 }}>
              <li><Link href={`/electricity-cost/${slug}`}>{ns.name} cost details</Link></li>
              <li><Link href={`/${slug}/history`}>Price history</Link></li>
              <li><Link href={`/drivers/${slug}`}>Price drivers</Link></li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── BILL ESTIMATOR ── */}
      <BillEstimator rateCentsPerKwh={ns.avgRateCentsPerKwh} stateSlug={slug} />

      {/* ── UTILITIES ── */}
      {majorUtilities.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>Major utilities in {ns.name}</h2>
          <ul style={{ marginTop: 0, paddingLeft: 20 }}>
            {majorUtilities.map((utility) => (
              <li key={utility.slug} style={{ marginBottom: 6 }}>
                <Link href={`/${slug}/utility/${utility.slug}`}>{utility.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── SCORES & INDEXES ── */}
      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Scores &amp; rankings</h2>
        <div className="stat-panel">
          <div className="stat-card">
            <div className="stat-card-value">{ns.affordabilityIndex}</div>
            <div className="stat-card-label">Affordability ({ns.affordabilityCategory})</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value">{ns.valueScore}</div>
            <div className="stat-card-label">Value Score™ ({ns.valueTier})</div>
          </div>
          {epi && (
            <div className="stat-card">
              <div className="stat-card-value">{epi.indexValue}</div>
              <div className="stat-card-label">Price Index™ ({epi.relativePosition})</div>
            </div>
          )}
        </div>
        <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
          <Link href="/value-ranking">Value ranking</Link>
          {epi && <>{" · "}<Link href="/index-ranking">Price Index ranking</Link></>}
          {" · "}<Link href="/affordability">Affordability index</Link>
        </p>
      </section>

      {/* ── NEARBY & SIMILAR ── */}
      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Browse nearby states</h2>
        <p style={{ marginTop: 0 }}>
          {prev ? (
            <Link href={`/${prev.slug}`}>{"←"} {prev.name}</Link>
          ) : (
            <span className="muted">{"←"} None</span>
          )}
          {" | "}
          {next ? (
            <Link href={`/${next.slug}`}>{next.name} {"→"}</Link>
          ) : (
            <span className="muted">None {"→"}</span>
          )}
        </p>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Similar-priced states</h2>
        <ul style={{ marginTop: 0, paddingLeft: 20 }}>
          {relatedStates.map((related) => (
            <li key={related.slug} style={{ marginBottom: 6 }}>
              <Link href={`/${related.slug}`}>{related.name}</Link> {"—"}{" "}
              {related.avgRateCentsPerKwh.toFixed(2)}¢/kWh
            </li>
          ))}
        </ul>
      </section>

      {region && (
        <section style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>{region.name} region</h2>
          <ul style={{ marginTop: 0, paddingLeft: 20 }}>
            {otherStatesInRegion.map((s) => (
              <li key={s.slug} style={{ marginBottom: 6 }}>
                <Link href={`/${s.slug}`}>{s.name}</Link> {"—"}{" "}
                {s.rate.toFixed(2)}¢/kWh
              </li>
            ))}
          </ul>
        </section>
      )}

      {majorCities.length > 0 && (
        <section style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>Cities in {ns.name}</h2>
          <ul style={{ marginTop: 0, paddingLeft: 20 }}>
            {majorCities.map((city) => (
              <li key={city.slug} style={{ marginBottom: 6 }}>
                <Link href={`/electricity-cost/${slug}/${city.slug}`}>{city.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <PriceDriversPanel slug={slug} stateName={ns.name} />

      <RegulatorySignals slug={slug} stateName={ns.name} />

      {/* ── FAQ ── */}
      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>FAQ</h2>
        {schema.faqItems.map((item, i) => (
          <div key={i} style={i > 0 ? { marginTop: 16 } : undefined}>
            <p><b>{item.question}</b></p>
            <p style={{ marginTop: 6 }}>{item.answer}</p>
          </div>
        ))}
      </section>

      {/* ── EXPLORE MORE ── */}
      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>More about electricity in {ns.name}</h2>
        <ul style={{ marginTop: 0, paddingLeft: 20, lineHeight: 1.9 }}>
          <li><Link href={`/electricity-cost/${slug}`}>{ns.name} electricity cost details</Link></li>
          <li><Link href={`/electricity-bill-estimator/${slug}`}>{ns.name} bill estimator</Link></li>
          <li><Link href={`/cost-to-run/refrigerator/${slug}`}>Appliance running costs in {ns.name}</Link></li>
          <li><Link href={`/electricity-providers/${slug}`}>Electricity providers in {ns.name}</Link></li>
          <li><Link href="/energy-comparison">Energy comparison hub</Link></li>
        </ul>
        <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
          <Link href="/guides/why-electricity-prices-vary-by-state">Why prices vary by state</Link>
          {" · "}
          <Link href={`/questions/average-electric-bill-in-${slug}`}>Common questions</Link>
          {" · "}
          <Link href={`/${slug}/bill/1000`}>1,000 kWh bill</Link>
          {" · "}
          <Link href={`/${slug}/bill/1500`}>1,500 kWh bill</Link>
        </p>
      </section>

      {/* ── METHODOLOGY / DISCLOSURE ── */}
      <section style={{ marginTop: 28, paddingTop: 16, borderTop: "1px solid var(--color-border)" }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Methodology &amp; data</h2>
        <p className="muted" style={{ marginTop: 0, fontSize: 13, lineHeight: 1.6, maxWidth: "65ch" }}>
          {ns.methodology}
        </p>
        <p className="muted" style={{ marginTop: 6, fontSize: 13 }}>
          {ns.disclaimer}
        </p>
        <p className="muted" style={{ marginTop: 6, fontSize: 13 }}>
          <Link href="/methodology">Full methodology</Link>
          {" · "}
          <Link href="/data-policy">Data policy</Link>
          {ns.source.slug && (
            <>
              {" · "}
              <TrackedOutboundLink
                href={ns.source.url}
                eventName="SourceLinkClick"
                props={{ state: slug }}
              >
                Source data
              </TrackedOutboundLink>
            </>
          )}
        </p>
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
