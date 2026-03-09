import type { Metadata } from "next";
import Link from "next/link";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import TopicClusterNav from "@/components/navigation/TopicClusterNav";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Power Generation Mix and Electricity Prices | PriceOfElectricity.com",
  description:
    "How the mix of fuels and generation resources can influence electricity prices, price stability, and state-level electricity economics.",
  canonicalPath: "/power-generation-mix",
});

export default async function PowerGenerationMixPage() {
  const release = await getRelease();

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Power Generation Mix and Electricity Prices", url: "/power-generation-mix" },
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
          <span aria-current="page">Power Generation Mix</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Power Generation Mix and Electricity Prices</h1>

        {/* A) Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity prices can be influenced by how power is generated. The mix of fuels and generation resources—natural gas, coal, nuclear, hydropower, wind, solar, and others—varies by region and can affect both the level and stability of electricity costs. This section explains these connections in plain language.
          </p>
        </section>

        {/* B) Why Generation Mix Matters */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why Generation Mix Matters</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Systems relying on different generation resources may respond differently to fuel costs, infrastructure constraints, and demand. Regions with a higher share of fuel-based generation may see electricity prices move more with fuel markets. Regions with more hydropower or nuclear may experience different price dynamics. Market structure, transmission, and policy also play roles.
          </p>
        </section>

        {/* C) Why This Matters for Price Differences */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why This Matters for Price Differences</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            State electricity prices vary widely. Generation context can help explain part of that variation—though transmission costs, regulations, taxes, and demand also matter. This site provides electricity-cost context and explanatory analysis; we do not publish detailed generation mix data by state.
          </p>
          <p style={{ margin: 0 }}>
            <Link href="/electricity-cost">Compare electricity costs by state</Link>
            {" — "}
            Current rates and estimated bills
          </p>
        </section>

        {/* D) Explore This Section */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Explore This Section</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li>
              <Link href="/power-generation-mix/fuel-costs-and-electricity-prices">Fuel Costs and Electricity Prices</Link>
              {" — "}
              How fuel costs can influence electricity prices
            </li>
            <li>
              <Link href="/power-generation-mix/generation-mix-and-price-volatility">Generation Mix and Electricity Price Volatility</Link>
              {" — "}
              How generation context connects to price stability
            </li>
          </ul>
        </section>

        <TopicClusterNav
          title="Related topic clusters"
          description="Electricity markets, volatility, generation cost drivers, and data."
          links={[
            { href: "/electricity-markets", label: "Electricity market structures" },
            { href: "/electricity-price-volatility", label: "Electricity price volatility" },
            { href: "/electricity-generation-cost-drivers", label: "Electricity generation cost drivers" },
            { href: "/electricity-data", label: "Electricity data" },
            { href: "/electricity-inflation", label: "Electricity inflation" },
            { href: "/electricity-topics", label: "Electricity topics hub" },
          ]}
        />

        {/* E) Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li><Link href="/electricity-generation-cost-drivers">Explore electricity generation cost drivers</Link></li>
            <li><Link href="/electricity-trends">Electricity trends</Link></li>
            <li><Link href="/electricity-inflation">Electricity inflation</Link></li>
            <li><Link href="/electricity-price-volatility">Electricity price volatility</Link></li>
            <li><Link href="/electricity-cost">Electricity cost by state</Link></li>
            <li><Link href="/electricity-data">Electricity data</Link></li>
            <li><Link href="/datasets">Datasets</Link></li>
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
