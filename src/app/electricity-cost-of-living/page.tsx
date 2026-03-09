import type { Metadata } from "next";
import Link from "next/link";
import { loadEntityIndex } from "@/lib/knowledge/loadKnowledgePage";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import { getRelease } from "@/lib/knowledge/fetch";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Electricity Cost of Living by State | PriceOfElectricity.com",
  description:
    "How electricity prices affect household cost of living. Compare electricity's role in cost of living across U.S. states. Estimated monthly bills and state-by-state analysis.",
  canonicalPath: "/electricity-cost-of-living",
});

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ElectricityCostOfLivingPage() {
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
    { name: "Electricity Cost of Living", url: "/electricity-cost-of-living" },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/electricity-trends">Electricity Trends</Link>
          {" · "}
          <span aria-current="page">Electricity Cost of Living</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Electricity Cost of Living by State</h1>

        {/* A) Intro */}
        <section style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity is one part of cost of living. State electricity prices vary widely across the U.S., so the same household usage can cost significantly more or less depending on where you live. This section explains how electricity costs affect household budgets and cost-of-living comparisons.
          </p>
        </section>

        {/* B) Why Electricity Matters for Cost of Living */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why Electricity Matters for Cost of Living</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Recurring electricity bills affect household monthly costs. Higher electricity rates mean higher monthly bills for the same usage; lower rates mean lower bills. When comparing cost of living between states or planning a move, electricity costs are one factor to consider.
          </p>
        </section>

        {/* C) How the Site Estimates Electricity Cost of Living */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>How the Site Estimates Electricity Cost of Living</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            We use state electricity prices from EIA data and standard household usage assumptions (900 kWh per month). Estimated monthly bills are computed as rate × usage. All figures are build-generated and deterministic.
          </p>
          <p className="muted" style={{ margin: "0 0 24px 0", maxWidth: "65ch", fontSize: 14 }}>
            This section focuses on electricity only—not rent, taxes, groceries, or other household costs.
          </p>
        </section>

        {/* D) Explore by State */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Explore by State</h2>
          <p style={{ margin: "0 0 16px 0", maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity cost of living in each state:
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 12,
            }}
          >
            {stateEntities.map((e) => (
              <Link
                key={e.slug}
                href={`/electricity-cost-of-living/${e.slug}`}
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
                {e.title ?? slugToDisplayName(e.slug)}
              </Link>
            ))}
          </div>
        </section>

        {/* E) Related Pages */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href="/electricity-cost">Electricity Cost by State</Link>
              {" — "}
              Rates and estimated costs
            </li>
            <li>
              <Link href="/average-electricity-bill">Average Electricity Bill</Link>
              {" — "}
              Monthly bill estimates by state
            </li>
            <li>
              <Link href="/electricity-affordability">Electricity Affordability</Link>
              {" — "}
              Cost burden and affordability by state
            </li>
            <li>
              <Link href="/moving-to-electricity-cost">Electricity Costs When Moving</Link>
              {" — "}
              Compare electricity costs when relocating
            </li>
            <li>
              <Link href="/electricity-cost-comparison">Electricity Cost Comparison</Link>
              {" — "}
              Compare two states side by side
            </li>
            <li>
              <Link href="/solar-vs-grid-electricity-cost">Explore solar vs grid electricity economics</Link>
              {" — "}
              Grid electricity price context for solar
            </li>
            <li>
              <Link href="/battery-backup-electricity-cost">Explore battery recharge electricity costs</Link>
              {" — "}
              Grid electricity cost for charging home battery systems
            </li>
            <li>
              <Link href="/electricity-price-volatility">Explore electricity price volatility</Link>
              {" — "}
              Which states have more volatile electricity prices
            </li>
          </ul>
        </section>

        <p className="muted" style={{ marginBottom: 24, fontSize: 14 }}>
          Related topics: <Link href="/electricity-inflation">Electricity inflation</Link>
          {" · "}
          <Link href="/electricity-price-volatility">Electricity price volatility</Link>
          {" · "}
          <Link href="/electricity-topics">Electricity topics hub</Link>
          {" · "}
          <Link href="/electricity-data">Electricity data</Link>
        </p>

        {/* F) Practical Use Cases */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Practical Use Cases</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            These pages may be useful when moving, comparing states, or budgeting household electricity costs. Use them to understand electricity&apos;s role in cost of living before relocating or when evaluating different states.
          </p>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={release} />
      </main>
    </>
  );
}
