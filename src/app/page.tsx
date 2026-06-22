import type { Metadata } from "next";
import Link from "next/link";
import { STATES } from "@/data/states";
import HomepagePersonalization from "@/app/components/HomepagePersonalization";
import StateRateMap from "@/components/charts/StateRateMap";
import AboutThisSite from "@/components/navigation/AboutThisSite";
import EiaHomeTrustLine from "@/components/common/EiaHomeTrustLine";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import { getRateTier, getRateTierLabel } from "@/lib/insights";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildFaqPageJsonLd } from "@/lib/seo/jsonld";
import { getHomepageCoverageEntries } from "@/lib/stateDestinations";
import { SITE_URL } from "@/lib/site";
import { buildAllNormalizedStates } from "@/lib/stateBuilder";
import {
  getHighestState,
  getLowestState,
  getNationalAverage,
  getMedianRate,
  getStateCount,
  getTopNByRate,
  getBottomNByRate,
} from "@/lib/nationalStats";

export const dynamic = "force-static";
export const revalidate = 2592000;

// Standard usage matches AVERAGE_ELECTRICITY_BILL_USAGE_KWH in
// src/lib/longtail/averageBill.ts (also used by insights/stateBuilder). Kept as
// a local literal to avoid pulling the longtail bundle into the homepage.
const STANDARD_USAGE_KWH = 900;

function billAt900(rateCentsPerKwh: number): number {
  return (rateCentsPerKwh * STANDARD_USAGE_KWH) / 100;
}

function formatUsd(value: number): string {
  return `$${Math.round(value)}`;
}

function joinWithAnd(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

function buildHomepageDescription(): string {
  const lowest = getLowestState();
  const highest = getHighestState();
  const nationalAvg = getNationalAverage();
  return `Compare residential electricity prices across 50 states and DC. The state average is ${nationalAvg}¢/kWh — from ${lowest.avgRateCentsPerKwh}¢ in ${lowest.name} to ${highest.avgRateCentsPerKwh}¢ in ${highest.name}.`;
}

export const metadata: Metadata = buildMetadata({
  title: "Average Electricity Prices by State | PriceOfElectricity.com",
  description: buildHomepageDescription(),
  canonicalPath: "/",
});

export default function HomePage() {
  const coverageEntries = getHomepageCoverageEntries();
  const normalizedStates = buildAllNormalizedStates();
  const nationalAvg = getNationalAverage();
  const highest = getHighestState();
  const lowest = getLowestState();

  // ── Data-driven figures (all sourced from the EIA snapshot via nationalStats) ──
  const median = getMedianRate();
  const stateCount = getStateCount();
  const top5 = getTopNByRate(5);
  const bottom5 = getBottomNByRate(5);
  const allByRate = getTopNByRate(stateCount);
  const aboveAvgCount = allByRate.filter(
    (s) => s.avgRateCentsPerKwh > nationalAvg,
  ).length;
  const atOrBelowAvgCount = stateCount - aboveAvgCount;

  const lowestBill = billAt900(lowest.avgRateCentsPerKwh);
  const highestBill = billAt900(highest.avgRateCentsPerKwh);
  const avgBill = billAt900(nationalAvg);
  const medianBill = billAt900(median);
  const lowestAnnual = lowestBill * 12;
  const highestAnnual = highestBill * 12;
  const annualGap = highestAnnual - lowestAnnual;
  const billGap = Math.round(highestBill - lowestBill);
  const pctAboveAvg = Math.round(
    ((highest.avgRateCentsPerKwh - nationalAvg) / nationalAvg) * 100,
  );
  const pctLowestBelowAvg = Math.round(
    ((nationalAvg - lowest.avgRateCentsPerKwh) / nationalAvg) * 100,
  );
  const pctBillHigherVsLow = Math.round(
    ((highestBill - lowestBill) / lowestBill) * 100,
  );
  const spread = Math.round((highest.avgRateCentsPerKwh - lowest.avgRateCentsPerKwh) * 100) / 100;
  const medianGap = Math.round(Math.abs(nationalAvg - median) * 100) / 100;
  const medianVsAvgWord = median < nationalAvg ? "below" : "above";
  const mapCaption = `A kilowatt-hour costs about ${(highest.avgRateCentsPerKwh / lowest.avgRateCentsPerKwh).toFixed(1)}× more in ${highest.name} (${highest.avgRateCentsPerKwh}¢) than in ${lowest.name} (${lowest.avgRateCentsPerKwh}¢).`;

  const nextLowest = bottom5.slice(1);
  const nextHighest = top5.slice(1);
  const topFiveList = joinWithAnd(
    top5.map((s) => `${s.name} (${s.avgRateCentsPerKwh}¢)`),
  );
  const bottomFiveList = joinWithAnd(
    bottom5.map((s) => `${s.name} (${s.avgRateCentsPerKwh}¢)`),
  );

  // ── FAQ: identical answer text feeds both the visible section and the JSON-LD ──
  const faqContent: {
    question: string;
    answer: string;
    link: { href: string; label: string };
  }[] = [
    {
      question: "Which state has the cheapest electricity?",
      answer: `${lowest.name} has the cheapest electricity in the United States, at an average residential rate of ${lowest.avgRateCentsPerKwh}¢/kWh. That is about ${pctLowestBelowAvg}% below the ${nationalAvg}¢/kWh state average. The next-lowest rates are in ${joinWithAnd(
        nextLowest.map((s) => `${s.name} at ${s.avgRateCentsPerKwh}¢`),
      )}. At ${STANDARD_USAGE_KWH} kWh a month, a typical estimated electricity bill in ${lowest.name} is about ${formatUsd(lowestBill)} at the all-in average rate.`,
      link: { href: "/compare", label: "Compare any two states" },
    },
    {
      question: "Which state has the most expensive electricity?",
      answer: `${highest.name} has the most expensive electricity, at an average residential rate of ${highest.avgRateCentsPerKwh}¢/kWh — about ${pctAboveAvg}% above the ${nationalAvg}¢/kWh state average. Other high-cost states include ${joinWithAnd(
        nextHighest.map((s) => `${s.name} at ${s.avgRateCentsPerKwh}¢`),
      )}. At ${STANDARD_USAGE_KWH} kWh a month, a typical estimated electricity bill in ${highest.name} is about ${formatUsd(highestBill)} at the all-in average rate.`,
      link: { href: "/why-electricity-is-expensive", label: "Why electricity is expensive" },
    },
    {
      question: "What is the average electricity rate in the US?",
      answer: `The average state rate is ${nationalAvg}¢/kWh, and the median is ${median}¢/kWh across ${stateCount} jurisdictions. This is an unweighted average of state-level rates, not a consumption-weighted national figure. At ${STANDARD_USAGE_KWH} kWh a month, that average works out to about ${formatUsd(avgBill)} at the all-in average rate.`,
      link: { href: "/methodology/electricity-rates", label: "How rates are presented" },
    },
    {
      question: `Why is electricity so expensive in ${highest.name}?`,
      answer: `At ${highest.avgRateCentsPerKwh}¢/kWh, ${highest.name} sits about ${pctAboveAvg}% above the ${nationalAvg}¢/kWh state average. Fuel mix, distance from generation, grid upkeep, and state policy all push rates higher. A ${STANDARD_USAGE_KWH} kWh month there costs about ${formatUsd(highestBill)}, roughly ${formatUsd(billGap)} more than ${lowest.name}.`,
      link: { href: `/drivers/${highest.slug}`, label: `What drives prices in ${highest.name}` },
    },
  ];
  const faqItems = faqContent.map(({ question, answer }) => ({ question, answer }));

  const datasetJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Electricity Prices by State Dataset",
    description:
      "State electricity price dataset derived from build-time site data. State-level rates, national comparison, and momentum.",
    url: `${SITE_URL}/datasets/electricity-prices-by-state`,
    distribution: [
      { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${SITE_URL}/datasets/electricity-prices-by-state.json` },
      { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `${SITE_URL}/datasets/electricity-prices-by-state.csv` },
    ],
  };
  const faqJsonLd = buildFaqPageJsonLd(faqItems);

  const cellLeft = { textAlign: "left" as const, padding: "8px 12px", borderBottom: "1px solid var(--color-border)" };
  const cellRight = { textAlign: "right" as const, padding: "8px 12px", borderBottom: "1px solid var(--color-border)", whiteSpace: "nowrap" as const };

  return (
    <main className="container">
      <JsonLdScript data={[datasetJsonLd, faqJsonLd]} />

      {/* ── HERO ── */}
      <h1>Average Electricity Prices by State</h1>
      <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "60ch", lineHeight: 1.6 }}>
        Compare residential electricity rates across all 50 states and Washington, D.C., estimate your monthly bill, and see how your state ranks.
      </p>
      <EiaHomeTrustLine />

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>US electricity rates at a glance</h2>
        <StateRateMap
          states={normalizedStates.map(({ slug, name, avgRateCentsPerKwh }) => ({
            slug,
            name,
            avgRateCentsPerKwh,
          }))}
          nationalAverage={nationalAvg}
          linkStates
          caption={mapCaption}
        />
      </section>

      {/* ── PRIMARY PATHWAYS ── */}
      <section style={{ marginBottom: 28 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <Link href="/compare" className="stat-card" style={{ textDecoration: "none", color: "inherit", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Compare States</div>
            <div className="stat-card-label">Side-by-side rate comparison</div>
          </Link>
          <Link href="/electricity-cost-calculator" className="stat-card" style={{ textDecoration: "none", color: "inherit", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Bill Calculator</div>
            <div className="stat-card-label">Estimate your monthly cost</div>
          </Link>
          <Link href="/electricity-bill-estimator" className="stat-card" style={{ textDecoration: "none", color: "inherit", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Bill Estimator</div>
            <div className="stat-card-label">Household-specific estimates</div>
          </Link>
          <Link href="/electricity-cost" className="stat-card" style={{ textDecoration: "none", color: "inherit", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Cost by State</div>
            <div className="stat-card-label">Detailed state cost data</div>
          </Link>
        </div>
      </section>

      <HomepagePersonalization
        statesMap={Object.fromEntries(
          Object.entries(STATES).map(([k, v]) => [k, v.name])
        )}
      />

      {/* ── STATE RATE TABLE ── */}
      <section>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Electricity prices by state</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <caption style={{ textAlign: "left", captionSide: "top", marginBottom: 12, color: "var(--color-muted)", fontSize: "var(--font-size-sm)" }}>
              Average residential electricity price and estimated monthly bill for all 50 states and Washington, D.C., from the latest EIA snapshot. Bills assume {STANDARD_USAGE_KWH} kWh per month.
            </caption>
            <thead>
              <tr>
                <th scope="col" style={cellLeft}>State</th>
                <th scope="col" style={cellRight}>Avg rate (¢/kWh)</th>
                <th scope="col" style={cellRight}>Avg monthly bill ($)</th>
              </tr>
            </thead>
            <tbody>
              {coverageEntries.map((entry) => {
                const tier = getRateTier(entry.avgRateCentsPerKwh);
                return (
                  <tr key={entry.slug}>
                    <th scope="row" style={{ ...cellLeft, fontWeight: 500 }}>
                      <Link href={entry.href} prefetch={false}>{entry.label}</Link>
                    </th>
                    <td style={cellRight}>
                      {entry.avgRateCentsPerKwh}¢
                      <span className={`chip chip--${tier}`} style={{ marginLeft: 6 }}>
                        {getRateTierLabel(tier)}
                      </span>
                    </td>
                    <td style={cellRight}>{formatUsd(billAt900(entry.avgRateCentsPerKwh))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ marginTop: 8, fontSize: "var(--font-size-sm)" }}>
          Monthly bill uses the all-in average rate at {STANDARD_USAGE_KWH} kWh per month; separately billed taxes and fixed charges are not included.
        </p>
      </section>

      {/* ── CHEAPEST STATES ── */}
      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Cheapest states for electricity</h2>
        <p style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          {lowest.name} has the cheapest electricity in the country. Its average residential rate is {lowest.avgRateCentsPerKwh}¢/kWh. That sits about {pctLowestBelowAvg}% below the {nationalAvg}¢/kWh state average. At {STANDARD_USAGE_KWH} kWh a month, a typical estimated electricity bill there is about {formatUsd(lowestBill)}. Over a year, that is roughly {formatUsd(lowestAnnual)}. The next-lowest rates are in {joinWithAnd(nextLowest.map((s) => `${s.name} at ${s.avgRateCentsPerKwh}¢`))}. These states cluster near low-cost power. Many lean on hydro, natural gas, or local coal. Right now, {atOrBelowAvgCount} of {stateCount} jurisdictions sit at or below the {nationalAvg}¢/kWh average. The {stateCount}-jurisdiction median rate is {median}¢/kWh. The spread is wide: rates run from {lowest.avgRateCentsPerKwh}¢ up to {highest.avgRateCentsPerKwh}¢, a range of {spread}¢. On a {STANDARD_USAGE_KWH} kWh bill, that gap is about {formatUsd(billGap)} a month between {lowest.name} and {highest.name}. Lower rates leave more room for electric heat, water heating, and EV charging. Open any state page for its local rate, bill math, and trend. Use the{" "}
          <Link href="/compare">comparison tool</Link> to line up two states side by side. For the full state-by-state breakdown, see{" "}
          <Link href="/electricity-cost">electricity cost by state</Link>. To download the raw rates, visit the{" "}
          <Link href="/datasets/electricity-prices-by-state">dataset page</Link>.
        </p>
      </section>

      {/* ── MOST EXPENSIVE STATES ── */}
      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Most expensive states</h2>
        <p style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          {highest.name} has the most expensive electricity. Its average residential rate is {highest.avgRateCentsPerKwh}¢/kWh. That is about {pctAboveAvg}% above the {nationalAvg}¢/kWh state average. At {STANDARD_USAGE_KWH} kWh a month, a typical estimated electricity bill there costs about {formatUsd(highestBill)}. Over a year, that is roughly {formatUsd(highestAnnual)}. That is about {formatUsd(billGap)} more than {lowest.name}, the cheapest state, for the same use. In percentage terms, the {highest.name} bill is about {pctBillHigherVsLow}% higher than {lowest.name}&apos;s. Other high-cost states include {joinWithAnd(nextHighest.map((s) => `${s.name} at ${s.avgRateCentsPerKwh}¢`))}. Right now, {aboveAvgCount} of {stateCount} jurisdictions price above the {nationalAvg}¢/kWh average. High rates often track imported fuel and long delivery distances. Island and remote grids cost more to build and run. Storm recovery and state policy can add to bills too. The {stateCount}-jurisdiction median rate is {median}¢/kWh, far below the top. On a yearly basis, a {STANDARD_USAGE_KWH} kWh home in {highest.name} pays about {formatUsd(annualGap)} more than one in {lowest.name}. At the median rate, that same month costs about {formatUsd(medianBill)}. Read{" "}
          <Link href="/why-electricity-is-expensive">why electricity is expensive</Link> for the main drivers. See the drivers in {highest.name} on its{" "}
          <Link href={`/drivers/${highest.slug}`}>drivers page</Link>. The full ranking, highest to lowest, is on the{" "}
          <Link href="/compare">compare page</Link>.
        </p>
      </section>

      {/* ── TRENDING ── */}
      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>How electricity prices are trending</h2>
        <p style={{ maxWidth: "70ch", lineHeight: 1.6 }}>
          The current state average is {nationalAvg}¢/kWh. The median is {median}¢/kWh across {stateCount} jurisdictions, about {medianGap}¢ {medianVsAvgWord} the average. The gap between states is wide. Rates run from {lowest.avgRateCentsPerKwh}¢ in {lowest.name} to {highest.avgRateCentsPerKwh}¢ in {highest.name}. That is a spread of {spread}¢ from lowest to highest. On a {STANDARD_USAGE_KWH} kWh bill, the gap is about {formatUsd(billGap)} a month. A {STANDARD_USAGE_KWH} kWh month at the average rate costs about {formatUsd(avgBill)}, and about {formatUsd(medianBill)} at the median. Today, {aboveAvgCount} jurisdictions price above the average and {atOrBelowAvgCount} sit at or below it. The five priciest are {topFiveList}. The five cheapest are {bottomFiveList}. On a yearly basis, the gap between {highest.name} and {lowest.name} is about {formatUsd(annualGap)}. {lowest.name} runs about {pctLowestBelowAvg}% below the average, while {highest.name} runs about {pctAboveAvg}% above it. Most price pressure comes from fuel costs and grid upgrades. This page shows the latest complete EIA snapshot, not a forecast. For month-by-month movement, open{" "}
          <Link href="/electricity-trends">electricity trends</Link>. For longer swings and volatility, see{" "}
          <Link href="/electricity-inflation">electricity inflation</Link>. Those pages chart the data over time.
        </p>
      </section>

      {/* ── FAQ ── */}
      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Electricity price FAQs</h2>
        <dl style={{ margin: 0 }}>
          {faqContent.map((item) => (
            <div key={item.question} style={{ marginBottom: 20 }}>
              <dt style={{ fontWeight: 600, marginBottom: 4 }}>{item.question}</dt>
              <dd style={{ margin: 0, lineHeight: 1.6, maxWidth: "70ch" }}>
                {item.answer}{" "}
                <Link href={item.link.href} prefetch={false}>{item.link.label}</Link>.
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── EXPLORE MORE ── */}
      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 20, marginBottom: 20 }}>Explore more</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, fontSize: 14 }}>
          <div>
            <h3 style={{ margin: "0 0 6px", fontWeight: 600, fontSize: 14 }}>Analysis</h3>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 2 }}>
              <li><Link href="/electricity-trends">Trends</Link></li>
              <li><Link href="/electricity-insights">Insights</Link></li>
              <li><Link href="/electricity-affordability">Affordability</Link></li>
              <li><Link href="/electricity-inflation">Inflation &amp; volatility</Link></li>
            </ul>
          </div>
          <div>
            <h3 style={{ margin: "0 0 6px", fontWeight: 600, fontSize: 14 }}>Data</h3>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 2 }}>
              <li><Link href="/datasets">Download data</Link></li>
              <li><Link href="/methodology">Methodology</Link></li>
              <li><Link href="/knowledge">Knowledge</Link></li>
              <li><Link href="/research">Research</Link></li>
            </ul>
          </div>
          <div>
            <h3 style={{ margin: "0 0 6px", fontWeight: 600, fontSize: 14 }}>Tools</h3>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 2 }}>
              <li><Link href="/electricity-hubs">Explore hubs</Link></li>
              <li><Link href="/electricity-cost-comparison">State comparisons</Link></li>
              <li><Link href="/energy-comparison">Energy comparison</Link></li>
              <li><Link href="/electricity-topics">Topics</Link></li>
              <li><Link href="/about">About &amp; trust</Link></li>
            </ul>
          </div>
        </div>
      </section>

      <div style={{ paddingTop: 24 }}>
        <AboutThisSite
          title="About PriceOfElectricity.com"
          description="Independent electricity price data covering all 50 states and Washington, D.C. Methodology and downloadable datasets are published for verification."
          links={[
            { href: "/methodology", label: "Methodology" },
            { href: "/datasets", label: "Download data" },
            { href: "/electricity-data", label: "Electricity data" },
            { href: "/about", label: "About" },
          ]}
        />
      </div>
    </main>
  );
}
