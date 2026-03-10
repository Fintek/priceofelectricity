import { existsSync } from "node:fs";
import path from "node:path";
import { loadElectricityComparisonPairs } from "@/lib/knowledge/loadKnowledgePage";
import { SUPPORTED_INDUSTRY_SLUGS, type IndustrySlug } from "@/lib/longtail/industryConfig";
import {
  getActiveIndustrySlugs,
  getActiveUsageKwhTiers,
  isLongtailFamilyActive,
} from "@/lib/longtail/rollout";
import { LONGTAIL_USAGE_KWH_VALUES, type LongtailStateData, slugToName } from "@/lib/longtail/stateLongtail";

export type LongtailPageType =
  | "state-price"
  | "state-trend"
  | "usage-cost"
  | "industry-cost"
  | "average-bill"
  | "appliance-cost";

export type LongtailRelatedLinkItem = {
  href: string;
  label: string;
  description?: string;
};

export type LongtailRelatedLinkSection = {
  title: string;
  links: LongtailRelatedLinkItem[];
};

type BuildLinkSectionsInput = {
  pageType: LongtailPageType;
  stateData: LongtailStateData;
  usageKwh?: number;
  industry?: IndustrySlug;
  maxLinksPerSection?: number;
};

const ROUTE_FILE_CANDIDATES = {
  stateHome: [path.join("src", "app", "[state]", "page.tsx")],
  statePricePerKwh: [path.join("src", "app", "electricity-price-per-kwh", "[state]", "page.tsx")],
  stateTrend: [path.join("src", "app", "electricity-price-trend", "[state]", "page.tsx")],
  usageCost: [path.join("src", "app", "electricity-usage-cost", "[kwh]", "[state]", "page.tsx")],
  averageBill: [path.join("src", "app", "average-electricity-bill", "[slug]", "page.tsx")],
  history: [path.join("src", "app", "electricity-price-history", "[slug]", "page.tsx")],
  calculator: [path.join("src", "app", "electricity-cost-calculator", "[slug]", "page.tsx")],
  coreCost: [path.join("src", "app", "electricity-cost", "[slug]", "page.tsx")],
  authorityKnowledge: [path.join("src", "app", "knowledge", "state", "[slug]", "page.tsx")],
  providerPage: [path.join("src", "app", "electricity-providers", "[slug]", "page.tsx")],
  usageInfoHub: [path.join("src", "app", "electricity-usage", "page.tsx")],
  usageInfoState: [path.join("src", "app", "electricity-usage", "[state]", "page.tsx")],
  compareHub: [path.join("src", "app", "compare", "page.tsx")],
  compareCostFamily: [path.join("src", "app", "electricity-cost-comparison", "[pair]", "page.tsx")],
  inflation: [path.join("src", "app", "electricity-inflation", "[slug]", "page.tsx")],
  volatility: [path.join("src", "app", "electricity-price-volatility", "[slug]", "page.tsx")],
  drivers: [path.join("src", "app", "drivers", "[state]", "page.tsx")],
  industryCost: [path.join("src", "app", "industry-electricity-cost", "[industry]", "[state]", "page.tsx")],
  hubIndex: [path.join("src", "app", "electricity-hubs", "page.tsx")],
  hubStates: [path.join("src", "app", "electricity-hubs", "states", "page.tsx")],
  hubStateDetail: [path.join("src", "app", "electricity-hubs", "states", "[state]", "page.tsx")],
  hubScenarios: [path.join("src", "app", "electricity-hubs", "scenarios", "page.tsx")],
  hubUsage: [path.join("src", "app", "electricity-hubs", "usage", "page.tsx")],
  hubUsageDetail: [path.join("src", "app", "electricity-hubs", "usage", "[kwh]", "page.tsx")],
  hubIndustry: [path.join("src", "app", "electricity-hubs", "industry", "page.tsx")],
  hubIndustryDetail: [path.join("src", "app", "electricity-hubs", "industry", "[industry]", "page.tsx")],
  hubComparisons: [path.join("src", "app", "electricity-hubs", "comparisons", "page.tsx")],
} as const;

function hasRoute(routeKey: keyof typeof ROUTE_FILE_CANDIDATES): boolean {
  const base = process.cwd();
  return ROUTE_FILE_CANDIDATES[routeKey].some((candidate) => existsSync(path.join(base, candidate)));
}

function selectVariant(keySeed: string, variants: string[]): string {
  if (variants.length === 0) return "";
  const hash = Array.from(keySeed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return variants[hash % variants.length];
}

function dedupeLinks(links: LongtailRelatedLinkItem[]): LongtailRelatedLinkItem[] {
  const seen = new Set<string>();
  return links.filter((link) => {
    if (seen.has(link.href)) return false;
    seen.add(link.href);
    return true;
  });
}

function capLinks(links: LongtailRelatedLinkItem[], max: number): LongtailRelatedLinkItem[] {
  return dedupeLinks(links).slice(0, max);
}

function buildStateCoreSection(stateData: LongtailStateData, pageType: LongtailPageType): LongtailRelatedLinkItem[] {
  const state = stateData.slug;
  const stateName = stateData.name;
  const links: LongtailRelatedLinkItem[] = [];

  if (hasRoute("statePricePerKwh") && isLongtailFamilyActive("state-price-per-kwh")) {
    links.push({
      href: `/electricity-price-per-kwh/${state}`,
      label: selectVariant(`${state}-${pageType}-price-per-kwh`, [
        `${stateName} electricity price per kWh`,
        `Average power price in ${stateName}`,
      ]),
      description: "Residential rate benchmark used in scenario estimates",
    });
  }
  if (hasRoute("stateHome")) {
    links.push({
      href: `/${state}`,
      label: selectVariant(`${state}-${pageType}-home`, [
        `${stateName} electricity overview`,
        `State electricity snapshot: ${stateName}`,
      ]),
      description: "Core authority page with statewide pricing context",
    });
  }
  if (hasRoute("coreCost")) {
    links.push({
      href: `/electricity-cost/${state}`,
      label: selectVariant(`${state}-${pageType}-core-cost`, [
        `Electricity cost in ${stateName}`,
        `${stateName} electricity cost analysis`,
      ]),
      description: "State-level cost, affordability, and value overview",
    });
  }
  if (hasRoute("averageBill")) {
    links.push({
      href: `/average-electricity-bill/${state}`,
      label: selectVariant(`${state}-${pageType}-avg-bill`, [
        `Average electricity bill in ${stateName}`,
        `${stateName} monthly electricity bill estimate`,
      ]),
      description: "Bill-focused context for household usage",
    });
  }
  if (hasRoute("authorityKnowledge")) {
    links.push({
      href: `/knowledge/state/${state}`,
      label: selectVariant(`${state}-${pageType}-knowledge`, [
        `Knowledge profile for ${stateName}`,
        `${stateName} data profile`,
      ]),
      description: "Machine-readable state profile and metrics",
    });
  }
  if (hasRoute("providerPage")) {
    links.push({
      href: `/electricity-providers/${state}`,
      label: selectVariant(`${state}-${pageType}-providers`, [
        `Electricity providers in ${stateName}`,
        `${stateName} provider context`,
      ]),
      description: "Provider and market-structure context for this state",
    });
  }
  if (hasRoute("usageInfoState")) {
    links.push({
      href: `/electricity-usage/${state}`,
      label: selectVariant(`${state}-${pageType}-usage-intel`, [
        `${stateName} electricity usage profile`,
        `Household electricity usage in ${stateName}`,
      ]),
      description: "Usage-centric context linking kWh consumption to cost outcomes",
    });
  }
  if (hasRoute("usageInfoHub")) {
    links.push({
      href: "/electricity-usage",
      label: "National electricity usage hub",
      description: "Household usage benchmarks, tiers, and usage intelligence pathways",
    });
  }

  return links;
}

function buildTrendSection(stateData: LongtailStateData): LongtailRelatedLinkItem[] {
  const state = stateData.slug;
  const stateName = stateData.name;
  const links: LongtailRelatedLinkItem[] = [];

  if (hasRoute("stateTrend") && isLongtailFamilyActive("state-price-trend")) {
    links.push({
      href: `/electricity-price-trend/${state}`,
      label: `Electricity price trend in ${stateName}`,
      description: "Monthly trend and 1Y/5Y movement",
    });
  }
  if (hasRoute("history")) {
    links.push({
      href: `/electricity-price-history/${state}`,
      label: selectVariant(`${state}-history`, [
        `${stateName} electricity price history`,
        `Historical electricity prices in ${stateName}`,
      ]),
      description: "Historical context and trend interpretation",
    });
  }
  if (hasRoute("inflation")) {
    links.push({
      href: `/electricity-inflation/${state}`,
      label: `Electricity inflation in ${stateName}`,
      description: "State electricity inflation analysis",
    });
  }
  if (hasRoute("volatility")) {
    links.push({
      href: `/electricity-price-volatility/${state}`,
      label: `${stateName} electricity price volatility`,
      description: "Volatility and rate movement profile",
    });
  }

  return links;
}

function buildUsageSection(stateData: LongtailStateData, usageKwh?: number): LongtailRelatedLinkItem[] {
  const state = stateData.slug;
  const stateName = stateData.name;
  const links: LongtailRelatedLinkItem[] = [];

  if (!hasRoute("usageCost") || !isLongtailFamilyActive("usage-cost")) return links;

  const activeTiers = getActiveUsageKwhTiers();
  if (activeTiers.length === 0) return links;

  const preferredTiers =
    usageKwh == null
      ? activeTiers.slice(0, 3)
      : activeTiers
          .filter((tier) => tier !== usageKwh)
          .sort((a, b) => Math.abs(a - usageKwh) - Math.abs(b - usageKwh))
          .slice(0, 3);

  for (const tier of preferredTiers) {
    links.push({
      href: `/electricity-usage-cost/${tier}/${state}`,
      label: selectVariant(`${state}-${usageKwh ?? 0}-${tier}`, [
        `${tier.toLocaleString()} kWh cost in ${stateName}`,
        `Electricity cost for ${tier.toLocaleString()} kWh in ${stateName}`,
      ]),
      description: "Usage-tier estimate for the same state",
    });
  }

  if (hasRoute("calculator")) {
    links.push({
      href: `/electricity-cost-calculator/${state}`,
      label: selectVariant(`${state}-calculator`, [
        `${stateName} electricity cost calculator`,
        `Custom usage calculator for ${stateName}`,
      ]),
      description: "Custom kWh and scenario cost calculation",
    });
  }

  return links;
}

async function buildComparisonSection(stateData: LongtailStateData): Promise<LongtailRelatedLinkItem[]> {
  const state = stateData.slug;
  const stateName = stateData.name;
  const links: LongtailRelatedLinkItem[] = [];

  if (hasRoute("compareHub")) {
    links.push({
      href: "/compare",
      label: selectVariant(`${state}-compare-hub`, [
        `Compare ${stateName} with other states`,
        `${stateName} electricity comparisons`,
      ]),
      description: "State-to-state comparison hub",
    });
  }

  if (!hasRoute("compareCostFamily")) return links;

  const manifest = await loadElectricityComparisonPairs();
  const matchingPairs =
    manifest?.pairs
      .filter((pair) => pair.stateA === state || pair.stateB === state)
      .slice(0, 2) ?? [];

  for (const pair of matchingPairs) {
    const otherStateSlug = pair.stateA === state ? pair.stateB : pair.stateA;
    const otherName = slugToName(otherStateSlug);
    links.push({
      href: `/electricity-cost-comparison/${pair.pair}`,
      label: `${stateName} vs ${otherName} electricity cost`,
      description: "Head-to-head comparison page",
    });
  }

  return links;
}

function buildIndustryScenarioSection(
  stateData: LongtailStateData,
  currentIndustry?: IndustrySlug,
): LongtailRelatedLinkItem[] {
  if (!hasRoute("industryCost") || !isLongtailFamilyActive("industry-cost")) return [];
  const state = stateData.slug;
  const stateName = stateData.name;

  return getActiveIndustrySlugs().filter((industry) => industry !== currentIndustry)
    .slice(0, 3)
    .map((industry) => ({
      href: `/industry-electricity-cost/${industry}/${state}`,
      label: selectVariant(`${industry}-${state}`, [
        `${slugToName(industry.replace(/-/g, " "))} electricity cost in ${stateName}`,
        `${stateName} ${industry.replace(/-/g, " ")} electricity estimate`,
      ]),
      description: "Scenario-based industry electricity estimate",
    }));
}

function buildHubSection(
  stateData: LongtailStateData,
  usageKwh?: number,
  industry?: IndustrySlug,
): LongtailRelatedLinkItem[] {
  const links: LongtailRelatedLinkItem[] = [];

  if (hasRoute("hubStateDetail")) {
    links.push({
      href: `/electricity-hubs/states/${stateData.slug}`,
      label: `${stateData.name} electricity hub`,
      description: "Discovery hub for this state's price, usage, comparison, and tool pages",
    });
  }

  if (hasRoute("hubScenarios")) {
    links.push({
      href: "/electricity-hubs/scenarios",
      label: "Electricity cost scenario hub",
      description: "Entry point for residential and industry scenario pages",
    });
  }

  if (hasRoute("hubUsage")) {
    links.push({
      href: "/electricity-hubs/usage",
      label: "Electricity usage hubs",
      description: "Browse cost pages by common household usage tiers",
    });
  }

  if (usageKwh != null && hasRoute("hubUsageDetail") && getActiveUsageKwhTiers().includes(usageKwh)) {
    links.push({
      href: `/electricity-hubs/usage/${usageKwh}`,
      label: `${usageKwh.toLocaleString()} kWh electricity hub`,
      description: "See this same usage tier across multiple states",
    });
  }

  if (hasRoute("hubComparisons")) {
    links.push({
      href: "/electricity-hubs/comparisons",
      label: "Electricity comparison hub",
      description: "Explore state-vs-state electricity discovery pathways",
    });
  }

  if (hasRoute("hubIndustry") && isLongtailFamilyActive("industry-cost")) {
    links.push({
      href: "/electricity-hubs/industry",
      label: "Industry electricity cost hubs",
      description: "Browse state-level industry electricity scenario hubs",
    });
  }

  if (
    industry &&
    hasRoute("hubIndustryDetail") &&
    getActiveIndustrySlugs().includes(industry)
  ) {
    links.push({
      href: `/electricity-hubs/industry/${industry}`,
      label: `${slugToName(industry.replace(/-/g, " "))} hub`,
      description: "Compare this industry scenario across states",
    });
  }

  return links;
}

export async function buildLongtailLinkSections({
  pageType,
  stateData,
  usageKwh,
  industry,
  maxLinksPerSection = 6,
}: BuildLinkSectionsInput): Promise<LongtailRelatedLinkSection[]> {
  const sections: LongtailRelatedLinkSection[] = [];

  const coreLinks = capLinks(buildStateCoreSection(stateData, pageType), maxLinksPerSection);
  if (coreLinks.length > 0) {
    sections.push({
      title: `Related electricity pages for ${stateData.name}`,
      links: coreLinks,
    });
  }

  const trendLinks = capLinks(buildTrendSection(stateData), maxLinksPerSection);
  if (trendLinks.length > 0) {
    sections.push({
      title: "Historical and trend pages",
      links: trendLinks,
    });
  }

  const usageLinks = capLinks(buildUsageSection(stateData, usageKwh), maxLinksPerSection);
  if (usageLinks.length > 0) {
    sections.push({
      title: "More usage-based electricity cost pages",
      links: usageLinks,
    });
  }

  const compareLinks = capLinks(await buildComparisonSection(stateData), maxLinksPerSection);
  if (compareLinks.length > 0) {
    sections.push({
      title: `Compare ${stateData.name} electricity costs`,
      links: compareLinks,
    });
  }

  if (pageType === "industry-cost") {
    const industryLinks = capLinks(
      buildIndustryScenarioSection(stateData, industry),
      maxLinksPerSection,
    );
    if (industryLinks.length > 0) {
      sections.push({
        title: "Related industry electricity scenarios",
        links: industryLinks,
      });
    }
  }

  const hubLinks = capLinks(buildHubSection(stateData, usageKwh, industry), maxLinksPerSection);
  if (hubLinks.length > 0) {
    sections.push({
      title: "Discovery hubs",
      links: hubLinks,
    });
  }

  if (hasRoute("drivers")) {
    sections.push({
      title: "Consumer electricity cost tools",
      links: capLinks(
        [
          {
            href: `/drivers/${stateData.slug}`,
            label: `Price drivers in ${stateData.name}`,
            description: "Understand what influences state electricity prices",
          },
        ],
        maxLinksPerSection,
      ),
    });
  }

  return sections.filter((section) => section.links.length > 0);
}
