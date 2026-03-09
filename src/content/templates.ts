import { buildNormalizedState, type NormalizedState } from "@/lib/stateBuilder";

export type ContentBlock = {
  heading: string;
  body: string;
};

export type ContentTemplate = {
  id: string;
  type: "question" | "guide" | "analysis";
  slugPattern: string;
  titleTemplate: string;
  descriptionTemplate: string;
  generate: (stateSlug: string) => {
    title: string;
    description: string;
    contentBlocks: ContentBlock[];
  };
};

/* eslint-disable-next-line @typescript-eslint/no-unused-vars -- utility for future template expansion */
function _stateName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function buildState(slug: string): NormalizedState {
  return buildNormalizedState(slug);
}

export const CONTENT_TEMPLATES: ContentTemplate[] = [
  {
    id: "average-electric-bill",
    type: "question",
    slugPattern: "average-electric-bill-in-{state}",
    titleTemplate: "Average Electric Bill in {State}",
    descriptionTemplate:
      "How much is the average electric bill in {State}? See current rates, example bills, and affordability context.",
    generate(stateSlug: string) {
      const s = buildState(stateSlug);
      const name = s.name;
      const bill1000 = s.exampleBills.find((b) => b.kwh === 1000);
      const monthly = bill1000
        ? `$${bill1000.estimated.toFixed(2)}`
        : `$${((s.avgRateCentsPerKwh * 1000) / 100).toFixed(2)}`;

      return {
        title: `Average Electric Bill in ${name}`,
        description: `How much is the average electric bill in ${name}? See current rates, example bills, and affordability context.`,
        contentBlocks: [
          {
            heading: `What is the average electric bill in ${name}?`,
            body: `The average residential electricity rate in ${name} is ${s.avgRateCentsPerKwh.toFixed(2)}¢/kWh as of ${s.updated}. At a typical usage of 1,000 kWh per month, the estimated energy-only charge is about ${monthly}.`,
          },
          {
            heading: "Example bills by usage",
            body: s.exampleBills
              .map(
                (b) =>
                  `${b.kwh.toLocaleString()} kWh → $${b.estimated.toFixed(2)}/month (energy only)`
              )
              .join("\n"),
          },
          {
            heading: "Affordability context",
            body: `${name} has an Electricity Affordability Index of ${s.affordabilityIndex} out of 100, placing it in the "${s.affordabilityCategory}" category. A higher score means electricity is more affordable relative to other states.`,
          },
          {
            heading: "Value Score™",
            body: `${name}'s Electricity Value Score™ is ${s.valueScore}, rated "${s.valueTier}". This composite score combines affordability, price position, and data freshness.`,
          },
          {
            heading: "Important disclaimer",
            body: s.disclaimer,
          },
        ],
      };
    },
  },

  {
    id: "is-electricity-expensive",
    type: "analysis",
    slugPattern: "is-electricity-expensive-in-{state}",
    titleTemplate: "Is Electricity Expensive in {State}?",
    descriptionTemplate:
      "Find out whether electricity is expensive in {State} compared to the national average, with rate tiers and affordability data.",
    generate(stateSlug: string) {
      const s = buildState(stateSlug);
      const name = s.name;
      const nationalApprox = 16.5;
      const diff = s.avgRateCentsPerKwh - nationalApprox;
      const comparison =
        diff > 2
          ? "above the national average"
          : diff < -2
            ? "below the national average"
            : "near the national average";

      return {
        title: `Is Electricity Expensive in ${name}?`,
        description: `Find out whether electricity is expensive in ${name} compared to the national average, with rate tiers and affordability data.`,
        contentBlocks: [
          {
            heading: `How ${name}'s rate compares`,
            body: `${name}'s average residential electricity rate is ${s.avgRateCentsPerKwh.toFixed(2)}¢/kWh, which is ${comparison}. The rate tier classification for ${name} is "${s.rateTierLabel}".`,
          },
          {
            heading: "Affordability Index",
            body: `With an Affordability Index of ${s.affordabilityIndex}/100, ${name} falls in the "${s.affordabilityCategory}" category. States scoring 80+ are considered very affordable; states below 20 are very expensive.`,
          },
          {
            heading: "What drives the price?",
            body: `Electricity prices vary by state due to fuel mix, generation infrastructure, regulatory environment, and seasonal demand. ${name}'s rate reflects these regional factors as reported by the source data.`,
          },
          {
            heading: "Monthly cost impact",
            body: s.exampleBills
              .map(
                (b) =>
                  `At ${b.kwh.toLocaleString()} kWh/month: ~$${b.estimated.toFixed(2)} (energy only)`
              )
              .join("\n"),
          },
          {
            heading: "Data freshness",
            body: `This data was ${s.freshnessLabel}. Freshness status: ${s.freshnessStatus}.`,
          },
        ],
      };
    },
  },

  {
    id: "moving-electricity-guide",
    type: "guide",
    slugPattern: "moving-to-{state}-electricity-cost-guide",
    titleTemplate: "Moving to {State}: Electricity Cost Guide",
    descriptionTemplate:
      "Planning a move to {State}? Learn what to expect for electricity costs, rates, plan types, and how {State} compares nationally.",
    generate(stateSlug: string) {
      const s = buildState(stateSlug);
      const name = s.name;
      const bill1000 = s.exampleBills.find((b) => b.kwh === 1000);
      const monthly = bill1000
        ? `$${bill1000.estimated.toFixed(2)}`
        : `$${((s.avgRateCentsPerKwh * 1000) / 100).toFixed(2)}`;

      return {
        title: `Moving to ${name}: Electricity Cost Guide`,
        description: `Planning a move to ${name}? Learn what to expect for electricity costs, rates, plan types, and how ${name} compares nationally.`,
        contentBlocks: [
          {
            heading: `Electricity rates in ${name}`,
            body: `The current average residential electricity rate in ${name} is ${s.avgRateCentsPerKwh.toFixed(2)}¢/kWh. For a household using 1,000 kWh per month, this translates to roughly ${monthly} in energy-only charges.`,
          },
          {
            heading: "How it compares nationally",
            body: `${name}'s Electricity Price Index is based on a national baseline of 100. The state's affordability category is "${s.affordabilityCategory}" with a score of ${s.affordabilityIndex}/100, and its Value Score™ is ${s.valueScore} ("${s.valueTier}").`,
          },
          {
            heading: "What plan types are available?",
            body: `Depending on ${name}'s regulatory structure, you may find fixed-rate, variable-rate, time-of-use, prepaid, or green energy plans. Availability varies by utility and location within the state.`,
          },
          {
            heading: "Utility setup tips",
            body: `When moving to ${name}, contact the local utility serving your address to set up service. Some areas allow you to choose your electricity provider. Check the state's utilities page for a list of major providers.`,
          },
          {
            heading: "Budget planning",
            body: s.exampleBills
              .map(
                (b) =>
                  `${b.kwh.toLocaleString()} kWh/month → ~$${b.estimated.toFixed(2)}`
              )
              .join("\n"),
          },
          {
            heading: "Disclaimer",
            body: s.disclaimer,
          },
        ],
      };
    },
  },
];
