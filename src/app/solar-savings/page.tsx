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
  title: "Solar Savings Potential by State | PriceOfElectricity.com",
  description:
    "State-level electricity price context relevant to solar savings potential. Learn how grid electricity prices affect the value of offsetting consumption with solar.",
  canonicalPath: "/solar-savings",
});

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function SolarSavingsIndexPage() {
  const entityIndex = await loadEntityIndex();
  const stateEntities =
    entityIndex?.entities
      ?.filter((e) => e.type === "state")
      .sort((a, b) => a.slug.localeCompare(b.slug)) ?? [];

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Solar Savings", url: "/solar-savings" },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/electricity-cost">Electricity Cost</Link>
          {" · "}
          <span aria-current="page">Solar Savings</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Solar Savings Potential by State</h1>

        {/* INTRO */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            The financial value of solar is closely related to the cost of grid electricity being offset.
            When solar panels produce electricity, they reduce the amount of power you draw from the grid.
            The value of that offset depends partly on what you would have paid for grid electricity.
          </p>
        </section>

        {/* WHY ELECTRICITY PRICE MATTERS */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why Electricity Price Matters</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Higher grid electricity prices can increase the value of each kWh that solar offsets. In states
            with higher average rates, the same amount of solar generation may be worth more in avoided
            grid costs than in states with lower rates. This is why people often compare solar economics
            with local electricity costs.
          </p>
        </section>

        {/* WHAT THIS SECTION COVERS */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>What This Section Covers</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            This site provides state-level electricity price context relevant to solar savings—not installation
            quotes, payoff calculations, or solar production estimates. We show how state electricity prices
            vary and how that variation can affect the potential value of solar. For specific savings estimates,
            consult solar installers or tools that incorporate production and cost data.
          </p>
        </section>

        {/* EXPLORE BY STATE */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Explore by State</h2>
          <p style={{ margin: "0 0 16px 0", maxWidth: "65ch", fontSize: 14 }}>
            Select a state to see electricity price context relevant to solar savings potential.
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
                href={`/solar-savings/${e.slug}`}
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
            <li><Link href="/solar-vs-grid-electricity-cost">Solar vs grid electricity cost</Link> — Grid electricity price context for solar</li>
            <li><Link href="/battery-backup-electricity-cost">Battery backup electricity cost</Link></li>
            <li><Link href="/electricity-cost">Electricity cost by state</Link></li>
            <li><Link href="/electricity-affordability">Electricity affordability</Link></li>
            <li><Link href="/electricity-cost-of-living">Electricity cost of living</Link></li>
            <li><Link href="/electricity-data">Electricity data</Link></li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
