import type { Metadata } from "next";
import Link from "next/link";
import { loadKnowledgePage } from "@/lib/knowledge/loadKnowledgePage";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import TopicClusterNav from "@/components/navigation/TopicClusterNav";

export const dynamic = "force-static";
export const revalidate = 86400;

const MONTHLY_USAGE_KWH = 900;

export const metadata: Metadata = buildMetadata({
  title: "Regional Electricity Markets and Price Differences | PriceOfElectricity.com",
  description:
    "Why electricity prices vary across regions of the United States. Generation mix, grid infrastructure, fuel access, market structure, and regulation.",
  canonicalPath: "/regional-electricity-markets",
});

export default async function RegionalElectricityMarketsPage() {
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
    { name: "Regional Electricity Markets and Price Differences", url: "/regional-electricity-markets" },
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
          <span aria-current="page">Regional Electricity Markets</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Regional Electricity Markets and Price Differences</h1>

        {/* Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity prices differ widely across regions of the United States. State-level rates can vary by a factor of three or more. This section explains why regional price differences exist and what factors can influence them. See <Link href="/compare-electricity-plans">electricity plan comparison guidance</Link> and <Link href="/electricity-shopping">electricity shopping by state</Link> for how to use this context.
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

        {/* Factors That Can Influence Regional Prices */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Factors That Can Influence Regional Prices</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Several factors can contribute to regional electricity price differences:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><strong>Generation mix</strong> — Different regions use different fuel sources and generation technologies.</li>
            <li><strong>Grid infrastructure</strong> — Transmission and distribution costs vary by region.</li>
            <li><strong>Fuel access</strong> — Proximity to natural gas, coal, hydropower, or renewables affects costs.</li>
            <li><strong>Market structure</strong> — Organized wholesale markets vs. regulated utilities.</li>
            <li><strong>Regulation</strong> — State policies, taxes, and renewable mandates influence prices.</li>
          </ul>
        </section>

        {/* Explore This Section */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Explore This Section</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li>
              <Link href="/regional-electricity-markets/why-electricity-prices-differ-by-region">Why Electricity Prices Differ by Region</Link>
              {" — "}
              Key drivers of regional price variation
            </li>
            <li>
              <Link href="/regional-electricity-markets/regional-grid-structure">Regional Grid Structure and Electricity Prices</Link>
              {" — "}
              How grid structure influences electricity economics
            </li>
          </ul>
        </section>

        <TopicClusterNav
          title="Related topic clusters"
          description="Market structure, cost drivers, and price dynamics."
          links={[
            { href: "/electricity-markets", label: "Electricity market structures" },
            { href: "/electricity-generation-cost-drivers", label: "Electricity generation cost drivers" },
            { href: "/power-generation-mix", label: "Power generation mix" },
            { href: "/electricity-price-volatility", label: "Electricity price volatility" },
            { href: "/electricity-cost", label: "Electricity cost by state" },
            { href: "/electricity-data", label: "Electricity data" },
          ]}
        />

        {/* Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li><Link href="/electricity-generation-cost-drivers">Explore electricity generation cost drivers</Link></li>
            <li><Link href="/electricity-cost">Electricity cost by state</Link></li>
            <li><Link href="/electricity-price-volatility">Electricity price volatility</Link></li>
            <li><Link href="/electricity-inflation">Electricity inflation</Link></li>
            <li><Link href="/electricity-markets">Electricity market structures</Link></li>
            <li><Link href="/power-generation-mix">Power generation mix</Link></li>
          </ul>
        </section>

        <p className="muted" style={{ marginTop: 32 }}>
          <Link href="/electricity-topics">Electricity topics</Link> {" | "}
          <Link href="/electricity-markets">Electricity markets</Link> {" | "}
          <Link href="/electricity-cost">Electricity cost</Link> {" | "}
          <Link href="/site-map">Site map</Link>
        </p>

        <StatusFooter release={release} />
      </main>
    </>
  );
}
