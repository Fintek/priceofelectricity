import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs, { breadcrumbsToJsonLd, type BreadcrumbItem } from "@/components/navigation/Breadcrumbs";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildDatasetJsonLd, buildFaqPageJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import {
  ALL_IN_STATES,
  BUNDLED_ITEMIZED_STATES,
  HIDDEN_FEES_METHODOLOGY,
  ITEMIZED_STATES,
  computeBundledFindingRange,
  getLeadState,
} from "@/data/hidden-fees";
import FeeBreakdownTable from "./FeeBreakdownTable";
import AllInTable from "./AllInTable";

export const dynamic = "force-static";
export const revalidate = 86400;

const DATASET_JSON_PATH = "/datasets/hidden-electricity-fees.json";
const DATASET_CSV_PATH = "/datasets/hidden-electricity-fees.csv";

export const metadata: Metadata = buildMetadata({
  title: "Hidden Electricity Fees & Taxes by State | PriceOfElectricity.com",
  description:
    "Original analysis of the non-energy fees and taxes on residential electricity bills. See itemized utility charges, the real all-in cost per kWh by state, and our sources.",
  canonicalPath: "/hidden-electricity-fees",
});

function roundUsd(value: number): string {
  return `$${Math.round(value)}`;
}

function roundShare(value: number): string {
  return `${value.toFixed(1)}%`;
}

export default async function HiddenElectricityFeesPage() {
  const leadState = getLeadState();
  const range = computeBundledFindingRange();
  const method = HIDDEN_FEES_METHODOLOGY;
  const bundledCount = BUNDLED_ITEMIZED_STATES.length;
  const allInCount = ALL_IN_STATES.length;

  const faqItems = [
    {
      question: "How much of my electricity bill is not actually electricity?",
      answer: `It varies a lot by utility. Across the states we itemized, non-energy charges run from about ${roundUsd(
        range.minAddonUsd,
      )} a month (${roundShare(range.minSharePercent)} of the bill in ${range.minShareState}) up to about ${roundUsd(
        range.maxAddonUsd,
      )} a month. For ${leadState.state}'s ${leadState.utility}, fees and taxes are ${roundShare(
        leadState.nonEnergySharePercent ?? 0,
      )} of a 900 kWh bill — more than the energy itself.`,
    },
    {
      question: "What counts as a hidden fee on an electricity bill?",
      answer:
        "Everything except the energy you actually use: the fixed monthly customer charge, delivery and distribution, transmission, riders (efficiency, renewable, storm, wildfire, and bond-recovery charges), and taxes or franchise fees. These are real, recurring charges — they are just rarely shown as a single line.",
    },
    {
      question: "Which utility has the highest non-energy charges?",
      answer: `Among the states we itemized, ${leadState.state}'s ${leadState.utility} has the highest, at about ${roundUsd(
        leadState.nonEnergyAddonUsd ?? 0,
      )} a month in non-energy charges on a 900 kWh bill (${roundShare(
        leadState.nonEnergySharePercent ?? 0,
      )} of the total).`,
    },
    {
      question: "Why is PG&E's bill mostly fees and not energy?",
      answer: `PG&E's energy (generation) rate is only part of the story. Its delivery, transmission, wildfire, and bond-recovery riders blend to about 24.2\u00a2/kWh, and it charges a fixed monthly Base Services Charge. We model the standard ${method.caBaseChargeCallout.modeledTier} customer at $${method.caBaseChargeCallout.tier3StandardUsd.toFixed(
        2,
      )}/mo; lower-income customers pay $${method.caBaseChargeCallout.tier1CareFeraUsd.toFixed(
        2,
      )} (CARE/FERA) or $${method.caBaseChargeCallout.tier2Usd.toFixed(2)} a month.`,
    },
    {
      question: "Where does this fee data come from?",
      answer:
        "Three sources, cross-checked: each utility's published tariff or rate sheet for the itemized charges, the OpenEI Utility Rate Database (URDB) as an independent all-in check, and the U.S. Energy Information Administration (EIA) state average for reconciliation. Every figure is dated and linked to its source. We never estimate a fee we could not find.",
    },
  ];

  const breadcrumbTrail: BreadcrumbItem[] = [
    { name: "Home", url: "/" },
    { name: "Hidden Electricity Fees & Taxes" },
  ];
  const breadcrumbJsonLd = breadcrumbsToJsonLd(breadcrumbTrail);
  const webPageJsonLd = buildWebPageJsonLd({
    title: "Hidden Electricity Fees & Taxes by State",
    description:
      "Original analysis of non-energy fees and taxes on residential electricity bills, with itemized utility charges and the real all-in cost per kWh by state.",
    url: "/hidden-electricity-fees",
    dateModified: method.datasetLastUpdated,
    isPartOf: "/",
    about: ["hidden electricity fees", "electricity taxes by state", "non-energy charges", "all-in electricity cost"],
  });
  const datasetJsonLd = buildDatasetJsonLd({
    name: "Hidden Electricity Fees & Taxes by State",
    description:
      "Manually-curated dataset of residential non-energy electricity charges (fixed charges, delivery, transmission, riders, taxes) and validated all-in cost per kWh, modeled at 900 kWh per month, sourced from utility tariffs, OpenEI URDB, and EIA.",
    url: "/hidden-electricity-fees",
    dateModified: method.datasetLastUpdated,
    publisher: "PriceOfElectricity.com",
    distribution: [
      { contentUrl: DATASET_JSON_PATH, encodingFormat: "application/json" },
      { contentUrl: DATASET_CSV_PATH, encodingFormat: "text/csv" },
    ],
  });
  const faqPageJsonLd = buildFaqPageJsonLd(faqItems);

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd, datasetJsonLd, faqPageJsonLd]} />
      <main className="container">
        <Breadcrumbs trail={breadcrumbTrail} />

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Hidden Electricity Fees & Taxes by State</h1>
        <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 18, lineHeight: 1.6 }}>
          More than half your electricity bill may not be electricity at all.
        </p>

        <section style={{ marginBottom: 28 }}>
          <div
            style={{
              padding: 20,
              border: "1px solid var(--color-border, #e5e7eb)",
              borderRadius: 8,
              backgroundColor: "var(--color-surface-alt, #f9fafb)",
              maxWidth: "65ch",
            }}
          >
            <div className="muted" style={{ fontSize: 13, marginBottom: 4 }}>
              {leadState.state} &middot; {leadState.utility} &middot; as of {leadState.asOf}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}>
              {roundUsd(leadState.nonEnergyAddonUsd ?? 0)}/mo in fees & taxes
            </div>
            <div style={{ fontSize: 15, marginTop: 6 }}>
              That is {roundShare(leadState.nonEnergySharePercent ?? 0)} of a typical 900 kWh bill — the fees and
              taxes cost more than the electricity itself.
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, lineHeight: 1.7, maxWidth: "65ch" }}>
            When people compare electricity prices, they look at the energy rate — the cents per kWh for the power
            itself. But that is only part of the bill. Utilities also charge a fixed monthly fee, delivery and
            transmission charges, a stack of riders, and taxes. We pulled these apart from the published tariffs.
            Across the {bundledCount} states where we itemized every charge, the non-energy part of a 900 kWh bill
            runs from about {roundUsd(range.minAddonUsd)} a month ({roundShare(range.minSharePercent)} of the bill in{" "}
            {range.minShareState}) to about {roundUsd(range.maxAddonUsd)} a month, and from roughly{" "}
            {roundShare(range.minSharePercent)} up to {roundShare(range.maxSharePercent)} of the total bill in{" "}
            {range.maxShareState}. In other words, two homes using the same power can pay very different amounts once
            fees and taxes are counted.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 22, marginBottom: 8 }}>Itemized fee breakdown</h2>
          <p className="muted" style={{ margin: "0 0 16px 0", fontSize: 14, maxWidth: "65ch" }}>
            For these states we read each charge straight from the utility&apos;s tariff or rate sheet. Every row links
            to its source. Click any column heading to sort.
          </p>
          <FeeBreakdownTable rows={ITEMIZED_STATES} />
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 22, marginBottom: 8 }}>The real all-in cost of electricity, by state</h2>
          <p style={{ margin: "0 0 12px 0", lineHeight: 1.7, maxWidth: "65ch" }}>
            This is the cost of a kilowatt-hour including fees and taxes — not just the energy rate — for{" "}
            {allInCount} states we have validated so far. For the deeper question of how a state&apos;s rate is set and
            tracked over time, each state name links to its full electricity page.
          </p>
          <AllInTable rows={ALL_IN_STATES} />
          <p className="muted" style={{ margin: "12px 0 0 0", fontSize: 13, maxWidth: "65ch" }}>
            Looking for the standard energy-rate ranking or your average monthly bill? See the{" "}
            <Link href="/average-electricity-bill">average electricity bill hub</Link> and each{" "}
            <Link href="/electricity-cost">state electricity cost page</Link>. This page focuses only on the fees and
            taxes layered on top.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <div
            style={{
              padding: 16,
              border: "1px solid var(--color-border, #e5e7eb)",
              borderRadius: 8,
              backgroundColor: "var(--color-surface-alt, #f9fafb)",
              maxWidth: "70ch",
            }}
          >
            <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 8 }}>
              A note on California&apos;s PG&E charge
            </h2>
            <p style={{ margin: 0, lineHeight: 1.7 }}>{method.caBaseChargeCallout.note}</p>
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, marginBottom: 8 }}>How we measured this</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7, maxWidth: "70ch" }}>
            We triangulate three sources so no single one drives the result:
          </p>
          <ul style={{ margin: "0 0 16px 0", paddingLeft: 20, lineHeight: 1.8, maxWidth: "70ch" }}>
            {method.sources.map((source) => (
              <li key={source.name}>
                <strong>{source.name}.</strong> {source.role}
              </li>
            ))}
          </ul>
          <p style={{ lineHeight: 1.7, maxWidth: "70ch" }}>
            Every figure assumes a standard {method.usageBasisKwh} kWh per month so states can be compared on the same
            footing. Tiered per-kWh charges are blended to one effective rate for {method.usageBasisKwh} kWh rather
            than added together. Each modeled all-in rate is reconciled against the EIA state average and kept within{" "}
            &plusmn;{method.reconciliationTolerancePercent}% of it.
          </p>
          <p style={{ lineHeight: 1.7, maxWidth: "70ch" }}>
            <strong>What counts as non-energy:</strong> {method.nonEnergyDefinition}
          </p>
          <p style={{ lineHeight: 1.7, maxWidth: "70ch" }}>
            <strong>Confidence:</strong> a <em>high</em> rating means {method.confidenceDefinitions.high.toLowerCase()}{" "}
            A <em>medium</em> rating means {method.confidenceDefinitions.medium.toLowerCase()}
          </p>
          <p style={{ lineHeight: 1.7, maxWidth: "70ch" }}>
            <strong>Coverage and freshness:</strong> {method.coverageNote} The data was last updated{" "}
            {method.datasetLastUpdated}, and each row carries its own &ldquo;as of&rdquo; date. This is a manually
            curated, point-in-time dataset; it is not auto-refreshed. {method.excludedStatesNote} See our{" "}
            <Link href="/methodology/electricity-rates">rate methodology</Link> for how the underlying state averages
            are sourced.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>Download the data</h2>
          <p style={{ margin: "0 0 8px 0", lineHeight: 1.7 }}>
            The full dataset is free to download and cite:
          </p>
          <p style={{ margin: 0 }}>
            <a href={DATASET_CSV_PATH} download>
              hidden-electricity-fees.csv
            </a>
            {" \u00b7 "}
            <a href={DATASET_JSON_PATH} download>
              hidden-electricity-fees.json
            </a>
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Frequently asked questions</h2>
          <dl style={{ margin: 0 }}>
            {faqItems.map((item) => (
              <div key={item.question} style={{ marginBottom: 20 }}>
                <dt style={{ fontWeight: 600, marginBottom: 4 }}>{item.question}</dt>
                <dd style={{ margin: 0, lineHeight: 1.7, maxWidth: "70ch" }}>{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
