import type { Metadata } from "next";
import Link from "next/link";
import { loadKnowledgePage } from "@/lib/knowledge/loadKnowledgePage";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import { getRelease } from "@/lib/knowledge/fetch";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Why Electricity Is Expensive | PriceOfElectricity.com",
  description:
    "Factors that can contribute to higher electricity prices: generation mix, grid infrastructure, market structure, and fuel exposure.",
  canonicalPath: "/why-electricity-is-expensive",
});

export default async function WhyElectricityIsExpensivePage() {
  const [nationalPage, release] = await Promise.all([
    loadKnowledgePage("national", "national"),
    getRelease(),
  ]);

  const derived = nationalPage?.data?.derived as {
    averageRate?: number;
    highestState?: { slug?: string; name?: string; rate?: number };
    top5Highest?: Array<{ slug: string; name: string; rate: number }>;
  } | undefined;
  const nationalAvgRate = typeof derived?.averageRate === "number" ? derived.averageRate : null;
  const highestState = derived?.highestState ?? derived?.top5Highest?.[0];

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Why Electricity Is Expensive", url: "/why-electricity-is-expensive" },
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
          <span aria-current="page">Why Electricity Is Expensive</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Why Electricity Is Expensive</h1>

        {/* A) Intro */}
        <section style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity prices vary widely across states. This page explains factors that can contribute to higher electricity prices—without attributing specific causes to any single state.
          </p>
        </section>

        {/* B) Factors */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Factors That Can Contribute to Higher Prices</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><strong>Generation mix</strong> — States that rely more on natural gas or imported fuels can see higher costs when fuel prices rise.</li>
            <li><strong>Grid infrastructure</strong> — Transmission constraints, reliability investments, and regional grid structure can affect retail rates.</li>
            <li><strong>Market structure</strong> — Regulated vs. competitive markets, capacity markets, and regional differences can influence pricing.</li>
            <li><strong>Fuel exposure</strong> — Proximity to low-cost generation (hydro, nuclear, wind) vs. dependence on higher-cost fuels can matter.</li>
          </ul>
        </section>

        {/* C) National Context */}
        {highestState && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>National Context</h2>
            <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
              {nationalAvgRate != null && (
                <>The U.S. national average residential rate is {nationalAvgRate.toFixed(2)} ¢/kWh. </>
              )}
              States with the highest average rates include {highestState.name} ({highestState.rate?.toFixed(2)} ¢/kWh).
            </p>
            <p style={{ margin: 0 }}>
              <Link href="/electricity-cost">Electricity cost by state</Link>
              {" — "}
              Compare rates and estimated costs
            </p>
          </section>
        )}

        {/* D) Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li><Link href="/electricity-cost">Electricity cost by state</Link> — Compare rates and estimated costs</li>
            <li><Link href="/regional-electricity-markets">Regional electricity markets</Link> — Why electricity prices differ across regions</li>
            <li><Link href="/power-generation-mix">Power generation mix</Link> — How fuel mix can influence prices</li>
            <li><Link href="/electricity-generation-cost-drivers">Electricity generation cost drivers</Link> — Fuel costs, infrastructure, and cost drivers</li>
            <li>State-specific context: <Link href="/why-electricity-is-expensive/hawaii">Why electricity is expensive in Hawaii</Link>, <Link href="/why-electricity-is-expensive/california">California</Link>, and other high-rate states</li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={release} />
      </main>
    </>
  );
}
