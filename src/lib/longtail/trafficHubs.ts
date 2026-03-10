import { loadElectricityComparisonPairs } from "@/lib/knowledge/loadKnowledgePage";
import { getIndustryConfig, isSupportedIndustrySlug, type IndustrySlug } from "@/lib/longtail/industryConfig";
import { FEATURED_APPLIANCE_SLUGS, getApplianceConfig } from "@/lib/longtail/applianceConfig";
import {
  getActiveIndustrySlugs,
  getActiveUsageKwhTiers,
  isLongtailFamilyActive,
} from "@/lib/longtail/rollout";
import {
  calculateUsageCost,
  formatRate,
  formatUsd,
  getLongtailStateStaticParams,
  loadLongtailStateData,
  slugToName,
  type LongtailStateData,
} from "@/lib/longtail/stateLongtail";

export type TrafficHubMetric = {
  label: string;
  value: string;
  hint?: string;
};

export type TrafficHubCard = {
  href: string;
  title: string;
  description: string;
  eyebrow?: string;
  meta?: string;
};

export type TrafficHubSection = {
  title: string;
  intro?: string;
  cards: TrafficHubCard[];
};

export async function loadAllTrafficHubStates(): Promise<LongtailStateData[]> {
  const states = await getLongtailStateStaticParams();
  const rows = await Promise.all(states.map(({ state }) => loadLongtailStateData(state)));
  return rows
    .filter((row): row is LongtailStateData => row != null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getTrafficHubStateStaticParams(): Promise<Array<{ state: string }>> {
  return getLongtailStateStaticParams();
}

export function getTrafficHubUsageStaticParams(): Array<{ kwh: string }> {
  return getActiveUsageKwhTiers().map((kwh) => ({ kwh: String(kwh) }));
}

export function getTrafficHubIndustryStaticParams(): Array<{ industry: string }> {
  return getActiveIndustrySlugs().map((industry) => ({ industry }));
}

export function parseTrafficHubUsageKwh(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return null;
  if (!getActiveUsageKwhTiers().includes(parsed)) return null;
  return parsed;
}

export function parseTrafficHubIndustry(value: string): IndustrySlug | null {
  if (!isSupportedIndustrySlug(value)) return null;
  if (!getActiveIndustrySlugs().includes(value)) return null;
  return value;
}

export function getUsageHubOverviewCards(): TrafficHubCard[] {
  return getActiveUsageKwhTiers().map((kwh) => ({
    href: `/electricity-hubs/usage/${kwh}`,
    title: `${kwh.toLocaleString()} kWh electricity usage hub`,
    description: `Browse state-by-state electricity cost pages for ${kwh.toLocaleString()} kWh usage and compare common residential scenarios.`,
    eyebrow: "Usage scenario",
  }));
}

export function getIndustryHubOverviewCards(): TrafficHubCard[] {
  return getActiveIndustrySlugs().map((industry) => {
    const config = getIndustryConfig(industry as IndustrySlug);
    return {
      href: `/electricity-hubs/industry/${industry}`,
      title: `${config.displayName} hub`,
      description: `Browse state-by-state scenario pages for ${config.shortLabel} electricity costs and related state electricity context.`,
      eyebrow: "Industry scenario",
      meta: `${config.monthlyUsageKwh.toLocaleString()} kWh/month example load`,
    };
  });
}

export function getStateHubDirectoryCards(
  states: LongtailStateData[],
  limit?: number,
): TrafficHubCard[] {
  const rows = typeof limit === "number" ? states.slice(0, limit) : states;
  return rows.map((state) => ({
    href: `/electricity-hubs/states/${state.slug}`,
    title: `${state.name} electricity hub`,
    description: `Explore price pages, usage scenarios, comparison pages, and calculator links for ${state.name}.`,
    eyebrow: "State hub",
    meta: `Current average rate: ${formatRate(state.avgRateCentsPerKwh)}`,
  }));
}

export function buildUsageTierCardsForStates(
  states: LongtailStateData[],
  kwh: number,
  limit?: number,
): TrafficHubCard[] {
  const rows = typeof limit === "number" ? states.slice(0, limit) : states;
  return rows.map((state) => ({
    href: `/electricity-usage-cost/${kwh}/${state.slug}`,
    title: `${kwh.toLocaleString()} kWh cost in ${state.name}`,
    description: `Usage-based energy cost estimate for ${kwh.toLocaleString()} kWh in ${state.name}.`,
    eyebrow: "Usage page",
    meta: formatUsd(calculateUsageCost(state.avgRateCentsPerKwh, kwh)),
  }));
}

export function buildIndustryCardsForStates(
  states: LongtailStateData[],
  industry: IndustrySlug,
  limit?: number,
): TrafficHubCard[] {
  const config = getIndustryConfig(industry);
  const rows = typeof limit === "number" ? states.slice(0, limit) : states;
  return rows.map((state) => ({
    href: `/industry-electricity-cost/${industry}/${state.slug}`,
    title: `${config.displayName} in ${state.name}`,
    description: `Scenario-based electricity estimate for ${config.shortLabel} in ${state.name}.`,
    eyebrow: "Industry page",
    meta: formatUsd(calculateUsageCost(state.avgRateCentsPerKwh, config.monthlyUsageKwh)),
  }));
}

export async function buildComparisonCardsForState(
  state: string,
  limit = 4,
): Promise<TrafficHubCard[]> {
  const manifest = await loadElectricityComparisonPairs();
  const pairs =
    manifest?.pairs.filter((pair) => pair.stateA === state || pair.stateB === state).slice(0, limit) ?? [];

  return pairs.map((pair) => {
    const otherState = pair.stateA === state ? pair.stateB : pair.stateA;
    return {
      href: `/electricity-cost-comparison/${pair.pair}`,
      title: `${slugToName(state)} vs ${slugToName(otherState)} electricity cost`,
      description: `Head-to-head electricity cost comparison between ${slugToName(state)} and ${slugToName(otherState)}.`,
      eyebrow: "Comparison page",
    };
  });
}

export async function buildFeaturedComparisonCards(limit = 12): Promise<TrafficHubCard[]> {
  const manifest = await loadElectricityComparisonPairs();
  const pairs = manifest?.pairs.slice(0, limit) ?? [];
  return pairs.map((pair) => ({
    href: `/electricity-cost-comparison/${pair.pair}`,
    title: `${slugToName(pair.stateA)} vs ${slugToName(pair.stateB)} electricity cost`,
    description: `Compare electricity prices and example household energy costs between ${slugToName(pair.stateA)} and ${slugToName(pair.stateB)}.`,
    eyebrow: "Comparison page",
  }));
}

export function sortStatesByRate(
  states: LongtailStateData[],
  direction: "asc" | "desc",
): LongtailStateData[] {
  return [...states].sort((a, b) => {
    const rateA = a.avgRateCentsPerKwh ?? (direction === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY);
    const rateB = b.avgRateCentsPerKwh ?? (direction === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY);
    return direction === "asc" ? rateA - rateB : rateB - rateA;
  });
}

export async function buildStateHubSections(stateData: LongtailStateData): Promise<TrafficHubSection[]> {
  const sections: TrafficHubSection[] = [];
  const usageTiers = getActiveUsageKwhTiers();
  const industrySlugs = getActiveIndustrySlugs();

  const coreCards: TrafficHubCard[] = [
    {
      href: `/${stateData.slug}`,
      title: `${stateData.name} electricity overview`,
      description: `Primary state authority page with current rate context, bill estimator, and statewide electricity information.`,
      eyebrow: "Authority page",
      meta: `Current average rate: ${formatRate(stateData.avgRateCentsPerKwh)}`,
    },
    {
      href: `/electricity-cost/${stateData.slug}`,
      title: `Electricity cost in ${stateData.name}`,
      description: `State-level electricity cost overview and affordability context for ${stateData.name}.`,
      eyebrow: "Authority page",
    },
    {
      href: `/electricity-cost-calculator/${stateData.slug}`,
      title: `${stateData.name} electricity cost calculator`,
      description: `Calculator for custom electricity usage and energy-only cost estimates in ${stateData.name}.`,
      eyebrow: "Tool",
    },
    {
      href: `/average-electricity-bill/${stateData.slug}`,
      title: `Average electricity bill in ${stateData.name}`,
      description: `Monthly and annual bill estimate using the site's standard residential usage assumption.`,
      eyebrow: "Authority page",
    },
    {
      href: `/electricity-usage/${stateData.slug}`,
      title: `Electricity usage in ${stateData.name}`,
      description: `State electricity usage profile with modeled household kWh context and links to cost scenarios.`,
      eyebrow: "Usage intelligence",
    },
    {
      href: `/electricity-providers/${stateData.slug}`,
      title: `Electricity providers in ${stateData.name}`,
      description: `Provider framework, market context, and future marketplace integration path for ${stateData.name}.`,
      eyebrow: "Authority page",
    },
  ];

  if (isLongtailFamilyActive("state-price-per-kwh")) {
    coreCards.unshift({
      href: `/electricity-price-per-kwh/${stateData.slug}`,
      title: `Electricity price per kWh in ${stateData.name}`,
      description: `Dedicated longtail rate page for current residential price per kWh in ${stateData.name}.`,
      eyebrow: "Longtail page",
    });
  }

  sections.push({
    title: `${stateData.name} core electricity pages`,
    intro: `Start here for the main state-level entry points, then branch into longtail scenario pages from this hub.`,
    cards: coreCards,
  });

  if (isLongtailFamilyActive("usage-cost") && usageTiers.length > 0) {
    sections.push({
      title: `${stateData.name} usage cost scenarios`,
      intro: `These pages estimate energy-only costs in ${stateData.name} for common monthly usage tiers.`,
      cards: usageTiers.map((kwh) => ({
        href: `/electricity-usage-cost/${kwh}/${stateData.slug}`,
        title: `${kwh.toLocaleString()} kWh cost in ${stateData.name}`,
        description: `See how much ${kwh.toLocaleString()} kWh costs at the current statewide residential rate.`,
        eyebrow: "Longtail page",
        meta: formatUsd(calculateUsageCost(stateData.avgRateCentsPerKwh, kwh)),
      })),
    });
  }

  sections.push({
    title: `${stateData.name} appliance electricity cost pages`,
    intro: `These appliance pages turn the statewide residential electricity rate into everyday operating-cost examples for common household equipment.`,
    cards: FEATURED_APPLIANCE_SLUGS.map((slug) => {
      const appliance = getApplianceConfig(slug);
      return {
        href: `/cost-to-run/${slug}/${stateData.slug}`,
        title: `${appliance.displayName} cost in ${stateData.name}`,
        description: `Estimated hourly, daily, monthly, and yearly electricity cost for a typical ${appliance.displayName.toLowerCase()} in ${stateData.name}.`,
        eyebrow: "Longtail page",
        meta: `${appliance.averageWattage.toLocaleString()} W assumption`,
      };
    }),
  });

  if (isLongtailFamilyActive("state-price-trend")) {
    sections.push({
      title: `${stateData.name} historical rate pages`,
      intro: `Use these pages to understand how current rates compare with longer-term pricing movement.`,
      cards: [
        {
          href: `/electricity-price-trend/${stateData.slug}`,
          title: `Electricity price trend in ${stateData.name}`,
          description: `Monthly trend page with 1-year and 5-year change context for ${stateData.name}.`,
          eyebrow: "Longtail page",
        },
        {
          href: `/electricity-price-history/${stateData.slug}`,
          title: `${stateData.name} electricity price history`,
          description: `Historical electricity price page for deeper context and trend interpretation.`,
          eyebrow: "Authority page",
        },
        {
          href: `/electricity-inflation/${stateData.slug}`,
          title: `Electricity inflation in ${stateData.name}`,
          description: `Inflation-oriented context for how electricity costs have changed in ${stateData.name}.`,
          eyebrow: "Authority page",
        },
      ],
    });
  }

  const comparisonCards = await buildComparisonCardsForState(stateData.slug, 4);
  sections.push({
    title: `Compare ${stateData.name} with other states`,
    intro: `These pages help users move from a single-state lookup into broader electricity cost comparisons.`,
    cards: [
      {
        href: "/compare",
        title: "Compare electricity prices by state",
        description: "Primary comparison authority page with sortable state-by-state rate and example bill data.",
        eyebrow: "Authority page",
      },
      ...comparisonCards,
    ],
  });

  if (isLongtailFamilyActive("industry-cost") && industrySlugs.length > 0) {
    sections.push({
      title: `${stateData.name} industry electricity scenarios`,
      intro: `Scenario pages for business and infrastructure loads using the site's existing state electricity dataset.`,
      cards: industrySlugs.map((industry) => {
        const config = getIndustryConfig(industry as IndustrySlug);
        return {
          href: `/industry-electricity-cost/${industry}/${stateData.slug}`,
          title: `${config.displayName} in ${stateData.name}`,
          description: `Scenario-based electricity estimate for ${config.shortLabel} in ${stateData.name}.`,
          eyebrow: "Longtail page",
          meta: `${config.monthlyUsageKwh.toLocaleString()} kWh/month example`,
        };
      }),
    });
  }

  sections.push({
    title: "More discovery hubs",
    intro: "Use these hub pages to continue exploring the longtail inventory from a broader angle.",
    cards: [
      {
        href: "/electricity-hubs/scenarios",
        title: "Electricity cost scenario hub",
        description: "Overview of the site's residential and industry cost scenarios.",
        eyebrow: "Traffic hub",
      },
      {
        href: "/electricity-hubs/usage",
        title: "Electricity usage hubs",
        description: "Browse usage-based electricity hubs by common kWh tiers.",
        eyebrow: "Traffic hub",
      },
      {
        href: "/electricity-hubs/comparisons",
        title: "Electricity comparison hub",
        description: "Structured entry point into state-vs-state electricity price comparisons.",
        eyebrow: "Traffic hub",
      },
    ],
  });

  return sections.filter((section) => section.cards.length > 0);
}

