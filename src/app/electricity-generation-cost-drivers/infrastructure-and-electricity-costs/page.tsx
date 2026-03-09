import type { Metadata } from "next";
import Link from "next/link";
import { loadKnowledgePage } from "@/lib/knowledge/loadKnowledgePage";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";

export const dynamic = "force-static";
export const revalidate = 86400;

const MONTHLY_USAGE_KWH = 900;

export const metadata: Metadata = buildMetadata({
  title: "Infrastructure and Electricity Costs | PriceOfElectricity.com",
  description:
    "How infrastructure can influence electricity costs. Transmission, distribution, and grid upgrades can be part of electricity-cost discussions.",
  canonicalPath: "/electricity-generation-cost-drivers/infrastructure-and-electricity-costs",
});

export default async function InfrastructureAndElectricityCostsPage() {
  const [nationalPage, release] = await Promise.all([
    loadKnowledgePage("national", "national"),
    getRelease(),
  ]);

  const derived = nationalPage?.data?.derived as {
    averageRate?: number;
    highestState?: { slug?: string; name?: string; rate?: number };
    lowestState?: { slug?: string; name?: string; rate?: number };
  } | undefined;

  const nationalAvgRate = typeof derived?.averageRate === "number" ? derived.averageRate : null;
  const rateDollarsPerKwh = nationalAvgRate != null ? nationalAvgRate / 100 : 0;
  const monthlyBill = rateDollarsPerKwh * MONTHLY_USAGE_KWH;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Generation Cost Drivers", url: "/electricity-generation-cost-drivers" },
    { name: "Infrastructure and Electricity Costs", url: "/electricity-generation-cost-drivers/infrastructure-and-electricity-costs" },
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
          <Link href="/electricity-generation-cost-drivers">Generation Cost Drivers</Link>
          {" · "}
          <span aria-current="page">Infrastructure and Electricity Costs</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Infrastructure and Electricity Costs</h1>

        {/* Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity costs are influenced not only by generation, but also by transmission, distribution, and system buildout. Infrastructure investment, maintenance, and upgrades are part of the electricity-cost picture. This page explains how infrastructure can influence electricity costs.
          </p>
        </section>

        {/* Infrastructure Cost Pressures */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Infrastructure Cost Pressures</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Investment needs, transmission constraints, and grid upgrades can be part of electricity-cost discussions. Regions with aging infrastructure, limited transmission capacity, or high demand growth may face different cost pressures than others. This is explanatory context—the site does not present precise utility cost-stack models.
          </p>
        </section>

        {/* Why This Matters for Price Differences */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why This Matters for Price Differences</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Regional and state electricity price differences can partly reflect infrastructure context. States with different transmission networks, distribution systems, and investment histories may see different cost structures. Compare <Link href="/electricity-cost">electricity costs by state</Link> for current rates.
          </p>
        </section>

        {/* National context block */}
        {nationalAvgRate != null && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>National Electricity Context</h2>
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
              }}
            >
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
                <li>
                  <strong>National average rate:</strong> {nationalAvgRate.toFixed(2)}¢/kWh
                </li>
                <li>
                  <strong>Estimated monthly bill at 900 kWh:</strong> ${monthlyBill.toFixed(2)}
                </li>
                {derived?.highestState && (
                  <li>
                    <strong>Highest state:</strong>{" "}
                    <Link href={`/electricity-cost/${derived.highestState.slug}`}>
                      {derived.highestState.name}
                    </Link>
                    {" "}({derived.highestState.rate?.toFixed(2)}¢/kWh)
                  </li>
                )}
                {derived?.lowestState && (
                  <li>
                    <strong>Lowest state:</strong>{" "}
                    <Link href={`/electricity-cost/${derived.lowestState.slug}`}>
                      {derived.lowestState.name}
                    </Link>
                    {" "}({derived.lowestState.rate?.toFixed(2)}¢/kWh)
                  </li>
                )}
              </ul>
            </div>
            <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>
              Source: <Link href="/knowledge/national">national snapshot</Link>. Data from EIA residential retail sales.
            </p>
          </section>
        )}

        {/* Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li><Link href="/grid-capacity-and-electricity-demand">Grid capacity and electricity demand</Link></li>
            <li><Link href="/regional-electricity-markets">Regional electricity markets</Link></li>
            <li><Link href="/electricity-cost">Electricity cost by state</Link></li>
            <li><Link href="/electricity-data">Electricity data</Link></li>
            <li><Link href="/datasets">Datasets</Link></li>
            <li><Link href="/electricity-generation-cost-drivers">Generation cost drivers hub</Link></li>
          </ul>
        </section>

        {/* Transparency */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Transparency</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            The site provides electricity-cost context and explanation, not utility engineering models. We do not present precise cost-stack breakdowns or claim exact causal weights for infrastructure costs. Our analysis is grounded in EIA residential retail data and explanatory authority.
          </p>
        </section>

        <p className="muted" style={{ marginTop: 32 }}>
          <Link href="/electricity-generation-cost-drivers">Generation cost drivers</Link> {" | "}
          <Link href="/grid-capacity-and-electricity-demand">Grid capacity</Link> {" | "}
          <Link href="/electricity-cost">Electricity cost</Link> {" | "}
          <Link href="/site-map">Site map</Link>
        </p>

        <StatusFooter release={release} />
      </main>
    </>
  );
}
