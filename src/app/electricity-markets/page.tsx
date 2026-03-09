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
  title: "Electricity Market Structures and Prices | PriceOfElectricity.com",
  description:
    "How different electricity market structures can influence electricity pricing patterns across states. Organized wholesale markets and regulated utility structures.",
  canonicalPath: "/electricity-markets",
});

export default async function ElectricityMarketsPage() {
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
    { name: "Electricity Market Structures and Prices", url: "/electricity-markets" },
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
          <span aria-current="page">Electricity Markets</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Electricity Market Structures and Prices</h1>

        {/* Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity prices can be influenced by how markets are structured and regulated. U.S. electricity markets operate under different structures—some regions use organized wholesale markets, while many states use traditional regulated utility structures. This section explains these differences in plain language. See <Link href="/compare-electricity-plans">how to compare electricity plans</Link> and <Link href="/electricity-shopping">electricity shopping guidance</Link> for plan-comparison context.
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
              <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
                <li>
                  <strong>National average rate:</strong> {nationalAvgRate.toFixed(2)}¢/kWh
                </li>
                <li>
                  <strong>Estimated monthly bill at 900 kWh:</strong> ${monthlyBill.toFixed(2)}
                </li>
              </ol>
            </div>
            <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>
              Source: <Link href="/knowledge/national">national snapshot</Link>. Data from EIA residential retail sales.
            </p>
          </section>
        )}

        {/* Organized Electricity Markets */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Organized Electricity Markets</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Some regions use organized wholesale electricity markets where independent system operators (ISOs) or regional transmission organizations (RTOs) coordinate power generation and transmission across multiple utilities.
          </p>
          <p style={{ margin: 0 }}>
            <Link href="/electricity-markets/iso-rto-markets">ISO and RTO electricity markets</Link>
            {" — "}
            How organized wholesale markets work
          </p>
        </section>

        {/* Regulated Electricity Markets */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Regulated Electricity Markets</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Many states use traditional regulated utility structures where vertically integrated utilities own generation, transmission, and distribution, and rates are set through regulatory oversight.
          </p>
          <p style={{ margin: 0 }}>
            <Link href="/electricity-markets/regulated-electricity-markets">Regulated electricity markets</Link>
            {" — "}
            How regulated utilities set prices
          </p>
        </section>

        {/* Why Market Structure Matters */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why Market Structure Matters</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Market structure can influence price formation, volatility, and investment decisions. Different structures may lead to different price dynamics across regions. This site provides electricity-cost context and explanatory analysis; we do not publish real-time market data or operational dashboards.
          </p>
        </section>

        <TopicClusterNav
          title="Related topic clusters"
          description="Regional markets, pricing dynamics, and cost drivers."
          links={[
            { href: "/regional-electricity-markets", label: "Regional electricity markets" },
            { href: "/power-generation-mix", label: "Power generation mix" },
            { href: "/electricity-generation-cost-drivers", label: "Electricity generation cost drivers" },
            { href: "/electricity-price-volatility", label: "Electricity price volatility" },
            { href: "/electricity-cost", label: "Electricity cost by state" },
            { href: "/electricity-data", label: "Electricity data" },
          ]}
        />

        {/* Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li><Link href="/regional-electricity-markets">Explore regional electricity markets</Link></li>
            <li><Link href="/electricity-generation-cost-drivers">Explore electricity generation cost drivers</Link></li>
            <li><Link href="/electricity-price-volatility">Electricity price volatility</Link></li>
            <li><Link href="/electricity-inflation">Electricity inflation</Link></li>
            <li><Link href="/electricity-trends">Electricity trends</Link></li>
            <li><Link href="/electricity-cost">Electricity cost by state</Link></li>
            <li><Link href="/electricity-data">Electricity data</Link></li>
          </ul>
        </section>

        <p className="muted" style={{ marginTop: 32 }}>
          <Link href="/electricity-topics">Electricity topics</Link> {" | "}
          <Link href="/electricity-trends">Electricity trends</Link> {" | "}
          <Link href="/electricity-cost">Electricity cost</Link> {" | "}
          <Link href="/site-map">Site map</Link>
        </p>

        <StatusFooter release={release} />
      </main>
    </>
  );
}
