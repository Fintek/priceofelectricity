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
  title: "Generator vs Battery Backup Cost by State | PriceOfElectricity.com",
  description:
    "Compare battery recharge cost vs gasoline generator fuel cost by state. Operating cost only—no purchase price, installation, or maintenance.",
  canonicalPath: "/generator-vs-battery-cost",
});

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const BATTERY_CAPACITY_KWH = 13.5;
const GENERATOR_FUEL_USE_GALLONS_PER_HOUR = 0.75;
const GASOLINE_PRICE_PER_GALLON = 3.75;

export default async function GeneratorVsBatteryCostIndexPage() {
  const entityIndex = await loadEntityIndex();
  const stateEntities =
    entityIndex?.entities
      ?.filter((e) => e.type === "state")
      .sort((a, b) => a.slug.localeCompare(b.slug)) ?? [];

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Generator vs Battery Cost", url: "/generator-vs-battery-cost" },
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
          <span aria-current="page">Generator vs Battery Cost</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Generator vs Battery Backup Cost by State</h1>
        <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
          Compare the <strong>operating cost</strong> of two backup power options: recharging a home battery with grid electricity versus running a gasoline generator. We compare only the cost to recharge or run—not purchase price, installation, or maintenance.
        </p>
        <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 14, lineHeight: 1.5 }}>
          <strong>Why operating cost only:</strong> Purchase and installation vary widely. This page answers: given your state&apos;s electricity price, how does battery recharge cost compare to generator fuel cost?
        </p>
        <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
          <strong>Battery recharge cost</strong> depends on battery capacity and your state&apos;s electricity price.
          <strong> Generator fuel cost</strong> depends on fuel consumption and gasoline prices. Select a state to see
          the comparison.
        </p>

        {/* Fixed assumptions */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Fixed Assumptions</h2>
          <p style={{ margin: "0 0 12px 0", fontSize: 14 }}>
            All state pages use these baseline values for consistency:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><strong>Battery capacity:</strong> {BATTERY_CAPACITY_KWH} kWh (typical home battery)</li>
            <li><strong>Generator fuel use:</strong> {GENERATOR_FUEL_USE_GALLONS_PER_HOUR} gal/hour</li>
            <li><strong>Gasoline price:</strong> ${GASOLINE_PRICE_PER_GALLON.toFixed(2)}/gallon</li>
          </ul>
          <p className="muted" style={{ margin: "12px 0 0 0", fontSize: 14 }}>
            Electricity rates come from EIA data and vary by state. Gasoline price is a fixed national assumption.
          </p>
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
                href={`/generator-vs-battery-cost/${e.slug}`}
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

        <ExploreMore
          title="What next?"
          links={[
            { href: "/battery-recharge-cost", label: "Battery recharge cost" },
            { href: "/electricity-cost", label: "Electricity cost by state" },
            { href: "/knowledge", label: "Knowledge Hub" },
            { href: "/methodology/generator-vs-battery-cost", label: "Methodology" },
            { href: "/methodology", label: "All methodology" },
          ]}
        />

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
