import type { IndustrySlug } from "@/lib/longtail/industryConfig";

export type MonetizationPageType =
  | "state-authority"
  | "provider-directory-index"
  | "provider-directory-state"
  | "longtail-state-price"
  | "longtail-state-trend"
  | "longtail-usage"
  | "longtail-industry"
  | "hub-index"
  | "hub-state-index"
  | "hub-state-detail"
  | "hub-scenarios"
  | "hub-usage-index"
  | "hub-usage-detail"
  | "hub-industry-index"
  | "hub-industry-detail"
  | "hub-comparisons"
  | "calculator-national"
  | "calculator-state";

export type MonetizationBlockKind =
  | "provider-offers"
  | "plan-comparison"
  | "cta"
  | "lead-capture"
  | "affiliate-links";

export type MonetizationServiceType =
  | "electricity-provider-lead-generation"
  | "affiliate-partnership"
  | "energy-comparison-referral"
  | "calculator-lead-capture"
  | "sponsored-provider-placement"
  | "future-marketplace-integration";

export type MonetizationContext = {
  pageType: MonetizationPageType;
  state?: string;
  stateName?: string;
  usageKwh?: number;
  industry?: IndustrySlug;
};

export type MonetizationPartner = {
  id: string;
  enabled: boolean;
  name: string;
  serviceType: MonetizationServiceType;
  supportedStates: "all" | string[];
  landingUrls: {
    default: string;
    byState?: Partial<Record<string, string>>;
  };
  headline: string;
  description: string;
  ctaLabel: string;
  badges?: string[];
  disclosureLabel?: "affiliate" | "sponsored" | "lead";
  displayRules: {
    pageTypes: MonetizationPageType[];
    industries?: IndustrySlug[];
    minUsageKwh?: number;
    maxUsageKwh?: number;
  };
};

export type MonetizationPlacementConfig = {
  maxBlocks: number;
  blockKinds: MonetizationBlockKind[];
};

export const DEREGULATED_STATE_SLUGS = new Set([
  "connecticut",
  "delaware",
  "illinois",
  "maine",
  "maryland",
  "massachusetts",
  "new-hampshire",
  "new-jersey",
  "new-york",
  "ohio",
  "pennsylvania",
  "rhode-island",
  "texas",
]);

export const MONETIZATION_PARTNERS: MonetizationPartner[] = [
  {
    id: "state-plan-marketplace",
    enabled: false,
    name: "State Plan Marketplace",
    serviceType: "energy-comparison-referral",
    supportedStates: "all",
    landingUrls: {
      default: "https://example.com/compare-electricity",
    },
    headline: "Compare electricity plans from multiple providers",
    description:
      "Marketplace-style referral destination for residential plan comparison where plan choice is available.",
    ctaLabel: "Compare plans",
    badges: ["Referral partner"],
    disclosureLabel: "affiliate",
    displayRules: {
      pageTypes: [
        "state-authority",
        "longtail-state-price",
        "longtail-usage",
        "hub-state-detail",
        "hub-usage-detail",
        "calculator-state",
      ],
    },
  },
  {
    id: "home-energy-savings",
    enabled: false,
    name: "Home Energy Savings Network",
    serviceType: "affiliate-partnership",
    supportedStates: "all",
    landingUrls: {
      default: "https://example.com/home-energy-savings",
    },
    headline: "Lower usage with home energy upgrades",
    description:
      "Affiliate-style savings destination for audits, thermostat offers, and weatherization recommendations.",
    ctaLabel: "See savings options",
    badges: ["Affiliate"],
    disclosureLabel: "affiliate",
    displayRules: {
      pageTypes: [
        "state-authority",
        "longtail-state-trend",
        "longtail-usage",
        "hub-index",
        "hub-scenarios",
        "calculator-national",
        "calculator-state",
      ],
    },
  },
  {
    id: "solar-storage-referral",
    enabled: false,
    name: "Solar + Storage Referral",
    serviceType: "affiliate-partnership",
    supportedStates: ["arizona", "california", "florida", "nevada", "texas"],
    landingUrls: {
      default: "https://example.com/solar-storage",
    },
    headline: "Get matched with solar and battery options",
    description:
      "Referral destination for solar installation and storage quotes in higher-solar-potential states.",
    ctaLabel: "Compare solar quotes",
    badges: ["Affiliate"],
    disclosureLabel: "affiliate",
    displayRules: {
      pageTypes: [
        "state-authority",
        "longtail-state-price",
        "hub-state-detail",
        "calculator-state",
      ],
    },
  },
  {
    id: "commercial-energy-marketplace",
    enabled: false,
    name: "Commercial Energy Marketplace",
    serviceType: "future-marketplace-integration",
    supportedStates: "all",
    landingUrls: {
      default: "https://example.com/commercial-energy",
    },
    headline: "Request commercial electricity sourcing support",
    description:
      "Future marketplace integration for commercial load placement, power sourcing, and supplier introductions.",
    ctaLabel: "Request a commercial quote",
    badges: ["Future marketplace"],
    disclosureLabel: "lead",
    displayRules: {
      pageTypes: [
        "longtail-industry",
        "hub-industry-index",
        "hub-industry-detail",
      ],
      industries: ["ev-charging", "bitcoin-mining", "ai-data-centers", "data-centers"],
    },
  },
  {
    id: "featured-provider-placement",
    enabled: false,
    name: "Featured Provider Placement",
    serviceType: "sponsored-provider-placement",
    supportedStates: ["texas", "ohio", "pennsylvania"],
    landingUrls: {
      default: "https://example.com/featured-provider",
    },
    headline: "Featured sponsored electricity provider",
    description:
      "Sponsored provider placement for states with competitive retail electricity markets.",
    ctaLabel: "View provider",
    badges: ["Sponsored"],
    disclosureLabel: "sponsored",
    displayRules: {
      pageTypes: [
        "state-authority",
        "longtail-state-price",
        "hub-state-detail",
        "calculator-state",
      ],
    },
  },
];

export const MONETIZATION_PLACEMENTS: Record<MonetizationPageType, MonetizationPlacementConfig> = {
  "state-authority": {
    maxBlocks: 2,
    blockKinds: ["plan-comparison", "provider-offers", "lead-capture"],
  },
  "provider-directory-index": {
    maxBlocks: 1,
    blockKinds: ["cta"],
  },
  "provider-directory-state": {
    maxBlocks: 2,
    blockKinds: ["plan-comparison", "provider-offers"],
  },
  "longtail-state-price": {
    maxBlocks: 2,
    blockKinds: ["plan-comparison", "provider-offers"],
  },
  "longtail-state-trend": {
    maxBlocks: 2,
    blockKinds: ["cta", "affiliate-links"],
  },
  "longtail-usage": {
    maxBlocks: 2,
    blockKinds: ["plan-comparison", "lead-capture", "provider-offers"],
  },
  "longtail-industry": {
    maxBlocks: 2,
    blockKinds: ["cta", "affiliate-links"],
  },
  "hub-index": {
    maxBlocks: 1,
    blockKinds: ["cta"],
  },
  "hub-state-index": {
    maxBlocks: 1,
    blockKinds: ["cta"],
  },
  "hub-state-detail": {
    maxBlocks: 2,
    blockKinds: ["plan-comparison", "provider-offers"],
  },
  "hub-scenarios": {
    maxBlocks: 2,
    blockKinds: ["cta", "lead-capture"],
  },
  "hub-usage-index": {
    maxBlocks: 2,
    blockKinds: ["cta", "lead-capture"],
  },
  "hub-usage-detail": {
    maxBlocks: 2,
    blockKinds: ["plan-comparison", "lead-capture"],
  },
  "hub-industry-index": {
    maxBlocks: 2,
    blockKinds: ["cta", "affiliate-links"],
  },
  "hub-industry-detail": {
    maxBlocks: 2,
    blockKinds: ["cta", "affiliate-links"],
  },
  "hub-comparisons": {
    maxBlocks: 2,
    blockKinds: ["plan-comparison", "lead-capture"],
  },
  "calculator-national": {
    maxBlocks: 2,
    blockKinds: ["cta", "lead-capture"],
  },
  "calculator-state": {
    maxBlocks: 2,
    blockKinds: ["plan-comparison", "lead-capture", "provider-offers"],
  },
};
