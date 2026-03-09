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
  title: "Battery Recharge Cost by State – Home & Portable | PriceOfElectricity.com",
  description:
    "Estimate battery recharge cost by state. Recharge cost = capacity × electricity price. See 1 kWh portable, 5 kWh backup, and 13.5 kWh home battery examples.",
  canonicalPath: "/battery-recharge-cost",
});

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function BatteryRechargeCostIndexPage() {
  const entityIndex = await loadEntityIndex();
  const stateEntities =
    entityIndex?.entities
      ?.filter((e) => e.type === "state")
      .sort((a, b) => a.slug.localeCompare(b.slug)) ?? [];

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Battery Recharge Cost", url: "/battery-recharge-cost" },
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
          <span aria-current="page">Battery Recharge Cost</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Battery Recharge Cost by State</h1>
        <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
          Estimate battery recharge cost by state. The formula is <strong>recharge cost = battery capacity (kWh) × electricity price per kWh</strong>. Electricity prices vary widely by state, so recharge cost does too.
        </p>
        <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 14, lineHeight: 1.5 }}>
          <strong>Why it varies by state:</strong> A 13.5 kWh home battery costs about 3× more to recharge in Hawaii than in Idaho because electricity rates differ. Select a state to see estimates for portable, backup, and home battery sizes.
        </p>
        <p className="muted" style={{ margin: "0 0 24px 0", maxWidth: "65ch", fontSize: 14 }}>
          Rates come from EIA data. All figures are build-generated and deterministic.
        </p>

        {/* Battery size examples */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Standard Battery Size Examples</h2>
          <p style={{ margin: "0 0 12px 0", fontSize: 14 }}>
            We use three common battery capacities for estimates:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><strong>1 kWh portable battery</strong> — power banks, small backup</li>
            <li><strong>5 kWh backup battery</strong> — partial home backup</li>
            <li><strong>13.5 kWh home battery</strong> — whole-home backup (e.g. Tesla Powerwall)</li>
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
                href={`/battery-recharge-cost/${e.slug}`}
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
            { href: "/electricity-cost", label: "Electricity cost by state" },
            { href: "/generator-vs-battery-cost", label: "Generator vs battery cost" },
            { href: "/knowledge", label: "Knowledge Hub" },
            { href: "/methodology/battery-recharge-cost", label: "Battery methodology" },
            { href: "/methodology", label: "Methodology" },
          ]}
        />

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
