import type { Metadata } from "next";
import Link from "next/link";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Generation Mix and Electricity Price Volatility | PriceOfElectricity.com",
  description:
    "How generation context can connect to electricity price volatility. Market structure, fuel exposure, and resource mix can shape how stable or unstable electricity prices appear.",
  canonicalPath: "/power-generation-mix/generation-mix-and-price-volatility",
});

export default async function GenerationMixAndPriceVolatilityPage() {
  const release = await getRelease();

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Power Generation Mix", url: "/power-generation-mix" },
    {
      name: "Generation Mix and Electricity Price Volatility",
      url: "/power-generation-mix/generation-mix-and-price-volatility",
    },
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
          <Link href="/power-generation-mix">Power Generation Mix</Link>
          {" · "}
          <span aria-current="page">Generation Mix and Price Volatility</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>
          Generation Mix and Electricity Price Volatility
        </h1>

        {/* A) Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Price volatility refers to how much electricity prices fluctuate over time. Higher volatility means prices swing more from month to month or year to year; lower volatility means prices are more stable and predictable. This page explains how generation context can connect to electricity price volatility.
          </p>
        </section>

        {/* B) Why Generation Context Can Matter */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why Generation Context Can Matter</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Market structure, fuel exposure, infrastructure flexibility, and resource mix can all shape how stable or unstable electricity prices appear. Regions with more fuel-dependent generation may see prices move more with fuel markets. Regions with more hydropower or nuclear may experience different volatility patterns. This is explanatory context—the site does not publish detailed generation mix data.
          </p>
        </section>

        {/* C) Connect to the Site's Volatility Analysis */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Connect to the Site&apos;s Volatility Analysis</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            The site ranks states by electricity price volatility using the coefficient of variation of monthly rates over the last 5 years. Explore these resources:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li>
              <Link href="/electricity-price-volatility">Electricity price volatility by state</Link>
              {" — "}
              Overview and state-level volatility context
            </li>
            <li>
              <Link href="/knowledge/rankings/volatility-5y">5-year volatility ranking</Link>
              {" — "}
              States ranked by 5-year price volatility
            </li>
          </ul>
        </section>

        {/* D) Why This Matters for Households and Businesses */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why This Matters for Households and Businesses</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Volatility can affect budgeting, planning, and electricity-cost predictability. Households in high-volatility states may face less predictable monthly bills. Energy-intensive businesses may factor volatility into location and contract decisions. Understanding volatility context can help with cost expectations.
          </p>
        </section>

        {/* E) Transparency / Limits */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Transparency and Limits</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            This site provides electricity-cost context and explanatory analysis. We do not publish a full generation dataset, fuel mix percentages by state, or causal claims about specific grid operators or utility fleets. Our volatility rankings are based on residential electricity rate history from EIA data.
          </p>
        </section>

        {/* Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li><Link href="/electricity-price-volatility">Electricity price volatility</Link></li>
            <li><Link href="/power-generation-mix/fuel-costs-and-electricity-prices">Fuel costs and electricity prices</Link></li>
            <li><Link href="/power-generation-mix">Power generation mix hub</Link></li>
            <li><Link href="/electricity-inflation">Electricity inflation</Link></li>
            <li><Link href="/electricity-cost">Electricity cost by state</Link></li>
          </ul>
        </section>

        <p className="muted" style={{ marginTop: 32 }}>
          <Link href="/power-generation-mix">Power generation mix</Link> {" | "}
          <Link href="/electricity-price-volatility">Electricity price volatility</Link> {" | "}
          <Link href="/electricity-trends">Electricity trends</Link> {" | "}
          <Link href="/site-map">Site map</Link>
        </p>

        <StatusFooter release={release} />
      </main>
    </>
  );
}
