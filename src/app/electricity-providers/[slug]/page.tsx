import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadKnowledgePage } from "@/lib/knowledge/loadKnowledgePage";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildItemListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import CommercialPlacement from "@/components/monetization/CommercialPlacement";
import { getRelease } from "@/lib/knowledge/fetch";
import ProviderComparisonTable from "@/components/providers/ProviderComparisonTable";
import StateProviderList from "@/components/providers/StateProviderList";
import { buildProviderComparisonRows, resolveProvidersForContext } from "@/lib/providers/resolve";
import {
  buildProviderDiscoveryItemListEntries,
  buildProviderOfferItemListEntries,
} from "@/lib/providers/providerDiscovery";
import { getEnabledProviderCatalogEntriesForState } from "@/lib/providers/providerCatalog";
import { buildCommercialPathwayItemListJsonLd } from "@/lib/seo/jsonld";

const MONTHLY_USAGE_KWH = 900;

export const dynamicParams = true;
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const statePage = await loadKnowledgePage("state", slug);
  if (!statePage) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/electricity-providers/${slug}`,
    });
  }
  const raw = statePage.data?.raw as { name?: string; avgRateCentsPerKwh?: number } | undefined;
  const stateName = raw?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const description =
    `State-level electricity provider context for ${stateName}. Learn how electricity provider structure and market rules affect pricing and household electricity costs.`;
  return buildMetadata({
    title: `Electricity Providers in ${stateName} | PriceOfElectricity.com`,
    description,
    canonicalPath: `/electricity-providers/${slug}`,
  });
}

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ElectricityProvidersStatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [statePage] = await Promise.all([
    loadKnowledgePage("state", slug),
    loadKnowledgePage("national", "national"),
  ]);

  if (!statePage) notFound();

  const raw = statePage.data?.raw as { name?: string; avgRateCentsPerKwh?: number } | undefined;
  const stateName = raw?.name ?? slugToDisplayName(slug);
  const avgRate = typeof raw?.avgRateCentsPerKwh === "number" ? raw.avgRateCentsPerKwh : null;
  const providers = resolveProvidersForContext({
    pageType: "provider-directory-state",
    state: slug,
    serviceCategory: "state-provider-listing",
  }, 12);
  const catalogEntries = getEnabledProviderCatalogEntriesForState(slug);
  const comparisonRows = buildProviderComparisonRows(providers);

  const rateDollarsPerKwh = avgRate != null ? avgRate / 100 : 0;
  const estimatedMonthlyCost = rateDollarsPerKwh * MONTHLY_USAGE_KWH;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Providers", url: "/electricity-providers" },
    { name: stateName, url: `/electricity-providers/${slug}` },
  ]);
  const webPageJsonLd = buildWebPageJsonLd({
    title: `Electricity providers in ${stateName}`,
    description: `State-level provider marketplace context for ${stateName}, linked to canonical electricity cost, bill, and comparison clusters.`,
    url: `/electricity-providers/${slug}`,
    isPartOf: "/",
    about: [`electricity providers ${stateName}`, "state provider marketplace context"],
  });
  const providerItemListJsonLd = buildItemListJsonLd(
    `${stateName} provider discovery pathways`,
    [
      ...buildProviderDiscoveryItemListEntries([{ slug, name: stateName }], 1),
      { name: `${stateName} electricity cost authority`, url: `/electricity-cost/${slug}` },
      { name: `${stateName} average electricity bill`, url: `/average-electricity-bill/${slug}` },
      { name: `${stateName} electricity bill estimator`, url: `/electricity-bill-estimator/${slug}` },
    ],
  );
  const providerOfferItemListJsonLd = buildItemListJsonLd(
    `${stateName} configured provider onboarding entries`,
    buildProviderOfferItemListEntries(
      catalogEntries.map((entry) => ({
        providerName: entry.providerName,
        signupUrl: entry.signupUrl,
        offerDescription: entry.offerDescription,
      })),
      8,
    ),
  );
  const commercialPathwaysItemListJsonLd = buildCommercialPathwayItemListJsonLd(
    `${stateName} commercial provider pathways`,
    [
      { name: `${stateName} offers and savings`, url: `/offers/${slug}`, pathwayType: "offers" },
      { name: `${stateName} electricity plans`, url: `/${slug}/plans`, pathwayType: "state-cluster" },
      { name: `${stateName} electricity cost calculator`, url: `/electricity-cost-calculator/${slug}`, pathwayType: "estimator-cluster" },
      { name: `${stateName} provider marketplace context`, url: `/electricity-providers/${slug}`, pathwayType: "provider-marketplace" },
    ],
  );

  return (
    <>
      <JsonLdScript
        data={[
          breadcrumbJsonLd,
          webPageJsonLd,
          providerItemListJsonLd,
          providerOfferItemListJsonLd,
          commercialPathwaysItemListJsonLd,
        ]}
      />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/electricity-providers">Electricity Providers</Link>
          {" · "}
          <span aria-current="page">{stateName}</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>
          Electricity Providers in {stateName}
        </h1>

        {/* B) Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity provider structure differs by state. This page gives context for how to think about
            electricity providers in {stateName}—what customers should know about market structure, provider choice,
            and how electricity costs compare. We do not list specific providers or plans; this is informational
            context for users researching electricity choices.
          </p>
        </section>

        {/* C) State Electricity Cost Context */}
        {avgRate != null && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>State Electricity Cost Context</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: 16,
              }}
            >
              <div
                style={{
                  padding: 20,
                  border: "1px solid var(--color-border, #e5e7eb)",
                  borderRadius: 8,
                  backgroundColor: "var(--color-surface-alt, #f9fafb)",
                }}
              >
                <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Average residential rate</div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>{avgRate.toFixed(2)} ¢/kWh</div>
              </div>
              <div
                style={{
                  padding: 20,
                  border: "1px solid var(--color-border, #e5e7eb)",
                  borderRadius: 8,
                  backgroundColor: "var(--color-surface-alt, #f9fafb)",
                }}
              >
                <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Est. monthly (900 kWh)</div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>${estimatedMonthlyCost.toFixed(2)}</div>
              </div>
            </div>
            <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>
              Rates from EIA data. Estimates use 900 kWh monthly usage.
            </p>
          </section>
        )}

        {/* D) Provider / Market Context */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Provider and Market Context</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Across the U.S., electricity markets vary. Some states offer broader retail choice where customers
            can compare providers and plans; others rely more on regulated utility structures where a single
            utility serves an area. Customers may face different shopping experiences depending on state rules
            and market structure.
          </p>
          <p style={{ margin: 0, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Understanding how electricity costs compare nationally and in {stateName} can help inform what
            to expect when evaluating provider options. For state-specific market rules and retail choice
            availability, consult your state utility commission or public utility commission.
          </p>
        </section>

        {/* E) What Users Should Check */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>What Users Should Check</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            When researching electricity providers in {stateName}, consider:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Whether retail choice exists in your area</li>
            <li>Whether rates are fixed, variable, or regulated</li>
            <li>How average electricity cost in {stateName} compares to the national average</li>
            <li>How estimated bills and affordability compare with other states</li>
          </ul>
        </section>

        <StateProviderList stateName={stateName} providers={providers} />

        <ProviderComparisonTable
          title={`Provider comparison framework for ${stateName}`}
          rows={comparisonRows}
        />

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Provider comparison clarity in {stateName}</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "70ch", lineHeight: 1.6 }}>
            Comparison signals summarize configured provider context and market-fit assumptions for {stateName}. They
            are informational and do not represent live utility enrollment, guaranteed rates, or official tariff quotes.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Coverage and offer type context are deterministic and policy-scoped.</li>
            <li>Provider ranking remains stable through deterministic resolver logic.</li>
            <li>Commercial placements remain rollout-guarded and disclosure-first.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Provider differentiation signals in {stateName}</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            {catalogEntries.slice(0, 8).map((entry) => (
              <article
                key={`diff-${entry.providerId}`}
                style={{
                  padding: 14,
                  border: "1px solid var(--color-border, #e5e7eb)",
                  borderRadius: 8,
                  backgroundColor: "var(--color-surface-alt, #f9fafb)",
                }}
              >
                <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 16 }}>{entry.providerName}</h3>
                <p className="muted" style={{ marginTop: 0, marginBottom: 6, fontSize: 13 }}>
                  {entry.coverageAreaDescription}
                </p>
                <p className="muted" style={{ marginTop: 0, marginBottom: 8, fontSize: 13 }}>
                  {entry.planTypeSummary}
                </p>
                <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
                  {entry.featureHighlights.slice(0, 3).map((highlight) => (
                    <li key={`${entry.providerId}-${highlight}`}>{highlight}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Provider onboarding coverage in {stateName}</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "70ch", lineHeight: 1.6 }}>
            This deterministic onboarding view shows configured provider entries for {stateName}. Listing coverage does
            not override rollout guardrails for where commercial modules render.
          </p>
          <p className="muted" style={{ marginTop: 0, marginBottom: 8, fontSize: 14 }}>
            Enabled provider entries configured for this state: {catalogEntries.length}
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            {catalogEntries.slice(0, 10).map((entry) => (
              <li key={entry.providerId}>
                {entry.providerName} ({entry.offerType})
              </li>
            ))}
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Commercial pathway visibility in {stateName}</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "70ch", lineHeight: 1.6 }}>
            These supporting pathways keep provider context connected to state-level savings and plan research surfaces.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href={`/offers/${slug}`}>Offers in {stateName}</Link></li>
            <li><Link href={`/${slug}/plans`}>Plans in {stateName}</Link></li>
            <li><Link href={`/electricity-cost-calculator/${slug}`}>Electricity calculator in {stateName}</Link></li>
            <li><Link href="/energy-comparison">Energy comparison discovery hub</Link></li>
          </ul>
        </section>

        <CommercialPlacement
          pageFamily="provider-marketplace-pages"
          context={{
            pageType: "hub-index",
            state: slug,
            stateName,
          }}
        />

        {/* F) Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href={`/electricity-cost/${slug}`}>Electricity cost in {stateName}</Link></li>
            <li><Link href={`/average-electricity-bill/${slug}`}>Average electricity bill in {stateName}</Link></li>
            <li><Link href={`/electricity-affordability/${slug}`}>Electricity affordability in {stateName}</Link></li>
            <li><Link href="/electricity-cost-comparison">Compare electricity prices between states</Link></li>
            <li><Link href="/energy-comparison">Energy comparison discovery hub</Link></li>
            <li><Link href="/electricity-hubs">Electricity hubs discovery index</Link></li>
            <li><Link href="/electricity-markets">Explore electricity market structures</Link></li>
            <li><Link href="/regional-electricity-markets">Explore regional electricity markets</Link></li>
            <li><Link href="/electricity-providers">Electricity providers by state</Link></li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
