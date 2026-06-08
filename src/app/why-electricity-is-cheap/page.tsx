import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs, { breadcrumbsToJsonLd, type BreadcrumbItem } from "@/components/navigation/Breadcrumbs";
import { loadKnowledgePage } from "@/lib/knowledge/loadKnowledgePage";
import { buildMetadata } from "@/lib/seo/metadata";

import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import { getRelease } from "@/lib/knowledge/fetch";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Why Electricity Is Cheap | PriceOfElectricity.com",
  description:
    "Factors that can contribute to lower electricity prices: fuel availability, infrastructure, generation resources, and market design.",
  canonicalPath: "/why-electricity-is-cheap",
});

export default async function WhyElectricityIsCheapPage() {
  const [nationalPage, release] = await Promise.all([
    loadKnowledgePage("national", "national"),
    getRelease(),
  ]);

  const derived = nationalPage?.data?.derived as {
    averageRate?: number;
    lowestState?: { slug?: string; name?: string; rate?: number };
    top5Lowest?: Array<{ slug: string; name: string; rate: number }>;
  } | undefined;
  const nationalAvgRate = typeof derived?.averageRate === "number" ? derived.averageRate : null;
  const lowestState = derived?.lowestState ?? derived?.top5Lowest?.[0];

  const breadcrumbTrail: BreadcrumbItem[] = [
    { name: "Home", url: "/" },
    { name: "Electricity Trends", url: "/electricity-trends" },
    { name: "Why Electricity Is Cheap" },
  ];
  const breadcrumbJsonLd = breadcrumbsToJsonLd(breadcrumbTrail);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <Breadcrumbs trail={breadcrumbTrail} />

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Why Electricity Is Cheap</h1>

        {/* A) Intro */}
        <section style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Some states have lower electricity prices than others. This page explains factors that can contribute to lower electricity prices—without attributing specific causes to any single state.
          </p>
        </section>

        {/* B) Factors */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Factors That Can Contribute to Lower Prices</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><strong>Fuel availability</strong> — Access to low-cost hydro, nuclear, or wind can reduce generation costs.</li>
            <li><strong>Infrastructure</strong> — Efficient grid design and lower transmission costs can help keep rates down.</li>
            <li><strong>Generation resources</strong> — Diverse, low-cost generation mix can support lower retail prices.</li>
            <li><strong>Market design</strong> — Competitive markets, long-term contracts, and regional advantages can influence pricing.</li>
          </ul>
        </section>

        {/* C) National Context */}
        {lowestState && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>National Context</h2>
            <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
              {nationalAvgRate != null && (
                <>The U.S. national average residential rate is {nationalAvgRate.toFixed(2)} ¢/kWh. </>
              )}
              States with the lowest average rates include {lowestState.name} ({lowestState.rate?.toFixed(2)} ¢/kWh).
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
            <li><Link href="/electricity-cost-comparison">Electricity cost comparison</Link> — Compare two states side by side</li>
            <li><Link href="/power-generation-mix">Power generation mix</Link> — How fuel mix can influence prices</li>
            <li>State-specific context: <Link href="/why-electricity-is-cheap/idaho">Why electricity is cheap in Idaho</Link>, <Link href="/why-electricity-is-cheap/north-dakota">North Dakota</Link>, and other low-rate states</li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={release} />
      </main>
    </>
  );
}
