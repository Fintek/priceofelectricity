import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import { APPLIANCE_CONFIGS, getApplianceConfig } from "@/lib/longtail/applianceConfig";
import { getRelease } from "@/lib/knowledge/fetch";
import {
  formatHoursPerDay,
  formatWattageRange,
  getRelatedAppliances,
} from "@/lib/longtail/applianceLongtail";
import { loadLongtailStateData } from "@/lib/longtail/stateLongtail";
import {
  getApplianceUsageReference,
  parseUsageApplianceSlug,
} from "@/lib/longtail/usageIntelligence";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function generateStaticParams() {
  return APPLIANCE_CONFIGS.map((appliance) => ({ appliance: appliance.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ appliance: string }>;
}): Promise<Metadata> {
  const { appliance } = await params;
  const applianceSlug = parseUsageApplianceSlug(appliance);
  if (!applianceSlug) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/electricity-usage/appliances/${appliance}`,
    });
  }
  const applianceConfig = getApplianceConfig(applianceSlug);
  const usage = getApplianceUsageReference(applianceSlug);
  return buildMetadata({
    title: `${applianceConfig.displayName} Electricity Usage (kWh) | PriceOfElectricity.com`,
    description: `${applianceConfig.displayName} electricity usage profile: ${usage.kwhPerHour.toFixed(2)} kWh/hour and ${usage.kwhPerMonth.toFixed(0)} kWh/month at typical runtime assumptions.`,
    canonicalPath: `/electricity-usage/appliances/${applianceSlug}`,
  });
}

export default async function ApplianceUsageReferencePage({
  params,
}: {
  params: Promise<{ appliance: string }>;
}) {
  const { appliance } = await params;
  const applianceSlug = parseUsageApplianceSlug(appliance);
  if (!applianceSlug) notFound();

  const applianceConfig = getApplianceConfig(applianceSlug);
  const usage = getApplianceUsageReference(applianceSlug);
  const representativeState = await loadLongtailStateData("texas");
  if (!representativeState) notFound();

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Usage", url: "/electricity-usage" },
    { name: "Appliances", url: "/electricity-usage/appliances/refrigerator" },
    { name: applianceConfig.displayName, url: `/electricity-usage/appliances/${applianceSlug}` },
  ]);
  const webPageJsonLd = buildWebPageJsonLd({
    title: `${applianceConfig.displayName} electricity usage`,
    description: `${applianceConfig.displayName} usage reference page with kWh/hour, daily and monthly usage assumptions and links to canonical cost routes.`,
    url: `/electricity-usage/appliances/${applianceSlug}`,
    isPartOf: "/",
    about: ["electricity usage by appliance", `${applianceConfig.displayName} kwh usage`, "appliance energy usage"],
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
          <span aria-current="page">{applianceConfig.displayName}</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>{applianceConfig.displayName} Electricity Usage</h1>
        <p style={{ marginTop: 0, marginBottom: 24, maxWidth: "70ch", lineHeight: 1.7 }}>
          This page focuses on kWh usage behavior for {applianceConfig.displayName.toLowerCase()} scenarios. It keeps
          intent centered on consumption modeling and then links into the canonical appliance cost route and calculator
          cluster for price-specific outcomes.
        </p>

        <section style={{ marginBottom: 32 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
            <div style={{ padding: 20, border: "1px solid var(--color-border, #e5e7eb)", borderRadius: 8, backgroundColor: "var(--color-surface-alt, #f9fafb)" }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Typical wattage range</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{formatWattageRange(applianceConfig)}</div>
            </div>
            <div style={{ padding: 20, border: "1px solid var(--color-border, #e5e7eb)", borderRadius: 8, backgroundColor: "var(--color-surface-alt, #f9fafb)" }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Typical runtime</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{formatHoursPerDay(applianceConfig.typicalUsageHoursPerDay)}</div>
            </div>
            <div style={{ padding: 20, border: "1px solid var(--color-border, #e5e7eb)", borderRadius: 8, backgroundColor: "var(--color-surface-alt, #f9fafb)" }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Estimated monthly usage</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{usage.kwhPerMonth.toFixed(1)} kWh</div>
            </div>
            <div style={{ padding: 20, border: "1px solid var(--color-border, #e5e7eb)", borderRadius: 8, backgroundColor: "var(--color-surface-alt, #f9fafb)" }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Estimated annual usage</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{usage.kwhPerYear.toFixed(1)} kWh</div>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Usage profile table</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid var(--color-border, #e5e7eb)" }}>
              <thead>
                <tr>
                  {["Metric", "Value"].map((label) => (
                    <th key={label} style={{ textAlign: "left", padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)", backgroundColor: "var(--color-surface-alt, #f9fafb)" }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["kWh per hour", `${usage.kwhPerHour.toFixed(2)} kWh`],
                  ["kWh per day (typical)", `${usage.kwhPerDay.toFixed(2)} kWh`],
                  ["kWh per month (typical)", `${usage.kwhPerMonth.toFixed(1)} kWh`],
                  ["kWh per year (typical)", `${usage.kwhPerYear.toFixed(1)} kWh`],
                  ["Low runtime scenario", formatHoursPerDay(usage.lowRuntimeHoursPerDay)],
                  ["High runtime scenario", formatHoursPerDay(usage.highRuntimeHoursPerDay)],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>{label}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Connect usage to cost tools</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href={`/cost-to-run/${applianceSlug}/${representativeState.slug}`}>
                Canonical cost page: {applianceConfig.displayName} in {representativeState.name}
              </Link>
            </li>
            <li>
              <Link href={`/electricity-cost-calculator/${representativeState.slug}/${applianceSlug}`}>
                Appliance calculator: {applianceConfig.displayName} in {representativeState.name}
              </Link>
            </li>
            <li>
              <Link href={`/electricity-cost-calculator/${representativeState.slug}`}>
                State calculator: {representativeState.name}
              </Link>
            </li>
            <li>
              <Link href="/electricity-usage">Back to electricity usage hub</Link>
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related appliance usage pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            {getRelatedAppliances(applianceSlug, 6).map((item) => (
              <li key={item.slug}>
                <Link href={`/electricity-usage/appliances/${item.slug}`}>{item.displayName} electricity usage</Link>
              </li>
            ))}
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
            Usage calculations are deterministic and based on appliance wattage and runtime assumptions.
          </p>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
