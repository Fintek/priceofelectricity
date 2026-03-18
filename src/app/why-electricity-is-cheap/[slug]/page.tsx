import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadKnowledgePage } from "@/lib/knowledge/loadKnowledgePage";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import { getRelease } from "@/lib/knowledge/fetch";

export const dynamicParams = true;
export const revalidate = 86400;

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const statePage = await loadKnowledgePage("state", slug);
  if (!statePage) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/why-electricity-is-cheap/${slug}`,
    });
  }
  const raw = statePage.data?.raw as { name?: string; avgRateCentsPerKwh?: number } | undefined;
  const stateName = raw?.name ?? slugToDisplayName(slug);
  const avgRate = typeof raw?.avgRateCentsPerKwh === "number" ? raw.avgRateCentsPerKwh : null;
  const description =
    avgRate != null
      ? `Why electricity is cheap in ${stateName}. Average rate ${avgRate.toFixed(2)}¢/kWh. Factors that can influence electricity prices.`
      : `Why electricity is cheap in ${stateName}. Factors that can influence electricity prices.`;
  return buildMetadata({
    title: `Why Electricity Is Cheap in ${stateName} | PriceOfElectricity.com`,
    description,
    canonicalPath: `/why-electricity-is-cheap/${slug}`,
  });
}

export default async function WhyElectricityIsCheapStatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [statePage, nationalPage, release] = await Promise.all([
    loadKnowledgePage("state", slug),
    loadKnowledgePage("national", "national"),
    getRelease(),
  ]);

  if (!statePage) notFound();

  const raw = statePage.data?.raw as {
    name?: string;
    avgRateCentsPerKwh?: number;
    updated?: string;
  } | undefined;
  const derived = statePage.data?.derived as {
    comparison?: {
      nationalAverage: number;
      differenceCents: number;
      differencePercent: number;
      category: string;
    };
  } | undefined;
  const stateName = raw?.name ?? slugToDisplayName(slug);
  const avgRate = typeof raw?.avgRateCentsPerKwh === "number" ? raw.avgRateCentsPerKwh : null;
  const nationalAvg = (nationalPage?.data?.derived as { averageRate?: number } | undefined)?.averageRate ?? null;
  const comparison = derived?.comparison;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Why Electricity Is Cheap", url: "/why-electricity-is-cheap" },
    { name: `Why Electricity Is Cheap in ${stateName}`, url: `/why-electricity-is-cheap/${slug}` },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/why-electricity-is-cheap">Why Electricity Is Cheap</Link>
          {" · "}
          <span aria-current="page">{stateName}</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>
          Why Electricity Is Cheap in {stateName}
        </h1>

        {/* A) Intro */}
        <section style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            {stateName}&apos;s electricity price may be influenced by regional market structure, generation context, infrastructure, and fuel availability. This page provides context—not state-specific causal explanations—using the state&apos;s current electricity price data.
          </p>
        </section>

        {/* B) Current State Electricity Price */}
        {avgRate != null && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Current Electricity Price</h2>
            <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
              {stateName}&apos;s average residential electricity rate is {avgRate.toFixed(2)} ¢/kWh.
              {nationalAvg != null && comparison && (
                <> That is {Math.abs(comparison.differencePercent).toFixed(1)}% {comparison.differencePercent < 0 ? "below" : "above"} the national average of {nationalAvg.toFixed(2)} ¢/kWh.</>
              )}
            </p>
            <p style={{ margin: 0 }}>
              <Link href={`/electricity-cost/${slug}`}>Electricity cost in {stateName}</Link>
              {" — "}
              Rates and estimated costs
            </p>
          </section>
        )}

        {/* C) Factors (generic) */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Factors That Can Influence Electricity Prices</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            State electricity prices can be influenced by:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Fuel availability and generation resources</li>
            <li>Grid infrastructure and transmission efficiency</li>
            <li>Market design and regional advantages</li>
            <li>Supply-demand balance</li>
          </ul>
        </section>

        {/* D) Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li><Link href={`/electricity-cost/${slug}`}>Electricity cost in {stateName}</Link></li>
            <li><Link href="/electricity-affordability">Electricity affordability</Link></li>
            <li><Link href="/electricity-cost-comparison">Electricity cost comparison</Link> — Compare two states</li>
            <li><Link href="/why-electricity-is-cheap">Why electricity is cheap (national)</Link></li>
            <li><Link href="/power-generation-mix">Power generation mix</Link></li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={release} />
      </main>
    </>
  );
}
