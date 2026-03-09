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
  title: "Electricity Shopping by State Guide | PriceOfElectricity.com",
  description:
    "Electricity shopping conditions vary by state. Use provider, price, affordability, and market-structure context to inform decisions. Educational context, not live offers or enrollment.",
  canonicalPath: "/electricity-shopping/by-state",
});

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ElectricityShoppingByStatePage() {
  const [entityIndex, release] = await Promise.all([
    loadEntityIndex(),
    getRelease(),
  ]);

  const stateEntities =
    entityIndex?.entities
      ?.filter((e) => e.type === "state")
      .sort((a, b) => a.slug.localeCompare(b.slug)) ?? [];

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Shopping", url: "/electricity-shopping" },
    { name: "By State", url: "/electricity-shopping/by-state" },
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
          <span aria-current="page">By State</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Electricity Shopping by State</h1>

        {/* INTRO */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity shopping conditions vary by state. Users should first understand their state&apos;s electricity context—provider structure, price levels, affordability, and market rules—before researching options. This page helps you find that context.
          </p>
        </section>

        {/* HOW TO USE STATE CONTEXT */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>How to Use State Context</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Combine these resources to inform electricity-shopping research:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><strong>Electricity provider context</strong> — <Link href="/electricity-providers">Electricity providers by state</Link> explains market structure and what customers should check.</li>
            <li><strong>State electricity price context</strong> — <Link href="/electricity-cost">Electricity cost by state</Link> shows average rates and estimated bills.</li>
            <li><strong>Affordability context</strong> — <Link href="/electricity-affordability">Electricity affordability</Link> compares cost burden across states.</li>
            <li><strong>Market structure context</strong> — <Link href="/electricity-markets">Electricity markets</Link> and <Link href="/regional-electricity-markets">regional electricity markets</Link> explain how structure affects pricing and choice.</li>
          </ul>
        </section>

        {/* Browse by state */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Browse by State</h2>
          <p style={{ margin: "0 0 16px 0", maxWidth: "65ch", fontSize: 14 }}>
            Select a state to see electricity provider context, cost context, and affordability. Each state page links to related cost and provider pages. These are informational pages, not live shopping tools.
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
          <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>
            Also see <Link href="/electricity-cost">electricity cost by state</Link> and <Link href="/electricity-affordability">electricity affordability by state</Link> for cost-focused browsing.
          </p>
        </section>

        {/* Related */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/electricity-shopping">Electricity shopping (hub)</Link></li>
            <li><Link href="/electricity-shopping/how-electricity-shopping-works">How electricity shopping works</Link></li>
            <li><Link href="/compare-electricity-plans">Compare electricity plans</Link></li>
            <li><Link href="/electricity-providers">Electricity providers by state</Link></li>
            <li><Link href="/electricity-cost">Electricity cost by state</Link></li>
            <li><Link href="/electricity-affordability">Electricity affordability</Link></li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={release} />
      </main>
    </>
  );
}
