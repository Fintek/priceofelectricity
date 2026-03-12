import type {
  CommercialModuleType,
  CommercialPageFamily,
} from "@/lib/monetization/placementConfig";

export type ProviderOfferType = "supplier" | "marketplace" | "affiliate";

export type ProviderCatalogEntry = {
  providerId: string;
  providerName: string;
  serviceStates: "all" | string[];
  offerType: ProviderOfferType;
  offerDescription: string;
  coverageAreaDescription: string;
  planTypeSummary: string;
  featureHighlights: string[];
  signupUrl: string;
  trackingParams?: Record<string, string>;
  regulatoryNotes?: string;
  enabled: boolean;
  allowedPageFamilies: CommercialPageFamily[];
  allowedModuleTypes: CommercialModuleType[];
  priority: number;
};

export const PROVIDER_CATALOG_VERSION = "2026-03-11";

export const PROVIDER_CATALOG: ProviderCatalogEntry[] = [
  {
    providerId: "pilot-choice-marketplace-sample",
    providerName: "Pilot Choice Marketplace (Sample)",
    serviceStates: [
      "illinois",
      "new-jersey",
      "new-york",
      "pennsylvania",
      "texas",
    ],
    offerType: "marketplace",
    offerDescription:
      "Pilot sample marketplace routing for electricity plan shopping in selected retail-choice states.",
    coverageAreaDescription:
      "Multi-state marketplace context focused on high-interest deregulated states in the current rollout set.",
    planTypeSummary:
      "Supports informational comparison pathways for fixed-rate, variable-rate, and term-based retail offers.",
    featureHighlights: [
      "Multi-state marketplace routing",
      "Plan comparison orientation",
      "Deterministic rollout eligibility",
    ],
    signupUrl: "https://example.com/choice-marketplace",
    trackingParams: {
      utm_source: "priceofelectricity",
      utm_medium: "referral",
      utm_campaign: "state-marketplace",
    },
    regulatoryNotes:
      "Pilot sample listing for controlled rollout. Availability varies by state utility-choice rules; this is informational referral placement, not utility enrollment.",
    enabled: true,
    allowedPageFamilies: [
      "state-electricity-pages",
      "bill-estimator-pages",
      "energy-comparison-hub-pages",
    ],
    allowedModuleTypes: ["provider-comparison", "marketplace-cta"],
    priority: 100,
  },
  {
    providerId: "pilot-northeast-marketplace-sample",
    providerName: "Pilot Northeast Marketplace (Sample)",
    serviceStates: [
      "connecticut",
      "delaware",
      "massachusetts",
      "new-jersey",
      "new-york",
      "rhode-island",
    ],
    offerType: "marketplace",
    offerDescription:
      "Pilot sample regional marketplace listing focused on northeastern retail-choice and comparison-shopping pathways.",
    coverageAreaDescription:
      "Regional northeast-focused marketplace footprint aligned with tiered rollout policy states.",
    planTypeSummary:
      "Highlights retail-choice plan shopping context for common residential market structures in supported states.",
    featureHighlights: [
      "Regional marketplace specialization",
      "Northeast coverage emphasis",
      "Comparison-hub compatible listing",
    ],
    signupUrl: "https://example.com/northeast-marketplace",
    trackingParams: {
      utm_source: "priceofelectricity",
      utm_medium: "referral",
      utm_campaign: "northeast-marketplace",
    },
    regulatoryNotes:
      "Pilot sample listing for controlled expansion. Offer availability and enrollment pathways vary by local market rules.",
    enabled: true,
    allowedPageFamilies: [
      "state-electricity-pages",
      "bill-estimator-pages",
      "energy-comparison-hub-pages",
    ],
    allowedModuleTypes: ["provider-comparison", "marketplace-cta"],
    priority: 96,
  },
  {
    providerId: "pilot-regional-supplier-sample",
    providerName: "Pilot Regional Supplier (Sample)",
    serviceStates: [
      "illinois",
      "ohio",
      "pennsylvania",
      "texas",
    ],
    offerType: "affiliate",
    offerDescription: "Pilot sample supplier-style referral for selected deregulated markets.",
    coverageAreaDescription:
      "Supplier-style referral context across selected midwest and northeast competitive electricity markets.",
    planTypeSummary:
      "Informational supplier referral context for state-scoped retail plan comparisons where customer choice exists.",
    featureHighlights: [
      "Supplier-style referral context",
      "State-targeted market coverage",
      "Commercial module compatibility",
    ],
    signupUrl: "https://example.com/retail-supplier-affiliate",
    trackingParams: {
      utm_source: "priceofelectricity",
      utm_medium: "affiliate",
      utm_campaign: "supplier-offers",
    },
    regulatoryNotes:
      "Pilot sample referral. Provider offers are not endorsements and should be verified against local utility and commission guidance.",
    enabled: true,
    allowedPageFamilies: [
      "state-electricity-pages",
      "bill-estimator-pages",
      "appliance-cost-pages",
      "energy-comparison-hub-pages",
    ],
    allowedModuleTypes: ["provider-comparison"],
    priority: 90,
  },
  {
    providerId: "pilot-multi-state-supplier-sample",
    providerName: "Pilot Multi-State Supplier (Sample)",
    serviceStates: [
      "illinois",
      "new-jersey",
      "new-york",
      "ohio",
      "pennsylvania",
      "texas",
    ],
    offerType: "supplier",
    offerDescription:
      "Pilot sample supplier listing for deterministic state-level provider comparison coverage.",
    coverageAreaDescription:
      "Broad multi-state supplier context designed for deterministic comparison coverage in active rollout states.",
    planTypeSummary:
      "Supports informational supplier comparisons for common fixed/variable plan categories in eligible states.",
    featureHighlights: [
      "Multi-state supplier context",
      "Deterministic ranking compatibility",
      "Comparison section friendly",
    ],
    signupUrl: "https://example.com/multi-state-supplier",
    trackingParams: {
      utm_source: "priceofelectricity",
      utm_medium: "referral",
      utm_campaign: "supplier-expansion",
    },
    regulatoryNotes:
      "Pilot sample supplier listing for informational marketplace discovery. Plan terms and enrollment eligibility vary by state and utility territory.",
    enabled: true,
    allowedPageFamilies: [
      "state-electricity-pages",
      "bill-estimator-pages",
      "energy-comparison-hub-pages",
    ],
    allowedModuleTypes: ["provider-comparison"],
    priority: 88,
  },
  {
    providerId: "pilot-efficiency-affiliate-sample",
    providerName: "Pilot Efficiency Affiliate (Sample)",
    serviceStates: ["ohio", "pennsylvania", "texas"],
    offerType: "affiliate",
    offerDescription: "Pilot sample affiliate pathway for energy efficiency and bill-savings products.",
    coverageAreaDescription:
      "State-scoped affiliate context concentrated on efficiency and savings pathways in active pilot states.",
    planTypeSummary:
      "Emphasizes informational savings pathways rather than direct utility tariffs or transactional quoting.",
    featureHighlights: [
      "Efficiency-oriented pathway",
      "Bill-savings educational context",
      "Supplemental provider differentiation",
    ],
    signupUrl: "https://example.com/energy-savings",
    trackingParams: {
      utm_source: "priceofelectricity",
      utm_medium: "affiliate",
      utm_campaign: "savings-products",
    },
    regulatoryNotes:
      "Pilot sample affiliate listing. Products and projected savings are scenario-based and may not reflect individual utility tariff outcomes.",
    enabled: true,
    allowedPageFamilies: [
      "state-electricity-pages",
      "bill-estimator-pages",
      "energy-comparison-hub-pages",
    ],
    allowedModuleTypes: ["provider-comparison", "marketplace-cta"],
    priority: 70,
  },
];

function providerNameStableSort(a: ProviderCatalogEntry, b: ProviderCatalogEntry): number {
  return a.providerName.localeCompare(b.providerName);
}

function priorityStableSort(a: ProviderCatalogEntry, b: ProviderCatalogEntry): number {
  const diff = b.priority - a.priority;
  if (diff !== 0) return diff;
  return providerNameStableSort(a, b);
}

export function supportsProviderState(entry: ProviderCatalogEntry, state?: string): boolean {
  if (entry.serviceStates === "all") return true;
  if (!state) return false;
  return entry.serviceStates.includes(state);
}

export function getEnabledProviderCatalogEntries(): ProviderCatalogEntry[] {
  return PROVIDER_CATALOG.filter((entry) => entry.enabled).sort(priorityStableSort);
}

export function getEnabledProviderCatalogEntriesForState(state: string): ProviderCatalogEntry[] {
  return getEnabledProviderCatalogEntries().filter((entry) => supportsProviderState(entry, state));
}

export function getProviderCatalogCoverageByState(): Map<string, ProviderCatalogEntry[]> {
  const byState = new Map<string, ProviderCatalogEntry[]>();
  for (const entry of getEnabledProviderCatalogEntries()) {
    if (entry.serviceStates === "all") continue;
    for (const state of entry.serviceStates) {
      const list = byState.get(state) ?? [];
      list.push(entry);
      byState.set(state, list);
    }
  }
  for (const [state, entries] of byState) {
    byState.set(state, [...entries].sort(priorityStableSort));
  }
  return byState;
}
