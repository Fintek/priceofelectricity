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

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Providers", url: "/electricity-providers" },
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
