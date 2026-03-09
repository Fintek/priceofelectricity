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
  title: "How Electricity Shopping Works | PriceOfElectricity.com",
  description:
    "Plain-language explainer: what to understand before comparing electricity options. Retail choice, provider structure, price context, and plan structure. Educational guidance, not live shopping tools.",
  canonicalPath: "/electricity-shopping/how-electricity-shopping-works",
});

export default async function HowElectricityShoppingWorksPage() {
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
    { name: "How Electricity Shopping Works", url: "/electricity-shopping/how-electricity-shopping-works" },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/electricity-shopping">Electricity Shopping</Link>
          {" · "}
          <span aria-current="page">How Electricity Shopping Works</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>How Electricity Shopping Works</h1>

        {/* INTRO */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity shopping usually involves understanding both market structure and price context. Whether you can choose among providers, how rates are set, and how your state&apos;s electricity costs compare nationally all affect what you should expect.
          </p>
        </section>

        {/* WHAT USERS SHOULD LOOK AT */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>What Users Should Look At</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><strong>Whether retail choice exists</strong> — Does your state allow customers to choose among competing electricity providers?</li>
            <li><strong>How provider structure works in the state</strong> — Single utility vs multiple retail options.</li>
            <li><strong>How general electricity prices compare</strong> — State average rates vs national average.</li>
            <li><strong>How affordability and bill stability matter</strong> — Cost burden and predictability of bills.</li>
            <li><strong>How plan structure may differ from raw average price per kWh</strong> — Fixed vs variable rates, contract terms, and fees can change the effective cost.</li>
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
            This site provides electricity price and market-structure context to support electricity-shopping research:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/electricity-providers">Electricity providers by state</Link></li>
            <li><Link href="/compare-electricity-plans">Compare electricity plans</Link></li>
            <li><Link href="/electricity-cost">Electricity cost by state</Link></li>
            <li><Link href="/electricity-affordability">Electricity affordability</Link></li>
            <li><Link href="/electricity-markets">Electricity market structures</Link></li>
            <li><Link href="/regional-electricity-markets">Regional electricity markets</Link></li>
          </ul>
        </section>

        {/* TRANSPARENCY */}
        <section style={{ marginBottom: 32, padding: "14px 18px", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: 8, backgroundColor: "var(--color-surface-alt, #f9fafb)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 10px 0" }}>Transparency</h2>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
            This site provides educational guidance and electricity-price context, not live shopping tools. We do not offer enrollment, switching, or real-time plan comparisons. For current offers and enrollment options, consult your state utility commission or retail electricity portals where available.
          </p>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={release} />
      </main>
    </>
  );
}
