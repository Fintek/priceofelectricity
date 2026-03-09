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
  title: "Average Electricity Bill by State – Monthly & Annual Estimates | PriceOfElectricity.com",
  description:
    "Average electricity bill estimates by state. Monthly and annual bills based on 900 kWh usage. Compare how much households pay for electricity across the U.S.",
  canonicalPath: "/average-electricity-bill",
});

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function AverageElectricityBillIndexPage() {
  const entityIndex = await loadEntityIndex();
  const stateEntities =
    entityIndex?.entities
      ?.filter((e) => e.type === "state")
      .sort((a, b) => a.slug.localeCompare(b.slug)) ?? [];

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Average Electricity Bill", url: "/average-electricity-bill" },
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
          <span aria-current="page">Average Electricity Bill</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Average Electricity Bill by State</h1>
        <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
          Estimated average electricity bills for every U.S. state. Bills are calculated from each state&apos;s average residential rate and a standard 900 kWh monthly usage assumption.
        </p>
        <p className="muted" style={{ margin: "0 0 32px 0", maxWidth: "65ch", fontSize: 14 }}>
          All estimates assume 900 kWh per month (10,800 kWh per year). Rates come from EIA data. Figures are
          build-generated and deterministic.
        </p>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Browse by State</h2>
          <p className="muted" style={{ margin: "0 0 16px 0", fontSize: 14 }}>
            Select a state to see the average electricity rate, estimated monthly and annual bill, and comparison to
            the U.S. average.
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
                href={`/average-electricity-bill/${e.slug}`}
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

        <ExploreMore
          title="What next?"
          links={[
            { href: "/electricity-cost", label: "Electricity cost by state" },
            { href: "/electricity-cost-calculator", label: "Cost calculator" },
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
