import Link from "next/link";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import KwhCostCalculator from "@/app/components/KwhCostCalculator";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import TrafficHubTemplate from "@/components/traffic-hubs/TrafficHubTemplate";
import { getRelease } from "@/lib/knowledge/fetch";
import {
  getUsageHubOverviewCards,
  loadAllTrafficHubStates,
  sortStatesByRate,
} from "@/lib/longtail/trafficHubs";
import { buildMetadata } from "@/lib/seo/metadata";
import {
  buildBreadcrumbListJsonLd,
  buildWebApplicationJsonLd,
  buildWebPageJsonLd,
} from "@/lib/seo/jsonld";
import { calculateUsageCost, formatRate, formatUsd } from "@/lib/usageCost";
import type { Metadata } from "next";

export const dynamic = "force-static";
export const revalidate = 86400;

const DEFAULT_KWH = 1000;

export const metadata: Metadata = buildMetadata({
  title: "kWh Cost Calculator — Electricity Usage Cost by State | PriceOfElectricity.com",
  description:
    "Free kWh cost calculator: enter any electricity usage in kWh and see estimated cost by state or U.S. average. Cost per kWh calculator using EIA residential rates.",
  canonicalPath: "/electricity-hubs/usage",
});

export default async function ElectricityUsageHubIndexPage() {
  const states = await loadAllTrafficHubStates();
  const usageCards = getUsageHubOverviewCards();
  const cheapestState = sortStatesByRate(states, "asc")[0];
  const priciestState = sortStatesByRate(states, "desc")[0];
  const nationalRate = states.find((s) => s.nationalAverageCentsPerKwh != null)?.nationalAverageCentsPerKwh ?? null;
  const referenceState = states[0];
  const nationalUpdatedLabel = referenceState?.updatedLabel ?? null;
  const nationalSourceName = referenceState?.sourceName ?? "U.S. Energy Information Administration (EIA)";
  const nationalSourceUrl = referenceState?.sourceUrl ?? null;

  const nationalDefaultCost = calculateUsageCost(nationalRate, DEFAULT_KWH);
  const cheapestDefaultCost = cheapestState
    ? calculateUsageCost(cheapestState.avgRateCentsPerKwh, DEFAULT_KWH)
    : null;
  const priciestDefaultCost = priciestState
    ? calculateUsageCost(priciestState.avgRateCentsPerKwh, DEFAULT_KWH)
    : null;

  const calculatorStates = states.map((s) => ({
    slug: s.slug,
    name: s.name,
    rateCentsPerKwh: s.avgRateCentsPerKwh,
    updatedLabel: s.updatedLabel,
    sourceName: s.sourceName,
    sourceUrl: s.sourceUrl,
  }));

  const defaultAnswerSentence =
    nationalRate != null && nationalDefaultCost != null && nationalUpdatedLabel
      ? `As of ${nationalUpdatedLabel}, ${DEFAULT_KWH.toLocaleString()} kWh costs about ${formatUsd(nationalDefaultCost)} at the U.S. average residential rate of ${formatRate(nationalRate)} (EIA).`
      : nationalRate != null && nationalDefaultCost != null
        ? `${DEFAULT_KWH.toLocaleString()} kWh costs about ${formatUsd(nationalDefaultCost)} at the U.S. average residential rate of ${formatRate(nationalRate)} (EIA).`
        : `Enter ${DEFAULT_KWH.toLocaleString()} kWh in the calculator below to estimate electricity cost using published state average rates.`;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Hubs", url: "/electricity-hubs" },
    { name: "kWh Cost Calculator", url: "/electricity-hubs/usage" },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: "kWh Cost Calculator",
    description:
      "Interactive kWh cost calculator and cost per kWh tool. Estimate electricity usage cost for any kWh amount by U.S. state using EIA residential average rates.",
    url: "/electricity-hubs/usage",
    isPartOf: "/",
    about: ["kwh cost calculator", "cost per kwh calculator", "kwh price calculator", "electricity usage cost"],
  });

  const webApplicationJsonLd = buildWebApplicationJsonLd({
    name: "kWh Cost Calculator",
    description:
      "Calculate estimated electricity cost for any kWh usage amount by U.S. state or national average using EIA residential rates.",
    url: "/electricity-hubs/usage",
  });

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd, webApplicationJsonLd]} />
      <TrafficHubTemplate
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Electricity Hubs", href: "/electricity-hubs" },
          { label: "kWh Cost Calculator" },
        ]}
        title="kWh Cost Calculator"
        intro="Use this cost per kWh calculator to estimate how much any electricity usage costs by state. Enter kWh, pick a state or U.S. average, and see the math — or browse fixed usage tiers below."
        stats={[
          { label: "Default example", value: `${DEFAULT_KWH.toLocaleString()} kWh` },
          { label: "States covered", value: String(states.length) },
          { label: "U.S. average rate", value: formatRate(nationalRate) },
        ]}
        monetizationContext={{ pageType: "hub-usage-index" }}
        sections={[
          {
            title: "Browse by electricity usage tier",
            intro:
              "These hubs link to state pages for common monthly kWh levels. For any other amount, use the calculator above.",
            cards: usageCards,
          },
          {
            title: "Related tools",
            intro: "Monthly bill estimates and rate detail pages use different intents — follow the links that match your question.",
            cards: [
              {
                href: "/electricity-cost-calculator",
                title: "Electricity bill calculator by state",
                description: "Estimate monthly electric bills by state with fixed usage scenarios and appliance tools.",
                eyebrow: "Bill calculator",
              },
              {
                href: "/average-electricity-bill",
                title: "Average electricity bill by state",
                description: "Compare typical monthly and annual residential electric bills across states.",
                eyebrow: "Bill benchmarks",
              },
            ],
          },
        ]}
      >
        <p
          style={{
            marginTop: 0,
            marginBottom: "var(--space-4)",
            maxWidth: "65ch",
            fontSize: 16,
            lineHeight: 1.6,
          }}
        >
          {defaultAnswerSentence}
        </p>

        <KwhCostCalculator
          states={calculatorStates}
          nationalRateCentsPerKwh={nationalRate}
          nationalUpdatedLabel={nationalUpdatedLabel}
          nationalSourceName={nationalSourceName}
          nationalSourceUrl={nationalSourceUrl}
          cheapest={{
            name: cheapestState?.name ?? "—",
            rateCentsPerKwh: cheapestState?.avgRateCentsPerKwh ?? null,
          }}
          mostExpensive={{
            name: priciestState?.name ?? "—",
            rateCentsPerKwh: priciestState?.avgRateCentsPerKwh ?? null,
          }}
          initialKwh={DEFAULT_KWH}
        />

        {cheapestState && priciestState && cheapestDefaultCost != null && priciestDefaultCost != null ? (
          <section style={{ marginBottom: "var(--space-7)" }}>
            <h2 className="heading-section">
              {DEFAULT_KWH.toLocaleString()} kWh cost snapshot (no JavaScript required)
            </h2>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Location</th>
                    <th scope="col">Average rate</th>
                    <th scope="col">{DEFAULT_KWH.toLocaleString()} kWh estimate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>U.S. average</td>
                    <td>{formatRate(nationalRate)}</td>
                    <td>{formatUsd(nationalDefaultCost)}</td>
                  </tr>
                  <tr>
                    <td>{cheapestState.name} (lowest state average)</td>
                    <td>{formatRate(cheapestState.avgRateCentsPerKwh)}</td>
                    <td>{formatUsd(cheapestDefaultCost)}</td>
                  </tr>
                  <tr>
                    <td>{priciestState.name} (highest state average)</td>
                    <td>{formatRate(priciestState.avgRateCentsPerKwh)}</td>
                    <td>{formatUsd(priciestDefaultCost)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        <p style={{ marginBottom: "var(--space-6)", maxWidth: "65ch", lineHeight: 1.7 }}>
          Looking for a monthly bill estimate by state? Use the{" "}
          <Link href="/electricity-cost-calculator">electricity bill calculator</Link>. For the price per kWh in a
          specific state, see <Link href="/electricity-price-per-kwh/texas">electricity price per kWh</Link> pages.
        </p>
      </TrafficHubTemplate>
      <div className="container">
        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </div>
    </>
  );
}
