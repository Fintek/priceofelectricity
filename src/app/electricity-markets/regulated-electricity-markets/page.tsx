import type { Metadata } from "next";
import Link from "next/link";
import { loadKnowledgePage } from "@/lib/knowledge/loadKnowledgePage";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";

export const dynamic = "force-static";
export const revalidate = 86400;

const MONTHLY_USAGE_KWH = 900;

export const metadata: Metadata = buildMetadata({
  title: "Regulated Electricity Markets | PriceOfElectricity.com",
  description:
    "How regulated electricity markets work. Traditional vertically integrated utilities, rate regulation, and why electricity price levels can differ across regions.",
  canonicalPath: "/electricity-markets/regulated-electricity-markets",
});

export default async function RegulatedElectricityMarketsPage() {
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
    { name: "Electricity Markets", url: "/electricity-markets" },
    { name: "Regulated Electricity Markets", url: "/electricity-markets/regulated-electricity-markets" },
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
          <Link href="/electricity-markets">Electricity Markets</Link>
          {" · "}
          <span aria-current="page">Regulated Electricity Markets</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Regulated Electricity Markets</h1>

        {/* Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Regulated electricity systems use traditional vertically integrated utilities that own generation, transmission, and distribution. Rates are set through regulatory oversight rather than wholesale market competition. Many states use this structure.
          </p>
        </section>

        {/* How Prices Are Determined */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>How Prices Are Determined</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            In regulated markets, rates are typically set through rate cases before state utility commissions. Regulators review utility costs—including generation, transmission, distribution, and operations—and approve rates that allow the utility to recover costs plus a regulated return. Infrastructure planning and fuel procurement are often integrated into utility operations.
          </p>
        </section>

        {/* Why Price Levels Can Differ */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why Price Levels Can Differ</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Regional infrastructure, fuel sources, and regulatory decisions all contribute to electricity price differences across states. Regulated utilities in different regions may face different fuel costs, transmission costs, and regulatory frameworks. This site provides electricity-cost context; we do not publish detailed utility-by-utility data.
          </p>
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
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
                <li>
                  <strong>National average rate:</strong> {nationalAvgRate.toFixed(2)}¢/kWh
                </li>
                <li>
                  <strong>Estimated monthly bill at 900 kWh:</strong> ${monthlyBill.toFixed(2)}
                </li>
                {derived?.highestState && (
                  <li>
                    <strong>Highest state:</strong>{" "}
                    <Link href={`/electricity-cost/${derived.highestState.slug}`}>
                      {derived.highestState.name}
                    </Link>
                    {" "}({derived.highestState.rate?.toFixed(2)}¢/kWh)
                  </li>
                )}
                {derived?.lowestState && (
                  <li>
                    <strong>Lowest state:</strong>{" "}
                    <Link href={`/electricity-cost/${derived.lowestState.slug}`}>
                      {derived.lowestState.name}
                    </Link>
                    {" "}({derived.lowestState.rate?.toFixed(2)}¢/kWh)
                  </li>
                )}
              </ul>
            </div>
            <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>
              Source: <Link href="/knowledge/national">national snapshot</Link>. Data from EIA residential retail sales.
            </p>
          </section>
        )}

        {/* Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li><Link href="/electricity-cost">Electricity cost by state</Link></li>
            <li><Link href="/electricity-cost-of-living">Electricity cost of living</Link></li>
            <li><Link href="/electricity-price-volatility">Electricity price volatility</Link></li>
            <li><Link href="/power-generation-mix">Power generation mix</Link></li>
            <li><Link href="/electricity-markets">Electricity market structures</Link></li>
          </ul>
        </section>

        <p className="muted" style={{ marginTop: 32 }}>
          <Link href="/electricity-markets">Electricity markets</Link> {" | "}
          <Link href="/electricity-cost">Electricity cost</Link> {" | "}
          <Link href="/electricity-trends">Electricity trends</Link> {" | "}
          <Link href="/site-map">Site map</Link>
        </p>

        <StatusFooter release={release} />
      </main>
    </>
  );
}
