import type { StateRecord } from "@/data/types";
import { computeAffordability } from "@/lib/affordability";

export type QuestionTemplate = {
  slugPrefix: string;
  titleTemplate: (stateName: string) => string;
  descriptionTemplate: (stateName: string) => string;
  bodyBuilder: (state: QuestionStateContext) => string[];
};

type StateMap = Record<string, StateRecord>;

type QuestionStateContext = {
  slug: string;
  name: string;
  avgRateCentsPerKwh: number;
  affordabilityCategory: string;
  billAt900Kwh: number;
};

const ENERGY_ONLY_DISCLAIMER =
  "These estimates are energy-only and exclude delivery charges, fixed fees, taxes, and other utility line items.";

export const QUESTION_TEMPLATES: Record<string, QuestionTemplate> = {
  "why-electricity-expensive-in": {
    slugPrefix: "why-electricity-expensive-in",
    titleTemplate: (stateName) => `Why Is Electricity Expensive in ${stateName}?`,
    descriptionTemplate: (stateName) =>
      `Key reasons electricity prices can be high in ${stateName}, with a practical energy-only bill example.`,
    bodyBuilder: (state) => [
      `${state.name}'s average residential electricity rate is ${state.avgRateCentsPerKwh.toFixed(2)}¢/kWh, which places it in the "${state.affordabilityCategory}" affordability tier compared with other states.`,
      `At that average rate, 900 kWh of monthly usage works out to about $${state.billAt900Kwh.toFixed(2)} in energy charges before delivery and taxes.`,
      "Higher electricity prices are usually driven by a mix of generation costs, grid investment needs, local market structure, and regulatory cost recovery.",
      "Geography and reliability requirements can also raise costs, especially where weather hardening, wildfire mitigation, or fuel transport constraints increase utility spending.",
      ENERGY_ONLY_DISCLAIMER,
    ],
  },
  "why-electricity-cheaper-in": {
    slugPrefix: "why-electricity-cheaper-in",
    titleTemplate: (stateName) => `Why Is Electricity Cheaper in ${stateName}?`,
    descriptionTemplate: (stateName) =>
      `Why electricity costs can be relatively lower in ${stateName}, including an energy-only bill benchmark.`,
    bodyBuilder: (state) => [
      `${state.name}'s average residential electricity rate is ${state.avgRateCentsPerKwh.toFixed(2)}¢/kWh, and its affordability classification is "${state.affordabilityCategory}" relative to other states.`,
      `Using that average rate, 900 kWh corresponds to about $${state.billAt900Kwh.toFixed(2)} in monthly energy charges.`,
      "Lower electricity prices are often linked to lower-cost generation mix, efficient infrastructure utilization, and favorable local supply conditions.",
      "State policy design and utility cost structure can also influence affordability when fixed system costs are spread across more stable demand.",
      ENERGY_ONLY_DISCLAIMER,
    ],
  },
  "average-electric-bill-in": {
    slugPrefix: "average-electric-bill-in",
    titleTemplate: (stateName) => `How Much Is the Average Electric Bill in ${stateName}?`,
    descriptionTemplate: (stateName) =>
      `Estimated energy-only electric bill benchmark for ${stateName} using current average residential rates.`,
    bodyBuilder: (state) => [
      `${state.name}'s average residential electricity rate is ${state.avgRateCentsPerKwh.toFixed(2)}¢/kWh.`,
      `A simple benchmark at 900 kWh is about $${state.billAt900Kwh.toFixed(2)} per month for energy charges.`,
      `In relative terms, ${state.name} currently falls into the "${state.affordabilityCategory}" affordability category compared with other states.`,
      "Actual household bills can vary significantly based on monthly usage, seasonality, home efficiency, and local utility pricing structure.",
      ENERGY_ONLY_DISCLAIMER,
    ],
  },
};

export function parseQuestionSlug(slug: string): {
  template: QuestionTemplate;
  stateSlug: string;
} | null {
  for (const template of Object.values(QUESTION_TEMPLATES)) {
    const prefix = `${template.slugPrefix}-`;
    if (!slug.startsWith(prefix)) {
      continue;
    }
    const stateSlug = slug.slice(prefix.length);
    if (!stateSlug) {
      return null;
    }
    return { template, stateSlug };
  }
  return null;
}

export function getQuestionBodyContext(state: StateRecord, states: StateMap): QuestionStateContext {
  const affordabilityByState = Object.fromEntries(
    computeAffordability(states).map((entry) => [entry.slug, entry]),
  );
  const affordability = affordabilityByState[state.slug];

  return {
    slug: state.slug,
    name: state.name,
    avgRateCentsPerKwh: Number(state.avgRateCentsPerKwh),
    affordabilityCategory: affordability?.category ?? "Average",
    billAt900Kwh: (Number(state.avgRateCentsPerKwh) * 900) / 100,
  };
}

function topStateSlugsByRate(states: StateMap, direction: "high" | "low", count: number): string[] {
  return Object.values(states)
    .sort((a, b) =>
      direction === "high"
        ? b.avgRateCentsPerKwh - a.avgRateCentsPerKwh
        : a.avgRateCentsPerKwh - b.avgRateCentsPerKwh,
    )
    .slice(0, count)
    .map((state) => state.slug);
}

export function getQuestionSlugs(states: StateMap): string[] {
  const expensive = topStateSlugsByRate(states, "high", 10).map(
    (stateSlug) => `${QUESTION_TEMPLATES["why-electricity-expensive-in"].slugPrefix}-${stateSlug}`,
  );
  const cheaper = topStateSlugsByRate(states, "low", 10).map(
    (stateSlug) => `${QUESTION_TEMPLATES["why-electricity-cheaper-in"].slugPrefix}-${stateSlug}`,
  );
  const averageBill = Object.keys(states).map(
    (stateSlug) => `${QUESTION_TEMPLATES["average-electric-bill-in"].slugPrefix}-${stateSlug}`,
  );

  return [...new Set([...expensive, ...cheaper, ...averageBill])];
}
