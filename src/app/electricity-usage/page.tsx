import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs, { breadcrumbsToJsonLd, type BreadcrumbItem } from "@/components/navigation/Breadcrumbs";
import { notFound } from "next/navigation";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import { APPLIANCE_CONFIGS } from "@/lib/longtail/applianceConfig";
import { getActiveApplianceSlugs } from "@/lib/longtail/rollout";
import { getRelease } from "@/lib/knowledge/fetch";
import {
  formatKwh,
  loadAllUsageStateSummaries,
  NATIONAL_AVERAGE_HOUSEHOLD_USAGE_KWH,
  USAGE_INTELLIGENCE_TIERS,
} from "@/lib/longtail/usageIntelligence";
import { buildMetadata } from "@/lib/seo/metadata";
import { formatRate, formatUsd } from "@/lib/longtail/stateLongtail";
import { buildWebPageJsonLd } from "@/lib/seo/jsonld";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Electricity Usage by Home and State | PriceOfElectricity.com",
  description:
    "National and state electricity usage benchmarks, kWh tiers, home-size scenarios, and appliance usage references with links to calculators and cost pages.",
  canonicalPath: "/electricity-usage",
});

export default async function ElectricityUsageHubPage() {
  const states = await loadAllUsageStateSummaries();
  if (states.length === 0) notFound();

  const sortedHighUsage = [...states].sort((a, b) => b.estimatedMonthlyUsageKwh - a.estimatedMonthlyUsageKwh).slice(0, 10);
  const sortedLowUsage = [...states].sort((a, b) => a.estimatedMonthlyUsageKwh - b.estimatedMonthlyUsageKwh).slice(0, 10);
  const representativeState = states.find((state) => state.nationalAverageCentsPerKwh != null) ?? states[0];
  const sourceState = states[0];

  const breadcrumbTrail: BreadcrumbItem[] = [
    { name: "Home", url: "/" },
    { name: "Electricity Usage" },
  ];
  const breadcrumbJsonLd = breadcrumbsToJsonLd(breadcrumbTrail);
  const webPageJsonLd = buildWebPageJsonLd({
    title: "Electricity usage guide",
    description: `National household electricity usage benchmark: ${formatKwh(
      NATIONAL_AVERAGE_HOUSEHOLD_USAGE_KWH,
    )} per month, with state usage pages, home-size scenarios, and appliance usage references.`,
    url: "/electricity-usage",
    isPartOf: "/",
    about: [
      "average electricity usage per home",
      "how many kwh does a house use",
      "electricity usage by state",
    ],
  });

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd]} />
      <main className="container">
        <Breadcrumbs trail={breadcrumbTrail} />

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Household electricity usage</h1>
        <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "70ch", lineHeight: 1.7 }}>
          This hub explains typical household electricity consumption and links usage levels to cost examples on the
          rest of the site—including calculators and fixed monthly kWh pages.
        </p>
        <p className="muted" style={{ margin: "0 0 32px 0", maxWidth: "70ch", lineHeight: 1.7 }}>
          National household benchmark usage is {formatKwh(NATIONAL_AVERAGE_HOUSEHOLD_USAGE_KWH)} per month
          (10,788 kWh/year). State pages adjust this benchmark using simple rate- and climate-informed modeling rules.
        </p>

        <section style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 16,
            }}
          >
            <div style={{ padding: 20, border: "1px solid var(--color-border, #e5e7eb)", borderRadius: 8, backgroundColor: "var(--color-surface-alt, #f9fafb)" }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>National usage benchmark</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{formatKwh(NATIONAL_AVERAGE_HOUSEHOLD_USAGE_KWH)}</div>
            </div>
            <div style={{ padding: 20, border: "1px solid var(--color-border, #e5e7eb)", borderRadius: 8, backgroundColor: "var(--color-surface-alt, #f9fafb)" }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Representative U.S. rate</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{formatRate(representativeState.nationalAverageCentsPerKwh)}</div>
            </div>
            <div style={{ padding: 20, border: "1px solid var(--color-border, #e5e7eb)", borderRadius: 8, backgroundColor: "var(--color-surface-alt, #f9fafb)" }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Estimated benchmark cost</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>
                {formatUsd((representativeState.nationalAverageCentsPerKwh ?? 0) / 100 * NATIONAL_AVERAGE_HOUSEHOLD_USAGE_KWH)}
              </div>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Common household usage tiers</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            {USAGE_INTELLIGENCE_TIERS.map((kwh) => (
              <li key={kwh}>
                <Link href={`/electricity-usage-cost/${kwh}/${representativeState.slug}`}>
                  {kwh.toLocaleString()} kWh monthly usage cost example in {representativeState.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Electricity usage by state</h2>
          <p className="muted" style={{ margin: "0 0 12px 0" }}>
            Browse every state usage page with modeled monthly kWh, national comparison, and linked cost pathways.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 10,
            }}
          >
            {states.map((state) => (
              <Link
                key={state.slug}
                href={`/electricity-usage/${state.slug}`}
                style={{
                  display: "block",
                  padding: 12,
                  border: "1px solid var(--color-border, #e5e7eb)",
                  borderRadius: 8,
                  backgroundColor: "var(--color-surface-alt, #f9fafb)",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                {state.name}
              </Link>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Home-size electricity usage scenarios</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/electricity-usage/home-size/1000-sqft">1,000 sq ft home usage profile</Link></li>
            <li><Link href="/electricity-usage/home-size/1500-sqft">1,500 sq ft home usage profile</Link></li>
            <li><Link href="/electricity-usage/home-size/2000-sqft">2,000 sq ft home usage profile</Link></li>
            <li><Link href="/electricity-usage/home-size/3000-sqft">3,000 sq ft home usage profile</Link></li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Appliance usage references</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            {APPLIANCE_CONFIGS.filter((a) => getActiveApplianceSlugs().includes(a.slug))
              .slice(0, 8)
              .map((appliance) => (
              <li key={appliance.slug}>
                <Link href={`/electricity-usage/appliances/${appliance.slug}`}>
                  {appliance.displayName} electricity usage profile
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Highest and lowest modeled usage states</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            <div style={{ padding: 16, border: "1px solid var(--color-border, #e5e7eb)", borderRadius: 8 }}>
              <h3 style={{ marginTop: 0, fontSize: 16 }}>Higher usage profiles</h3>
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
                {sortedHighUsage.map((state) => (
                  <li key={state.slug}>
                    <Link href={`/electricity-usage/${state.slug}`}>{state.name}</Link> — {formatKwh(state.estimatedMonthlyUsageKwh)}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ padding: 16, border: "1px solid var(--color-border, #e5e7eb)", borderRadius: 8 }}>
              <h3 style={{ marginTop: 0, fontSize: 16 }}>Lower usage profiles</h3>
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
                {sortedLowUsage.map((state) => (
                  <li key={state.slug}>
                    <Link href={`/electricity-usage/${state.slug}`}>{state.name}</Link> — {formatKwh(state.estimatedMonthlyUsageKwh)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Connected consumer tools</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/electricity-cost-calculator">Electricity cost calculator hub</Link></li>
            <li><Link href="/average-electricity-bill">Average electricity bill hub</Link></li>
            <li><Link href={`/electricity-price-per-kwh/${representativeState.slug}`}>Electricity price per kWh in {representativeState.name}</Link></li>
            <li><Link href={`/cost-to-run/refrigerator/${representativeState.slug}`}>Cost to run a refrigerator in {representativeState.name}</Link></li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Source & Method</h2>
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            Source:{" "}
            {sourceState.sourceUrl ? (
              <a href={sourceState.sourceUrl} rel="noopener noreferrer" target="_blank">
                {sourceState.sourceName}
              </a>
            ) : (
              sourceState.sourceName
            )}
            .{" "}
            {sourceState.updatedLabel
              ? `Last dataset period: ${sourceState.updatedLabel}.`
              : "Data period label is currently unavailable."}{" "}
            State usage values use benchmark modeling for side-by-side comparisons—they are not meant to match your exact
            utility meter totals.
          </p>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
