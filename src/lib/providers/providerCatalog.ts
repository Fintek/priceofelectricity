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
    providerName: "Choice Marketplace",
    serviceStates: [
      "illinois",
      "new-jersey",
      "new-york",
      "pennsylvania",
      "texas",
    ],
    offerType: "marketplace",
    offerDescription:
      "Compare electricity plans from multiple providers in retail-choice states.",
    coverageAreaDescription:
      "Available in select deregulated states including Texas, New York, Pennsylvania, and more.",
    planTypeSummary:
      "Compare fixed-rate, variable-rate, and term-based residential plans.",
    featureHighlights: [
      "Compare plans across providers",
      "Fixed and variable rate options",
      "Available in multiple states",
    ],
    signupUrl: "https://example.com/choice-marketplace",
    trackingParams: {
      utm_source: "priceofelectricity",
      utm_medium: "referral",
      utm_campaign: "state-marketplace",
    },
    regulatoryNotes:
      "Availability varies by state. This is an informational referral, not utility enrollment.",
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
    providerName: "Northeast Energy Marketplace",
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
      "Compare electricity plans from providers in northeastern states with retail choice.",
    coverageAreaDescription:
      "Focused on northeastern states including Connecticut, Massachusetts, New York, and more.",
    planTypeSummary:
      "Browse residential plan options across common market structures in supported states.",
    featureHighlights: [
      "Northeast regional coverage",
      "Multiple provider options",
      "Residential plan comparison",
    ],
    signupUrl: "https://example.com/northeast-marketplace",
    trackingParams: {
      utm_source: "priceofelectricity",
      utm_medium: "referral",
      utm_campaign: "northeast-marketplace",
    },
    regulatoryNotes:
      "Offer availability varies by local market rules.",
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
    providerName: "Regional Energy Supplier",
    serviceStates: [
      "illinois",
      "ohio",
      "pennsylvania",
      "texas",
    ],
    offerType: "affiliate",
    offerDescription: "Explore electricity plan options in deregulated markets.",
    coverageAreaDescription:
      "Available in select midwest and northeast states with competitive electricity markets.",
    planTypeSummary:
      "Compare retail plan options in states where customers can choose their provider.",
    featureHighlights: [
      "Available in competitive markets",
      "Residential plan options",
      "State-specific coverage",
    ],
    signupUrl: "https://example.com/retail-supplier-affiliate",
    trackingParams: {
      utm_source: "priceofelectricity",
      utm_medium: "affiliate",
      utm_campaign: "supplier-offers",
    },
    regulatoryNotes:
      "Provider offers are not endorsements. Verify details with your local utility.",
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
    providerName: "Multi-State Energy Provider",
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
      "Compare electricity plans across multiple states with retail choice.",
    coverageAreaDescription:
      "Available in Illinois, New Jersey, New York, Ohio, Pennsylvania, and Texas.",
    planTypeSummary:
      "Fixed-rate and variable-rate residential plan options in eligible states.",
    featureHighlights: [
      "Available in 6+ states",
      "Fixed and variable rate plans",
      "Residential coverage",
    ],
    signupUrl: "https://example.com/multi-state-supplier",
    trackingParams: {
      utm_source: "priceofelectricity",
      utm_medium: "referral",
      utm_campaign: "supplier-expansion",
    },
    regulatoryNotes:
      "Plan terms and enrollment eligibility vary by state and utility territory.",
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
    providerName: "Home Energy Savings",
    serviceStates: ["ohio", "pennsylvania", "texas"],
    offerType: "affiliate",
    offerDescription: "Explore energy efficiency products and bill-savings options.",
    coverageAreaDescription:
      "Available in Ohio, Pennsylvania, and Texas.",
    planTypeSummary:
      "Energy efficiency and savings-focused options for residential customers.",
    featureHighlights: [
      "Energy efficiency products",
      "Bill reduction options",
      "Home energy savings",
    ],
    signupUrl: "https://example.com/energy-savings",
    trackingParams: {
      utm_source: "priceofelectricity",
      utm_medium: "affiliate",
      utm_campaign: "savings-products",
    },
    regulatoryNotes:
      "Projected savings are estimates and may not reflect individual utility tariff outcomes.",
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
