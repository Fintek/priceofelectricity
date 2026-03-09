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
  title: "Shop for Electricity by State | PriceOfElectricity.com",
  description:
    "State-by-state electricity shopping context: price, provider, and market structure. Educational context, not live shopping or enrollment.",
  canonicalPath: "/shop-electricity",
});

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ShopElectricityHubPage() {
  const [entityIndex, release] = await Promise.all([
    loadEntityIndex(),
    getRelease(),
  ]);

  const stateEntities =
    entityIndex?.entities
      ?.filter((e) => e.type === "state")
      .sort((a, b) => a.slug.localeCompare(b.slug)) ?? [];

  const featuredSlugs = ["texas", "california", "ohio", "new-york", "pennsylvania"];
  const featuredStates = featuredSlugs
    .map((slug) => stateEntities.find((e) => e.slug === slug))
    .filter(Boolean);

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Shop for Electricity by State", url: "/shop-electricity" },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/electricity-shopping">Electricity Shopping</Link>
          {" · "}
          <span aria-current="page">Shop for Electricity by State</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Shop for Electricity by State</h1>

        {/* INTRO */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity shopping conditions differ by state. Some states have more active retail choice markets where
            customers can compare providers and plans; others rely on regulated utilities with limited or no retail choice.
            Understanding your state&apos;s price, provider, and market context helps you know what to expect when
            evaluating electricity options.
          </p>
        </section>

        {/* WHAT THIS SECTION COVERS */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>What This Section Covers</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            This site provides state-by-state educational context for electricity shopping, not live shopping functionality.
            We explain what users should evaluate when thinking about electricity options in their state—price context,
            provider structure, affordability, and market rules. We do not offer enrollment, switching, or live plan
            comparisons.
          </p>
        </section>

        {/* HOW TO USE THESE PAGES */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>How to Use These Pages</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Users can combine the following to inform electricity shopping decisions:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><strong>State electricity price context</strong> — Average rates and estimated bills</li>
            <li><strong>Provider context</strong> — How provider structure and market rules vary by state</li>
            <li><strong>Affordability context</strong> — Cost burden and comparison with other states</li>
            <li><strong>Market structure context</strong> — Retail choice vs regulated utility environments</li>
            <li><strong>Plan-comparison guidance</strong> — What to evaluate when comparing plans</li>
          </ul>
        </section>

        {/* EXPLORE BY STATE */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Explore by State</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Select a state to see electricity shopping context for that state:
          </p>
          {featuredStates.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: 12,
                marginBottom: 16,
              }}
            >
              {featuredStates.map((e) => (
                <Link
                  key={e!.slug}
                  href={`/shop-electricity/${e!.slug}`}
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
                  <strong>Shop for electricity in {e!.slug === "new-york" ? "New York" : slugToDisplayName(e!.slug)}</strong>
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
                  href={`/shop-electricity/${e.slug}`}
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
            <li><Link href="/electricity-shopping">Electricity shopping by state</Link></li>
            <li><Link href="/electricity-providers">Electricity providers by state</Link></li>
            <li><Link href="/compare-electricity-plans">Compare electricity plans</Link></li>
            <li><Link href="/electricity-cost">Electricity cost by state</Link></li>
            <li><Link href="/electricity-affordability">Electricity affordability</Link></li>
            <li><Link href="/electricity-markets">Electricity market structures</Link></li>
            <li><Link href="/regional-electricity-markets">Regional electricity markets</Link></li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={release} />
      </main>
    </>
  );
}
