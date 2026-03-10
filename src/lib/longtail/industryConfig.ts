export const SUPPORTED_INDUSTRY_SLUGS = [
  "ev-charging",
  "bitcoin-mining",
  "ai-data-centers",
  "data-centers",
] as const;

export type IndustrySlug = (typeof SUPPORTED_INDUSTRY_SLUGS)[number];

export type IndustryConfig = {
  slug: IndustrySlug;
  displayName: string;
  shortLabel: string;
  introTemplate: (stateName: string) => string;
  assumptionsLabel: string;
  assumptionsNotes: string;
  monthlyUsageKwh: number;
  annualUsageKwh: number;
  framingBullets: string[];
};

const INDUSTRY_CONFIGS: Record<IndustrySlug, IndustryConfig> = {
  "ev-charging": {
    slug: "ev-charging",
    displayName: "EV Charging Electricity Cost",
    shortLabel: "EV charging",
    introTemplate: (stateName) =>
      `Estimate at-home EV charging electricity costs in ${stateName} using the latest statewide residential rate. This page provides example usage-based estimates for planning, not a utility bill quote.`,
    assumptionsLabel: "Example assumption for EV charging",
    assumptionsNotes:
      "Assumes approximately 300 kWh per month for charging. Actual usage depends on miles driven, vehicle efficiency, charging behavior, and climate.",
    monthlyUsageKwh: 300,
    annualUsageKwh: 3600,
    framingBullets: [
      "Useful for comparing home-charging economics by state",
      "Based on residential average rates from the existing dataset",
    ],
  },
  "bitcoin-mining": {
    slug: "bitcoin-mining",
    displayName: "Bitcoin Mining Electricity Cost",
    shortLabel: "Bitcoin mining",
    introTemplate: (stateName) =>
      `Estimate electricity cost exposure for Bitcoin mining in ${stateName} using statewide average residential rates. This provides illustrative operating-cost context, not profitability advice.`,
    assumptionsLabel: "Example assumption for mining load",
    assumptionsNotes:
      "Assumes a continuous 3 kW load (~2,160 kWh/month). Commercial tariffs, demand charges, and hosting contracts can materially change real-world costs.",
    monthlyUsageKwh: 2160,
    annualUsageKwh: 25920,
    framingBullets: [
      "Illustrative power-cost context for mining operators",
      "Use with caution: industrial/commercial rates may differ from residential averages",
    ],
  },
  "ai-data-centers": {
    slug: "ai-data-centers",
    displayName: "AI Data Center Electricity Cost",
    shortLabel: "AI data centers",
    introTemplate: (stateName) =>
      `Estimate AI data center electricity cost context in ${stateName} using statewide average rates. This page gives scenario-style estimates for planning and comparison.`,
    assumptionsLabel: "Example assumption for AI data center demand",
    assumptionsNotes:
      "Assumes a continuous 1 MW load (~730,000 kWh/month). Real AI workloads vary by utilization, cooling efficiency, and contract pricing.",
    monthlyUsageKwh: 730000,
    annualUsageKwh: 8760000,
    framingBullets: [
      "Scenario estimate to compare state-level cost exposure",
      "Not a replacement for utility tariff analysis or power procurement modeling",
    ],
  },
  "data-centers": {
    slug: "data-centers",
    displayName: "Data Center Electricity Cost",
    shortLabel: "data centers",
    introTemplate: (stateName) =>
      `Estimate data center electricity cost context in ${stateName} using statewide average residential rates as an illustrative proxy for comparative planning.`,
    assumptionsLabel: "Example assumption for data center demand",
    assumptionsNotes:
      "Assumes 250,000 kWh per month for a mid-scale facility scenario. Actual costs depend on load profile, demand charges, and negotiated utility rates.",
    monthlyUsageKwh: 250000,
    annualUsageKwh: 3000000,
    framingBullets: [
      "Comparative state-level electricity cost scenario",
      "For directional analysis, not contract-grade cost forecasting",
    ],
  },
};

export function isSupportedIndustrySlug(value: string): value is IndustrySlug {
  return SUPPORTED_INDUSTRY_SLUGS.includes(value as IndustrySlug);
}

export function getIndustryConfig(slug: IndustrySlug): IndustryConfig {
  return INDUSTRY_CONFIGS[slug];
}
