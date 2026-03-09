import type { Metadata } from "next";
import Link from "next/link";
import { loadEntityIndex } from "@/lib/knowledge/loadKnowledgePage";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import ExploreMore from "@/components/navigation/ExploreMore";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Electricity Cost by State – Rates & Bill Estimates | PriceOfElectricity.com",
  description:
    "Explore electricity cost by state. Compare average residential rates (¢/kWh), estimated monthly bills at 900 kWh, and see how your state compares to the national average.",
  canonicalPath: "/electricity-cost",
});

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ElectricityCostIndexPage() {
  const entityIndex = await loadEntityIndex();
  const stateEntities =
    entityIndex?.entities
      ?.filter((e) => e.type === "state")
      .sort((a, b) => a.slug.localeCompare(b.slug)) ?? [];

  const featuredSlugs = ["texas", "california", "florida", "new-york", "ohio"];
  const featuredStates = featuredSlugs
    .map((slug) => stateEntities.find((e) => e.slug === slug))
    .filter(Boolean);

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Cost", url: "/electricity-cost" },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/data">Data Hub</Link>
          {" · "}
          <span aria-current="page">Electricity Cost</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Electricity Cost by State</h1>
        <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
          Electricity cost by state. Compare average electricity price per kWh and estimated monthly bills across all U.S. states. Select a state to see prices, cost estimates, and comparison to the national average. See <Link href="/compare-electricity-plans">how to compare electricity plans</Link> for plan-comparison context.
        </p>
        <p className="muted" style={{ margin: "0 0 32px 0", maxWidth: "65ch", fontSize: 14 }}>
          Cost estimates use a standard 900 kWh monthly usage (10,800 kWh annually). Rates come from EIA data.
          All figures are build-generated and deterministic.
        </p>

        {/* Featured states */}
        {featuredStates.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Featured States</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: 12,
              }}
            >
              {featuredStates.map((e) => (
                <Link
                  key={e!.slug}
                  href={`/electricity-cost/${e!.slug}`}
                  style={{
                    display: "block",
                    padding: 16,
                    border: "1px solid var(--color-border, #e5e7eb)",
                    borderRadius: 8,
                    backgroundColor: "var(--color-surface-alt, #f9fafb)",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <strong>{e!.title ?? slugToDisplayName(e!.slug)}</strong>
                  <span className="muted" style={{ display: "block", fontSize: 13, marginTop: 4 }}>
                    Electricity cost →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Browse all states */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Browse by State</h2>
          <p className="muted" style={{ margin: "0 0 16px 0", fontSize: 14 }}>
            Select a state to see average electricity price per kWh, estimated monthly and annual costs, and comparison to the national average.
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
                href={`/electricity-cost/${e.slug}`}
                style={{
                  padding: "8px 12px",
                  border: "1px solid var(--color-border, #e5e7eb)",
                  borderRadius: 6,
                  fontSize: 14,
                  textDecoration: "none",
                  color: "inherit",
                  backgroundColor: "var(--color-surface-alt, #f9fafb)",
                }}
              >
                {e.title ?? slugToDisplayName(e.slug)}
              </Link>
            ))}
          </div>
        </section>

        <p className="muted" style={{ marginBottom: 24, fontSize: 14 }}>
          Related topics: <Link href="/shop-electricity">Shop for electricity by state</Link>
          {" · "}
          <Link href="/solar-savings">See how electricity prices affect solar savings</Link>
          {" · "}
          <Link href="/electricity-providers">Explore electricity providers by state</Link>
          {" · "}
          <Link href="/how-much-does-500-kwh-cost">How much does 500 kWh cost?</Link>
          {" · "}
          <Link href="/electricity-cost-comparison">Compare electricity prices between states</Link>
          {" · "}
          <Link href="/why-electricity-prices-rise">Why electricity prices change</Link>
          {" · "}
          <Link href="/electricity-inflation">Electricity inflation</Link>
          {" · "}
          <Link href="/electricity-price-volatility">Electricity price volatility</Link>
          {" · "}
          <Link href="/electricity-topics">Electricity topics hub</Link>
          {" · "}
          <Link href="/electricity-data">Electricity data</Link>
        </p>

        <ExploreMore
          title="Related pages"
          links={[
            { href: "/data-center-electricity-cost", label: "Explore data center electricity costs by state" },
            { href: "/solar-vs-grid-electricity-cost", label: "Explore solar vs grid electricity economics" },
            { href: "/battery-backup-electricity-cost", label: "Explore battery recharge electricity costs" },
            { href: "/electricity-price-volatility", label: "Explore electricity price volatility" },
            { href: "/electricity-cost-comparison", label: "Compare electricity prices between states" },
            { href: "/knowledge", label: "Knowledge Hub" },
            { href: "/electricity-trends", label: "Electricity trends" },
            { href: "/knowledge/rankings/rate-high-to-low", label: "Highest rates" },
            { href: "/datasets", label: "Download datasets" },
            { href: "/methodology", label: "Methodology" },
          ]}
        />

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
