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
  title: "How to Compare Electricity Plans | PriceOfElectricity.com",
  description:
    "Practical guide: what to check when comparing electricity plans. Contract length, rate type, bill predictability, cancellation terms, and state market structure. Educational context, not live plan offers.",
  canonicalPath: "/compare-electricity-plans/how-to-compare-electricity-plans",
});

export default async function HowToCompareElectricityPlansPage() {
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
    { name: "How to Compare Electricity Plans", url: "/compare-electricity-plans/how-to-compare-electricity-plans" },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/compare-electricity-plans">Compare Electricity Plans</Link>
          {" · "}
          <span aria-current="page">How to Compare Electricity Plans</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>How to Compare Electricity Plans</h1>

        {/* INTRO */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Plan comparison is about more than advertised cents per kWh. Contract terms, rate type, bill predictability, and cancellation rules all matter. So does understanding whether your state uses retail choice or regulated structures—and how your state&apos;s general electricity cost context compares nationally.
          </p>
        </section>

        {/* KEY THINGS TO CHECK */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Key Things to Check</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><strong>Contract length</strong> — How long is the commitment? What happens at renewal?</li>
            <li><strong>Rate type</strong> — Fixed or variable? Fixed rates lock in a price; variable can change with market conditions.</li>
            <li><strong>Bill predictability</strong> — Will your bill stay stable or fluctuate with usage and rate changes?</li>
            <li><strong>Cancellation terms</strong> — Early-exit fees, notice requirements, and switching rules.</li>
            <li><strong>Retail choice vs regulated</strong> — Does your state offer retail choice where you can shop providers, or is it primarily regulated utility service?</li>
            <li><strong>State electricity cost context</strong> — How does your state&apos;s average rate compare to the national average? This helps set expectations.</li>
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
                State rates vary widely. See <Link href="/electricity-cost">electricity cost by state</Link> and <Link href="/electricity-affordability">affordability</Link> for state-level context.
              </p>
            </div>
          </section>
        )}

        {/* HOW THIS SITE HELPS */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>How This Site Helps</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            This site provides electricity price and market-structure context to support plan-comparison research:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/electricity-cost">Electricity cost by state</Link> — Average rates and estimated bills</li>
            <li><Link href="/electricity-affordability">Electricity affordability</Link> — Cost burden and affordability rankings</li>
            <li><Link href="/electricity-providers">Electricity providers by state</Link> — Provider and market structure context</li>
            <li><Link href="/electricity-markets">Electricity market structures</Link> — How markets are organized</li>
            <li><Link href="/regional-electricity-markets">Regional electricity markets</Link> — Why prices differ by region</li>
          </ul>
        </section>

        {/* TRANSPARENCY */}
        <section style={{ marginBottom: 32, padding: "14px 18px", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: 8, backgroundColor: "var(--color-surface-alt, #f9fafb)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 10px 0" }}>Transparency</h2>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
            This site does not provide live plan offers, provider listings, or switching functionality. It is intended as educational context to help you understand electricity prices, market structure, and what to consider when comparing plans. For current plans and rates, consult your state utility commission or retail electricity portals where available.
          </p>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={release} />
      </main>
    </>
  );
}
