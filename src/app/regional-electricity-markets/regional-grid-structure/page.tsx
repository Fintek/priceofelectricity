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
  title: "Regional Grid Structure and Electricity Prices | PriceOfElectricity.com",
  description:
    "How regional grid structure can influence electricity economics. Transmission networks, generation location, and interconnection capacity affect price levels and volatility.",
  canonicalPath: "/regional-electricity-markets/regional-grid-structure",
});

export default async function RegionalGridStructurePage() {
  const [nationalPage, release] = await Promise.all([
    loadKnowledgePage("national", "national"),
    getRelease(),
  ]);

  const derived = nationalPage?.data?.derived as { averageRate?: number } | undefined;
  const nationalAvgRate = typeof derived?.averageRate === "number" ? derived.averageRate : null;
  const rateDollarsPerKwh = nationalAvgRate != null ? nationalAvgRate / 100 : 0;
  const monthlyBill = rateDollarsPerKwh * MONTHLY_USAGE_KWH;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Regional Electricity Markets", url: "/regional-electricity-markets" },
    { name: "Regional Grid Structure and Electricity Prices", url: "/regional-electricity-markets/regional-grid-structure" },
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
          <Link href="/regional-electricity-markets">Regional Electricity Markets</Link>
          {" · "}
          <span aria-current="page">Regional Grid Structure</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Regional Grid Structure and Electricity Prices</h1>

        {/* Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            The U.S. electricity grid is organized into regional systems. Each region has its own transmission networks, generation resources, and interconnection patterns. These structural differences can influence electricity economics and price levels.
          </p>
        </section>

        {/* Infrastructure Differences */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Infrastructure Differences</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><strong>Transmission networks</strong> — Regions differ in transmission capacity, age, and congestion. Constrained transmission can limit access to cheaper generation.</li>
            <li><strong>Generation location</strong> — Where power plants are located relative to load centers affects delivery costs and losses.</li>
            <li><strong>Interconnection capacity</strong> — Ability to import or export power between regions varies; limited interconnection can isolate regional prices.</li>
          </ul>
        </section>

        {/* Price Effects */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Price Effects</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Infrastructure constraints can influence price levels and volatility. Regions with limited transmission or interconnection may see prices diverge from neighboring areas during high demand or supply shocks. This site provides electricity-cost context; we do not publish real-time grid data or operational statistics.
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
              </ul>
            </div>
            <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>
              Source: <Link href="/knowledge/national">national snapshot</Link>.
            </p>
          </section>
        )}

        {/* Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li><Link href="/grid-capacity-and-electricity-demand">Grid capacity and electricity demand</Link></li>
            <li><Link href="/power-generation-mix">Power generation mix</Link></li>
            <li><Link href="/electricity-price-volatility">Electricity price volatility</Link></li>
            <li><Link href="/regional-electricity-markets">Regional electricity markets hub</Link></li>
          </ul>
        </section>

        <p className="muted" style={{ marginTop: 32 }}>
          <Link href="/regional-electricity-markets">Regional electricity markets</Link> {" | "}
          <Link href="/grid-capacity-and-electricity-demand">Grid capacity</Link> {" | "}
          <Link href="/electricity-trends">Electricity trends</Link> {" | "}
          <Link href="/site-map">Site map</Link>
        </p>

        <StatusFooter release={release} />
      </main>
    </>
  );
}
