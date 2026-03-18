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

const MONTHLY_USAGE_KWH = 900;

export const dynamicParams = true;
export const revalidate = 86400;

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
      canonicalPath: `/business-electricity-options/${slug}`,
    });
  }
  const raw = statePage.data?.raw as { name?: string; avgRateCentsPerKwh?: number } | undefined;
  const stateName = raw?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const description =
    `State-level business electricity context for ${stateName}. Understand price, market structure, and what to evaluate when comparing electricity options. Educational context, not live quotes or procurement.`;
  return buildMetadata({
    title: `Business Electricity Options in ${stateName} | PriceOfElectricity.com`,
    description,
    canonicalPath: `/business-electricity-options/${slug}`,
  });
}

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function BusinessElectricityOptionsStatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const statePage = await loadKnowledgePage("state", slug);

  if (!statePage) notFound();

  const raw = statePage.data?.raw as { name?: string; avgRateCentsPerKwh?: number } | undefined;
  const stateName = raw?.name ?? slugToDisplayName(slug);
  const avgRate = typeof raw?.avgRateCentsPerKwh === "number" ? raw.avgRateCentsPerKwh : null;

  const rateDollarsPerKwh = avgRate != null ? avgRate / 100 : 0;
  const estimatedMonthlyBill = rateDollarsPerKwh * MONTHLY_USAGE_KWH;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Business Electricity Options by State", url: "/business-electricity-options" },
    { name: stateName, url: `/business-electricity-options/${slug}` },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/business-electricity-options">Business Electricity Options by State</Link>
          {" · "}
          <span aria-current="page">{stateName}</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>
          Business Electricity Options in {stateName}
        </h1>

        {/* Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            This page provides state-level context for how businesses can think about electricity options in {stateName}.
            We explain what organizations should evaluate—price context, market structure, and provider rules—before
            comparing electricity options. This is educational context, not live quotes or procurement.
          </p>
        </section>

        {/* State Electricity Price Context */}
        {avgRate != null && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>State Electricity Price Context</h2>
            <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
              The average residential electricity rate in {stateName} is {avgRate.toFixed(2)} ¢/kWh. At 900 kWh monthly
              usage, that represents an illustrative baseline of about ${estimatedMonthlyBill.toFixed(2)} per month.
              Actual commercial rates depend on utility territory, service class, demand charges, and contracts.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: 16,
              }}
            >
              <div
                style={{
                  padding: 20,
                  border: "1px solid var(--color-border, #e5e7eb)",
                  borderRadius: 8,
                  backgroundColor: "var(--color-surface-alt, #f9fafb)",
                }}
              >
                <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Average residential rate</div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>{avgRate.toFixed(2)} ¢/kWh</div>
              </div>
              <div
                style={{
                  padding: 20,
                  border: "1px solid var(--color-border, #e5e7eb)",
                  borderRadius: 8,
                  backgroundColor: "var(--color-surface-alt, #f9fafb)",
                }}
              >
                <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Illustrative 900 kWh/month</div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>${estimatedMonthlyBill.toFixed(2)}</div>
              </div>
            </div>
            <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>
              Rates from EIA data. Commercial usage patterns and tariffs differ from residential averages.
            </p>
          </section>
        )}

        {/* Business Decision Context */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Business Decision Context</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Businesses may want to evaluate general electricity price context, whether choice or provider structure
            differs by state, how predictable bills may be, and how commercial usage patterns differ from household
            usage. Demand charges, time-of-use rates, and contract terms can affect actual commercial bills.
          </p>
          <p style={{ margin: 0, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            For state-specific commercial market rules and retail choice availability, consult your state utility
            commission or public utility commission.
          </p>
        </section>

        {/* What Businesses Should Check */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>What Businesses Should Check</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Average electricity price context in {stateName}</li>
            <li>Affordability or price competitiveness relative to other states</li>
            <li>Market structure context—retail choice vs regulated utility</li>
            <li>Whether actual tariffs, demand charges, or contract terms differ from simple statewide averages</li>
          </ul>
        </section>

        {/* Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href={`/data-center-electricity-cost/${slug}`}>Data center electricity cost in {stateName}</Link></li>
            <li><Link href={`/electricity-cost/${slug}`}>Electricity cost in {stateName}</Link></li>
            <li><Link href={`/electricity-affordability/${slug}`}>Electricity affordability in {stateName}</Link></li>
            <li><Link href="/business-electricity-cost-decisions">Business electricity cost decisions</Link></li>
            <li><Link href={`/electricity-providers/${slug}`}>Electricity providers in {stateName}</Link></li>
            <li><Link href="/electricity-markets">Electricity market structures</Link></li>
          </ul>
        </section>

        <p style={{ marginBottom: 24, fontSize: 14 }}>
          <Link href="/business-electricity-options">← Back to Business Electricity Options by State</Link>
        </p>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
