import type { Metadata } from "next";
import Link from "next/link";
import { loadKnowledgePage } from "@/lib/knowledge/loadKnowledgePage";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";

export const dynamic = "force-static";
export const revalidate = 86400;

const MONTHLY_USAGE_KWH = 900;

export const metadata: Metadata = buildMetadata({
  title: "Compare Electricity Plans | PriceOfElectricity.com",
  description:
    "Plan-comparison guidance: what to evaluate when comparing electricity plans, why state market structure matters. Educational context, not live plan listings.",
  canonicalPath: "/compare-electricity-plans",
});

export default async function CompareElectricityPlansPage() {
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
    { name: "Compare Electricity Plans", url: "/compare-electricity-plans" },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/electricity-providers">Electricity Providers</Link>
          {" · "}
          <span aria-current="page">Compare Electricity Plans</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>How to Compare Electricity Plans</h1>

        {/* INTRO */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            In some states, customers may compare electricity plans from competing providers. In others, they may be served primarily through regulated utility structures with limited or no retail choice. Understanding your state&apos;s market structure is the first step in knowing how to compare plans—or whether plan comparison applies at all.
          </p>
        </section>

        {/* WHAT THIS SECTION COVERS */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>What This Section Covers</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Educational context for plan comparison, not live plan listings. We explain what factors matter and how state electricity price and market-structure context can support research. We do not list plans, rates, or provider offers.
          </p>
        </section>

        {/* WHAT USERS SHOULD COMPARE */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>What Users Should Compare</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            When evaluating electricity plans, consider:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><strong>Fixed vs variable pricing</strong> — Fixed rates lock in a price for a term; variable rates can change.</li>
            <li><strong>Contract structure</strong> — Length, renewal terms, and early-exit fees.</li>
            <li><strong>Average electricity cost context</strong> — How your state&apos;s typical rates compare to the national average.</li>
            <li><strong>Bill stability</strong> — Whether the plan structure leads to predictable or fluctuating bills.</li>
            <li><strong>Market structure by state</strong> — Whether your state offers retail choice or relies on regulated utilities.</li>
          </ul>
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
              <p style={{ margin: "0 0 8px 0", fontSize: 14 }}>
                <strong>National average rate:</strong> {nationalAvgRate.toFixed(2)}¢/kWh
              </p>
              <p style={{ margin: 0, fontSize: 14 }}>
                <strong>Est. monthly bill (900 kWh):</strong> ${monthlyBill.toFixed(2)}
              </p>
              <p className="muted" style={{ marginTop: 12, marginBottom: 0, fontSize: 13 }}>
                State-level rates vary widely. Use <Link href="/electricity-cost">electricity cost by state</Link> and <Link href="/electricity-affordability">affordability</Link> for context.
              </p>
            </div>
          </section>
        )}

        {/* RELATED PAGES */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/shop-electricity">Shop for electricity by state</Link></li>
            <li><Link href="/electricity-shopping">Electricity shopping by state</Link></li>
            <li><Link href="/electricity-providers">Electricity providers by state</Link></li>
            <li><Link href="/electricity-cost">Electricity cost by state</Link></li>
            <li><Link href="/electricity-affordability">Electricity affordability</Link></li>
            <li><Link href="/electricity-markets">Electricity market structures</Link></li>
            <li><Link href="/regional-electricity-markets">Regional electricity markets</Link></li>
            <li><Link href="/electricity-data">Electricity data</Link></li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={release} />
      </main>
    </>
  );
}
