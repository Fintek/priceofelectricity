import type { Metadata } from "next";
import Link from "next/link";
import { loadEntityIndex } from "@/lib/knowledge/loadKnowledgePage";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Business Electricity Options by State | PriceOfElectricity.com",
  description:
    "State-by-state business electricity context: price environment, market structure, and what to evaluate. Educational context, not live quotes or procurement.",
  canonicalPath: "/business-electricity-options",
});

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function BusinessElectricityOptionsHubPage() {
  const [entityIndex, release] = await Promise.all([
    loadEntityIndex(),
    getRelease(),
  ]);

  const stateEntities =
    entityIndex?.entities
      ?.filter((e) => e.type === "state")
      .sort((a, b) => a.slug.localeCompare(b.slug)) ?? [];

  const featuredSlugs = ["texas", "california", "ohio", "new-york", "florida"];
  const featuredStates = featuredSlugs
    .map((slug) => stateEntities.find((e) => e.slug === slug))
    .filter(Boolean);

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Business Electricity Options by State", url: "/business-electricity-options" },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/business-electricity-cost-decisions">Business Electricity Cost Decisions</Link>
          {" · "}
          <span aria-current="page">Business Electricity Options by State</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Business Electricity Options by State</h1>

        {/* INTRO */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Business electricity decisions can vary by state depending on electricity prices, market structure, and the
            kind of business load involved. Some states have more active retail choice for commercial customers; others
            rely on regulated utilities. Understanding your state&apos;s price environment and market structure helps
            organizations know what to expect when evaluating electricity options.
          </p>
        </section>

        {/* WHAT THIS SECTION COVERS */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>What This Section Covers</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            This site provides educational context for evaluating business electricity options, not live quotes or supplier
            enrollment. We explain what organizations should consider when thinking about electricity in their state—price
            context, market structure, provider rules, and budgeting implications. We do not offer procurement, RFPs,
            or live tariff comparisons.
          </p>
        </section>

        {/* WHY STATE CONTEXT MATTERS */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why State Context Matters</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><strong>Different state electricity price environments</strong> — Average rates and cost levels vary widely across states.</li>
            <li><strong>Different market and provider structures</strong> — Some states offer retail choice for commercial customers; others use regulated utility structures.</li>
            <li><strong>Different budgeting implications</strong> — Higher electricity prices increase operating costs; lower prices reduce them.</li>
            <li><strong>Raw price context vs actual commercial billing</strong> — Statewide average residential rates illustrate regional differences but do not equal commercial tariffs, which may include demand charges, service classes, and contract terms.</li>
          </ul>
        </section>

        {/* EXPLORE BY STATE */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Explore by State</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Select a state to see business electricity context for that state:
          </p>
          {featuredStates.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 12,
                marginBottom: 16,
              }}
            >
              {featuredStates.map((e) => (
                <Link
                  key={e!.slug}
                  href={`/business-electricity-options/${e!.slug}`}
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
                  <strong>Business electricity options in {e!.slug === "new-york" ? "New York" : slugToDisplayName(e!.slug)}</strong>
                </Link>
              ))}
            </div>
          )}
          {stateEntities.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 8,
                marginTop: 16,
              }}
            >
              {stateEntities.map((e) => (
                <Link
                  key={e.slug}
                  href={`/business-electricity-options/${e.slug}`}
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
          )}
        </section>

        {/* RELATED PAGES */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/data-center-electricity-cost">Data center electricity cost</Link></li>
            <li><Link href="/business-electricity-cost-decisions">Business electricity cost decisions</Link></li>
            <li><Link href="/electricity-shopping">Electricity shopping by state</Link></li>
            <li><Link href="/electricity-providers">Electricity providers by state</Link></li>
            <li><Link href="/electricity-markets">Electricity market structures</Link></li>
            <li><Link href="/electricity-data">Electricity data</Link></li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={release} />
      </main>
    </>
  );
}
