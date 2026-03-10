import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import { loadLongtailStateData, formatRate, formatUsd } from "@/lib/longtail/stateLongtail";
import {
  buildHomeSizeCostRows,
  formatKwh,
  getHomeSizeScenario,
  getHomeSizeStaticParams,
} from "@/lib/longtail/usageIntelligence";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function generateStaticParams() {
  return getHomeSizeStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ size: string }>;
}): Promise<Metadata> {
  const { size } = await params;
  const scenario = getHomeSizeScenario(size);
  if (!scenario) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/electricity-usage/home-size/${size}`,
    });
  }
  return buildMetadata({
    title: `${scenario.label} | PriceOfElectricity.com`,
    description: `Estimated monthly electricity usage for a ${scenario.squareFeet.toLocaleString()} sq ft home: ${formatKwh(
      scenario.lowKwh,
    )} to ${formatKwh(scenario.highKwh)} with a typical midpoint of ${formatKwh(scenario.typicalKwh)}.`,
    canonicalPath: `/electricity-usage/home-size/${size}`,
  });
}

export default async function HomeSizeUsagePage({
  params,
}: {
  params: Promise<{ size: string }>;
}) {
  const { size } = await params;
  const scenario = getHomeSizeScenario(size);
  if (!scenario) notFound();

  const representativeState = await loadLongtailStateData("texas");
  if (!representativeState) notFound();

  const costRows = buildHomeSizeCostRows(scenario, representativeState.nationalAverageCentsPerKwh);
  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Usage", url: "/electricity-usage" },
    { name: "Home Size", url: "/electricity-usage/home-size/1500-sqft" },
    { name: scenario.label, url: `/electricity-usage/home-size/${scenario.slug}` },
  ]);
  const webPageJsonLd = buildWebPageJsonLd({
    title: scenario.label,
    description: `Electricity usage range estimates for a ${scenario.squareFeet.toLocaleString()} sq ft home with links to canonical cost pages and calculator routes.`,
    url: `/electricity-usage/home-size/${scenario.slug}`,
    isPartOf: "/",
    about: ["kwh usage for home sizes", "average kwh per month by home size", "household electricity usage"],
  });

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd]} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/electricity-usage">Electricity Usage</Link>
          {" · "}
          <span aria-current="page">{scenario.label}</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>{scenario.label}</h1>
        <p style={{ marginTop: 0, marginBottom: 20, maxWidth: "70ch", lineHeight: 1.7 }}>
          This home-size page estimates typical electricity usage ranges for a {scenario.squareFeet.toLocaleString()} sq
          ft household and links those ranges to cost pathways. The goal is to translate square footage and appliance
          load patterns into practical kWh planning bands.
        </p>

        <section style={{ marginBottom: 32 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
            <div style={{ padding: 20, border: "1px solid var(--color-border, #e5e7eb)", borderRadius: 8, backgroundColor: "var(--color-surface-alt, #f9fafb)" }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Low usage profile</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{formatKwh(scenario.lowKwh)}</div>
            </div>
            <div style={{ padding: 20, border: "1px solid var(--color-border, #e5e7eb)", borderRadius: 8, backgroundColor: "var(--color-surface-alt, #f9fafb)" }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Typical usage profile</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{formatKwh(scenario.typicalKwh)}</div>
            </div>
            <div style={{ padding: 20, border: "1px solid var(--color-border, #e5e7eb)", borderRadius: 8, backgroundColor: "var(--color-surface-alt, #f9fafb)" }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>High usage profile</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{formatKwh(scenario.highKwh)}</div>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Usage assumptions</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            {scenario.assumptions.map((assumption) => (
              <li key={assumption}>{assumption}</li>
            ))}
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Estimated cost linkage (U.S. benchmark rate)</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            Cost examples below use the national benchmark rate of {formatRate(representativeState.nationalAverageCentsPerKwh)}.
            Open the linked canonical usage-cost pages to switch into state-specific pricing.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid var(--color-border, #e5e7eb)" }}>
              <thead>
                <tr>
                  {["Profile", "Monthly usage", "Estimated monthly cost", "Estimated annual cost"].map((label) => (
                    <th key={label} style={{ textAlign: "left", padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)", backgroundColor: "var(--color-surface-alt, #f9fafb)" }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {costRows.map((row) => (
                  <tr key={row.label}>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>{row.label}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>{formatKwh(row.monthlyKwh)}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>{formatUsd(row.monthlyCost)}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>{formatUsd(row.annualCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Connect to calculators and usage-cost pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href={`/electricity-usage-cost/${scenario.typicalKwh >= 1800 ? 2000 : scenario.typicalKwh >= 1250 ? 1500 : 1000}/texas`}>Canonical usage-cost example in Texas</Link></li>
            <li><Link href="/electricity-cost-calculator">Electricity cost calculator hub</Link></li>
            <li><Link href="/average-electricity-bill">Average electricity bill hub</Link></li>
            <li><Link href="/electricity-usage/appliances/refrigerator">Refrigerator usage reference page</Link></li>
            <li><Link href="/cost-to-run/central-ac/texas">Central AC cost example in Texas</Link></li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Source & Method</h2>
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            Source:{" "}
            {representativeState.sourceUrl ? (
              <a href={representativeState.sourceUrl} rel="noopener noreferrer" target="_blank">
                {representativeState.sourceName}
              </a>
            ) : (
              representativeState.sourceName
            )}
            .{" "}
            {representativeState.updatedLabel
              ? `Last dataset period: ${representativeState.updatedLabel}.`
              : "Data period label is currently unavailable."}{" "}
            Home-size usage ranges are deterministic planning assumptions tied to appliance/HVAC profiles and intended
            for comparative usage intelligence.
          </p>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
