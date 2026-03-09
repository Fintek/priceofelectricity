import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadKnowledgePage, loadEntityIndex } from "@/lib/knowledge/loadKnowledgePage";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import { getRelease } from "@/lib/knowledge/fetch";

const MONTHLY_USAGE_KWH = 900;

export const dynamic = "force-static";
export const revalidate = 86400;

export async function generateStaticParams() {
  const index = await loadEntityIndex();
  return index.entities
    .filter((e) => e.type === "state")
    .map((e) => ({ slug: e.slug }));
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
      canonicalPath: `/shop-electricity/${slug}`,
    });
  }
  const raw = statePage.data?.raw as { name?: string; avgRateCentsPerKwh?: number } | undefined;
  const stateName = raw?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const description =
    `State-level electricity shopping context for ${stateName}. Understand price, provider, and market structure before comparing electricity options. Educational context, not live offers or enrollment.`;
  return buildMetadata({
    title: `Shop for Electricity in ${stateName} | PriceOfElectricity.com`,
    description,
    canonicalPath: `/shop-electricity/${slug}`,
  });
}

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ShopElectricityStatePage({
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
    { name: "Shop for Electricity by State", url: "/shop-electricity" },
    { name: stateName, url: `/shop-electricity/${slug}` },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/shop-electricity">Shop for Electricity by State</Link>
          {" · "}
          <span aria-current="page">{stateName}</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>
          Shop for Electricity in {stateName}
        </h1>

        {/* Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            This page provides state-level context for how to think about electricity shopping in {stateName}.
            We explain what users should evaluate—price context, provider structure, affordability, and market
            rules—before comparing electricity options. This is educational context, not live offers or enrollment.
          </p>
        </section>

        {/* State Electricity Price Context */}
        {avgRate != null && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>State Electricity Price Context</h2>
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
                <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Est. monthly (900 kWh)</div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>${estimatedMonthlyBill.toFixed(2)}</div>
              </div>
            </div>
            <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>
              Rates from EIA data. Estimates use 900 kWh monthly usage.
            </p>
          </section>
        )}

        {/* Shopping Context */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Shopping Context</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Customers in some states may have more retail choice than in others. Shopping decisions should be viewed
            alongside general electricity price context—average rates, estimated bills, and affordability. Bill
            stability and plan structure matter, not just advertised prices.
          </p>
          <p style={{ margin: 0, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            For state-specific market rules and retail choice availability, consult your state utility commission
            or public utility commission.
          </p>
        </section>

        {/* What Users Should Check */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>What Users Should Check</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Whether retail choice exists in your area</li>
            <li>Current average electricity price per kWh in {stateName}</li>
            <li>Affordability context and cost burden</li>
            <li>Comparison with national or other-state benchmarks</li>
            <li>Whether plan structure differs from average statewide pricing</li>
          </ul>
        </section>

        {/* Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href={`/electricity-providers/${slug}`}>Electricity providers in {stateName}</Link></li>
            <li><Link href={`/electricity-cost/${slug}`}>Electricity cost in {stateName}</Link></li>
            <li><Link href={`/electricity-affordability/${slug}`}>Electricity affordability in {stateName}</Link></li>
            <li><Link href="/compare-electricity-plans">Compare electricity plans</Link></li>
            <li><Link href="/electricity-shopping/by-state">Electricity shopping by state</Link></li>
            <li><Link href="/electricity-markets">Electricity market structures</Link></li>
          </ul>
        </section>

        <p style={{ marginBottom: 24, fontSize: 14 }}>
          <Link href="/shop-electricity">← Back to Shop for Electricity by State</Link>
        </p>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
