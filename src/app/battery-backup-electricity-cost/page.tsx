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
  title: "Battery Backup Electricity Cost by State | PriceOfElectricity.com",
  description:
    "How much electricity costs to recharge home battery systems using grid electricity. Grid electricity cost for charging battery backup systems by state.",
  canonicalPath: "/battery-backup-electricity-cost",
});

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function BatteryBackupElectricityCostPage() {
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
    { name: "Battery Backup Electricity Cost", url: "/battery-backup-electricity-cost" },
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
          <span aria-current="page">Battery Backup Electricity Cost</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Battery Backup Electricity Cost by State</h1>

        {/* A) Intro */}
        <section style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Battery backup systems store electricity that can be used during power outages. This section explains how much electricity costs to recharge home battery systems using grid electricity—relevant to home battery backup, solar + battery systems, and replacing fossil fuel generators.
          </p>
        </section>

        {/* B) Why Electricity Price Matters */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why Electricity Price Matters</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Batteries must be recharged using electricity, either from the grid or solar. When charging from the grid, higher electricity prices increase the cost of recharging. State electricity price context helps illustrate how recharge costs vary by location.
          </p>
        </section>

        {/* C) Grid Electricity and Battery Charging */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Grid Electricity and Battery Charging</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Higher electricity prices increase the cost of charging batteries from the grid. The formula is simple: <strong>recharge cost = battery capacity (kWh) × electricity price per kWh</strong>. Our state pages show illustrative recharge costs using state average residential rates.
          </p>
        </section>

        {/* D) Example Battery Sizes */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Example Battery Sizes</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Common home battery sizes used for estimates:
          </p>
          <ul style={{ margin: "0 0 16px 20px", lineHeight: 1.8 }}>
            <li><strong>10 kWh battery</strong> — smaller backup capacity</li>
            <li><strong>13.5 kWh battery</strong> — typical home battery size (e.g. Tesla Powerwall)</li>
            <li><strong>20 kWh battery</strong> — larger backup capacity</li>
          </ul>
          <p style={{ margin: 0, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            At different state electricity rates, these capacities translate to different recharge costs. Our state pages show illustrative examples.
          </p>
        </section>

        {/* E) Explore by State */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Explore by State</h2>
          <p style={{ margin: "0 0 16px 0", maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Grid electricity cost for charging battery backup systems by state:
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
                href={`/battery-backup-electricity-cost/${e.slug}`}
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

        {/* F) Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href="/solar-savings">Explore solar savings potential by state</Link>
              {" — "}
              Learn about solar savings potential
            </li>
            <li>
              <Link href="/solar-vs-grid-electricity-cost">Solar vs Grid Electricity Cost</Link>
              {" — "}
              Grid electricity price context for solar
            </li>
            <li>
              <Link href="/electricity-cost">Electricity Cost by State</Link>
              {" — "}
              State-level rates and estimated costs
            </li>
            <li>
              <Link href="/electricity-cost-of-living">Electricity Cost of Living</Link>
              {" — "}
              How electricity affects household budgets
            </li>
            <li>
              <Link href="/electricity-data">Electricity Data</Link>
              {" — "}
              Datasets and methodology
            </li>
            <li>
              <Link href="/datasets">Datasets</Link>
              {" — "}
              Download electricity price data
            </li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={release} />
      </main>
    </>
  );
}
