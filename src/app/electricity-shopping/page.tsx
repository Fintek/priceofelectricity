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
  title: "Electricity Shopping by State | PriceOfElectricity.com",
  description:
    "What electricity shopping means, why it differs by state, and how price and provider context support informed decisions. Educational context, not live shopping or enrollment.",
  canonicalPath: "/electricity-shopping",
});

export default async function ElectricityShoppingPage() {
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
    { name: "Electricity Shopping", url: "/electricity-shopping" },
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
          <span aria-current="page">Electricity Shopping</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Electricity Shopping by State</h1>

        {/* INTRO */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            In some states, users may have more electricity shopping choices than in others. Retail choice markets allow customers to compare providers and plans; regulated markets typically have a single utility serving an area. Understanding your state&apos;s structure helps you know what to expect when researching electricity options.
          </p>
        </section>

        {/* WHAT THIS SECTION COVERS */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>What This Section Covers</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Educational context for electricity shopping, not live shopping functionality. We explain what to evaluate—price context, provider structure, market rules—and how state electricity data supports decisions. We do not offer enrollment, switching, or live plan comparisons.
          </p>
        </section>

        {/* WHY ELECTRICITY SHOPPING DIFFERS BY STATE */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why Electricity Shopping Differs by State</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><strong>Regulated vs choice-oriented market structures</strong> — Some states use traditional regulated utilities; others have retail choice with multiple providers.</li>
            <li><strong>Provider context</strong> — The number and type of providers vary by state and affect how customers shop.</li>
            <li><strong>State electricity pricing environment</strong> — Average rates and affordability differ widely, setting the baseline for what customers can expect.</li>
            <li><strong>Plan comparison complexity</strong> — In choice markets, plan structure (fixed vs variable, contract length) adds complexity beyond raw average price per kWh.</li>
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

        {/* Explore this section */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Explore This Section</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/shop-electricity">Shop for electricity by state</Link></li>
            <li><Link href="/electricity-shopping/by-state">Electricity shopping by state guide</Link></li>
            <li><Link href="/electricity-shopping/how-electricity-shopping-works">How electricity shopping works</Link></li>
          </ul>
        </section>

        {/* RELATED PAGES */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/business-electricity-options">Business electricity options by state</Link></li>
            <li><Link href="/electricity-providers">Electricity providers by state</Link></li>
            <li><Link href="/compare-electricity-plans">Compare electricity plans</Link></li>
            <li><Link href="/electricity-markets">Electricity market structures</Link></li>
            <li><Link href="/regional-electricity-markets">Regional electricity markets</Link></li>
            <li><Link href="/electricity-cost">Electricity cost by state</Link></li>
            <li><Link href="/electricity-affordability">Electricity affordability</Link></li>
            <li><Link href="/electricity-data">Electricity data</Link></li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={release} />
      </main>
    </>
  );
}
