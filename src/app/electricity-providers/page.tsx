import type { Metadata } from "next";
import Link from "next/link";
import { loadEntityIndex } from "@/lib/knowledge/loadKnowledgePage";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildItemListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import CommercialPlacement from "@/components/monetization/CommercialPlacement";
import ProviderComparisonTable from "@/components/providers/ProviderComparisonTable";
import ProviderHighlightSection from "@/components/providers/ProviderHighlightSection";
import { buildProviderComparisonRows, resolveProvidersForContext } from "@/lib/providers/resolve";
import {
  buildProviderDiscoveryItemListEntries,
  buildProviderOfferItemListEntries,
  getProviderDiscoveryStatesFromCatalog,
} from "@/lib/providers/providerDiscovery";
import { getEnabledProviderCatalogEntries } from "@/lib/providers/providerCatalog";
import { PROVIDER_ONBOARDING_PILOT } from "@/lib/providers/providerPilot";
import { buildCommercialPathwayItemListJsonLd } from "@/lib/seo/jsonld";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Electricity Providers by State | PriceOfElectricity.com",
  description:
    "State-level electricity provider context and market structure. Learn how provider choice and utility structure vary by state.",
  canonicalPath: "/electricity-providers",
});

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ElectricityProvidersIndexPage() {
  const entityIndex = await loadEntityIndex();
  const stateEntities =
    entityIndex?.entities
      ?.filter((e) => e.type === "state")
      .sort((a, b) => a.slug.localeCompare(b.slug)) ?? [];
  const featuredProviders = resolveProvidersForContext({
    pageType: "provider-directory-index",
  }, 6);
  const comparisonRows = buildProviderComparisonRows(featuredProviders);
  const enabledCatalogEntries = getEnabledProviderCatalogEntries();
  const discoveryStates = getProviderDiscoveryStatesFromCatalog();

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Providers", url: "/electricity-providers" },
  ]);
  const webPageJsonLd = buildWebPageJsonLd({
    title: "Electricity Providers by State",
    description:
      "State-level provider marketplace context and market-structure discovery connected to canonical cost and comparison clusters.",
    url: "/electricity-providers",
    isPartOf: "/",
    about: ["electricity providers by state", "provider marketplace discovery", "electricity market structure"],
  });
  const providerItemListJsonLd = buildItemListJsonLd(
    "Provider marketplace discovery states",
    buildProviderDiscoveryItemListEntries(discoveryStates.length > 0
      ? discoveryStates
      : stateEntities.map((state) => ({ slug: state.slug, name: state.title ?? slugToDisplayName(state.slug) })), 8),
  );
  const providerOfferItemListJsonLd = buildItemListJsonLd(
    "Configured provider onboarding registry",
    buildProviderOfferItemListEntries(
      enabledCatalogEntries.map((entry) => ({
        providerName: entry.providerName,
        signupUrl: entry.signupUrl,
        offerDescription: entry.offerDescription,
      })),
      8,
    ),
  );
  const commercialPathwaysItemListJsonLd = buildCommercialPathwayItemListJsonLd(
    "Commercial marketplace pathways",
    [
      { name: "Provider marketplace index", url: "/electricity-providers", pathwayType: "provider-marketplace" },
      { name: "Offers and savings hub", url: "/offers", pathwayType: "offers" },
      { name: "Compare electricity plans by state", url: "/compare-electricity-plans/by-state", pathwayType: "comparison-cluster" },
      { name: "Energy comparison discovery hub", url: "/energy-comparison", pathwayType: "comparison-cluster" },
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
          <Link href="/data">Data Hub</Link>
          {" · "}
          <span aria-current="page">Electricity Providers</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Electricity Providers by State</h1>

        {/* INTRO */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity provider choice and market structure vary by state. Some states offer broader retail choice
            where customers can choose among competing electricity providers; others rely more on regulated utility
            structures. This section provides state-level context for understanding electricity providers and market
            structure without listing specific providers or plans.
          </p>
        </section>

        {/* WHAT THIS SECTION COVERS */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>What This Section Covers</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            This site provides educational context—provider structure, market rules, and state electricity price context.
            We do not list live plans, rates, or provider offers.
          </p>
        </section>

        <ProviderHighlightSection
          title="Featured provider integrations"
          intro="The marketplace/provider layer supports plan comparison services, state-level listings, sponsored placements, and adjacent energy services. Featured records appear here when provider integrations are enabled."
          providers={featuredProviders}
          emptyMessage="No provider integrations are enabled yet. The structured provider dataset and display framework are in place for future marketplace rollouts."
        />

        <ProviderComparisonTable
          title="Provider comparison framework"
          rows={comparisonRows}
        />

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Provider comparison clarity</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "70ch", lineHeight: 1.6 }}>
            Provider comparisons are informational and scenario-based. They summarize configured provider context,
            coverage, and placement eligibility rather than quoting live utility tariffs or binding plan offers.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Coverage context is state-scoped and rollout-governed.</li>
            <li>Plan type notes are comparative guidance, not transactional quoting.</li>
            <li>Ranking is deterministic and policy-constrained for consistency.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Provider differentiation signals</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "70ch", lineHeight: 1.6 }}>
            Differentiation is represented by stable informational attributes to support research-ready comparison.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            {enabledCatalogEntries.slice(0, 6).map((entry) => (
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
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Provider onboarding registry coverage</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "70ch", lineHeight: 1.6 }}>
            The onboarding registry is deterministic and supports multi-provider state expansion. Entries stay
            rollout-controlled even when configured in the catalog.
          </p>
          <p className="muted" style={{ marginTop: 0, marginBottom: 8, fontSize: 14 }}>
            Enabled provider registry entries: {enabledCatalogEntries.length}
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            {enabledCatalogEntries.slice(0, 8).map((entry) => (
              <li key={entry.providerId}>
                {entry.providerName} ({entry.offerType})
              </li>
            ))}
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Marketplace discovery pathways</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/electricity-cost">Electricity cost authority cluster</Link></li>
            <li><Link href="/energy-comparison">Energy comparison hub</Link></li>
            <li><Link href="/electricity-hubs">Electricity hubs discovery index</Link></li>
            <li><Link href="/electricity-cost-comparison">State comparison authority cluster</Link></li>
          </ul>
          <p className="muted" style={{ marginTop: 12, marginBottom: 0, fontSize: 13 }}>
            Active provider rollout states in pilot scope: {PROVIDER_ONBOARDING_PILOT.stateScopedFamilies["state-electricity-pages"]?.length ?? 0}
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Commercial pathway visibility</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "70ch", lineHeight: 1.6 }}>
            These pathways connect informational provider research to non-transactional next-step discovery surfaces.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/offers">Offers and savings hub</Link></li>
            <li><Link href="/compare-electricity-plans/by-state">Compare electricity plans by state</Link></li>
            <li><Link href="/electricity-shopping/by-state">Electricity shopping by state</Link></li>
            <li><Link href="/energy-comparison">Energy comparison discovery hub</Link></li>
          </ul>
        </section>

        <CommercialPlacement
          pageFamily="provider-marketplace-pages"
          context={{
            pageType: "hub-index",
          }}
        />

        {/* WHY PROVIDER STRUCTURE MATTERS */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why Provider Structure Matters</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Provider structure can affect:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><strong>How customers shop for electricity</strong> — In deregulated or choice markets, customers may compare providers directly.</li>
            <li><strong>Whether rates are regulated or competitive</strong> — Regulated markets typically have a single utility serving an area; competitive markets may have multiple retail options.</li>
            <li><strong>How electricity costs are understood</strong> — Average rates and estimated bills vary by state and can help inform how much households typically pay.</li>
          </ul>
        </section>

        {/* EXPLORE BY STATE */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Explore by State</h2>
          <p style={{ margin: "0 0 16px 0", maxWidth: "65ch", fontSize: 14 }}>
            Select a state to see electricity provider context and market structure. Each page includes
            state electricity cost context and what users should check when comparing providers.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 8,
            }}
          >
            {stateEntities.map((e) => (
              <Link
                key={e.slug}
                href={`/electricity-providers/${e.slug}`}
                style={{
                  display: "block",
                  padding: 10,
                  border: "1px solid var(--color-border, #e5e7eb)",
                  borderRadius: 6,
                  backgroundColor: "var(--color-surface-alt, #f9fafb)",
                  textDecoration: "none",
                  color: "inherit",
                  fontSize: 14,
                }}
              >
                {e.title ?? slugToDisplayName(e.slug)}
              </Link>
            ))}
          </div>
        </section>

        {/* RELATED PAGES */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/business-electricity-options">Business electricity options by state</Link></li>
            <li><Link href="/shop-electricity">Shop for electricity by state</Link></li>
            <li><Link href="/electricity-shopping">Electricity shopping by state</Link></li>
            <li><Link href="/compare-electricity-plans">Compare electricity plans</Link></li>
            <li><Link href="/electricity-cost">Electricity cost by state</Link></li>
            <li><Link href="/electricity-affordability">Electricity affordability</Link></li>
            <li><Link href="/electricity-cost-comparison">Electricity cost comparison</Link></li>
            <li><Link href="/electricity-markets">Electricity market structures</Link></li>
            <li><Link href="/regional-electricity-markets">Regional electricity markets</Link></li>
            <li><Link href="/electricity-data">Electricity data</Link></li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
