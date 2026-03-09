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
  title: "Electricity Cost Calculator by State – Bill Estimator | PriceOfElectricity.com",
  description:
    "Estimate your electricity bill by state. Monthly cost = rate × usage. See low (500 kWh), typical (900 kWh), and high (1500 kWh) scenarios for every state.",
  canonicalPath: "/electricity-cost-calculator",
});

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ElectricityCostCalculatorIndexPage() {
  const entityIndex = await loadEntityIndex();
  const stateEntities =
    entityIndex?.entities
      ?.filter((e) => e.type === "state")
      .sort((a, b) => a.slug.localeCompare(b.slug)) ?? [];

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Cost Calculator", url: "/electricity-cost-calculator" },
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
          <span aria-current="page">Electricity Cost Calculator</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Electricity Cost Calculator by State</h1>
        <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
          Estimate your monthly electricity bill using each state&apos;s average residential rate. Formula: <strong>monthly bill = electricity rate × monthly kWh usage</strong>. Select a state to see cost estimates for 500, 900, and 1500 kWh usage levels.
        </p>
        <p className="muted" style={{ margin: "0 0 24px 0", maxWidth: "65ch", fontSize: 14 }}>
          Rates come from EIA data. All figures are build-generated and deterministic.
        </p>

        {/* Usage scenarios */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Standard Usage Scenarios</h2>
          <p style={{ margin: "0 0 12px 0", fontSize: 14 }}>
            We use three common monthly usage levels for estimates:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><strong>Low usage:</strong> 500 kWh/month — small apartments, minimal AC</li>
            <li><strong>Typical usage:</strong> 900 kWh/month — average U.S. household</li>
            <li><strong>High usage:</strong> 1,500 kWh/month — larger homes, more appliances</li>
          </ul>
        </section>

        {/* State links */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>By State</h2>
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
                href={`/electricity-cost-calculator/${e.slug}`}
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
                {slugToDisplayName(e.slug)}
              </Link>
            ))}
          </div>
        </section>

        <p className="muted" style={{ marginBottom: 24, fontSize: 14 }}>
          See fixed electricity cost examples:{" "}
          <Link href="/how-much-does-500-kwh-cost">How much does 500 kWh cost?</Link>
          {" · "}
          <Link href="/how-much-does-1000-kwh-cost">How much does 1000 kWh cost?</Link>
          {" · "}
          <Link href="/how-much-does-2000-kwh-cost">How much does 2000 kWh cost?</Link>
        </p>

        <ExploreMore
          title="What next?"
          links={[
            { href: "/electricity-cost", label: "Electricity cost by state" },
            { href: "/average-electricity-bill", label: "Average electricity bill" },
            { href: "/knowledge", label: "Knowledge Hub" },
            { href: "/electricity-trends", label: "Electricity trends" },
            { href: "/methodology", label: "Methodology" },
          ]}
        />

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
