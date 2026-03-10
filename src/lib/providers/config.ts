import type { MonetizationPageType } from "@/lib/monetization/config";

export type ProviderType = "utility" | "retail-supplier" | "energy-service";

export type ProviderServiceCategory =
  | "electricity-plan-comparison"
  | "electricity-provider-marketplace"
  | "state-provider-listing"
  | "lead-generation"
  | "sponsored-provider-placement"
  | "regional-electricity-service"
  | "solar"
  | "storage"
  | "efficiency";

export type ProviderLeadGeneration = {
  mode: "redirect" | "internal-form" | "api-placeholder";
  endpoint?: string;
};

export type ProviderRecord = {
  id: string;
  enabled: boolean;
  name: string;
  providerType: ProviderType;
  supportedStates: "all" | string[];
  supportedServices: ProviderServiceCategory[];
  referralUrls: {
    default: string;
    byState?: Partial<Record<string, string>>;
  };
  leadGeneration?: ProviderLeadGeneration;
  sponsored: boolean;
  displayPriority: number;
  shortDescription: string;
  displayRules: {
    pageTypes: MonetizationPageType[];
    serviceCategories?: ProviderServiceCategory[];
  };
};

export type ProviderPageContext = {
  pageType: MonetizationPageType;
  state?: string;
  serviceCategory?: ProviderServiceCategory;
  includeSponsored?: boolean;
};

export const PROVIDER_SERVICE_LABELS: Record<ProviderServiceCategory, string> = {
  "electricity-plan-comparison": "Electricity plan comparison",
  "electricity-provider-marketplace": "Provider marketplace",
  "state-provider-listing": "State provider listing",
  "lead-generation": "Lead generation",
  "sponsored-provider-placement": "Sponsored placement",
  "regional-electricity-service": "Regional electricity service",
  solar: "Solar",
  storage: "Storage",
  efficiency: "Efficiency",
};

export const PROVIDERS: ProviderRecord[] = [
  {
    id: "marketplace-choice-platform",
    enabled: false,
    name: "Choice Marketplace Platform",
    providerType: "energy-service",
    supportedStates: ["connecticut", "illinois", "maryland", "new-jersey", "new-york", "ohio", "pennsylvania", "texas"],
    supportedServices: [
      "electricity-plan-comparison",
      "electricity-provider-marketplace",
      "state-provider-listing",
      "lead-generation",
    ],
    referralUrls: {
      default: "https://example.com/choice-marketplace",
    },
    leadGeneration: {
      mode: "redirect",
      endpoint: "https://example.com/choice-marketplace",
    },
    sponsored: false,
    displayPriority: 100,
    shortDescription: "Marketplace-style electricity plan comparison and lead routing platform.",
    displayRules: {
      pageTypes: [
        "state-authority",
        "provider-directory-index",
        "provider-directory-state",
        "longtail-state-price",
        "longtail-usage",
        "hub-state-detail",
        "hub-usage-detail",
        "calculator-state",
      ],
      serviceCategories: [
        "electricity-plan-comparison",
        "electricity-provider-marketplace",
        "lead-generation",
      ],
    },
  },
  {
    id: "regional-retail-supplier-network",
    enabled: false,
    name: "Regional Retail Supplier Network",
    providerType: "retail-supplier",
    supportedStates: ["illinois", "maryland", "massachusetts", "new-york", "ohio", "pennsylvania", "texas"],
    supportedServices: [
      "state-provider-listing",
      "lead-generation",
      "regional-electricity-service",
      "sponsored-provider-placement",
    ],
    referralUrls: {
      default: "https://example.com/regional-retail-supplier",
    },
    leadGeneration: {
      mode: "redirect",
      endpoint: "https://example.com/regional-retail-supplier",
    },
    sponsored: true,
    displayPriority: 80,
    shortDescription: "Sponsored retail supplier network for deregulated electricity markets.",
    displayRules: {
      pageTypes: [
        "state-authority",
        "provider-directory-index",
        "provider-directory-state",
        "hub-state-detail",
        "calculator-state",
      ],
      serviceCategories: [
        "state-provider-listing",
        "sponsored-provider-placement",
        "lead-generation",
      ],
    },
  },
  {
    id: "solar-storage-services",
    enabled: false,
    name: "Solar & Storage Services",
    providerType: "energy-service",
    supportedStates: ["arizona", "california", "florida", "nevada", "texas"],
    supportedServices: ["solar", "storage", "lead-generation"],
    referralUrls: {
      default: "https://example.com/solar-storage-services",
    },
    leadGeneration: {
      mode: "redirect",
      endpoint: "https://example.com/solar-storage-services",
    },
    sponsored: false,
    displayPriority: 70,
    shortDescription: "Solar and battery service referral program for high-intent residential energy users.",
    displayRules: {
      pageTypes: [
        "state-authority",
        "provider-directory-state",
        "longtail-state-price",
        "hub-state-detail",
        "calculator-state",
      ],
      serviceCategories: ["solar", "storage", "lead-generation"],
    },
  },
  {
    id: "efficiency-upgrade-services",
    enabled: false,
    name: "Efficiency Upgrade Services",
    providerType: "energy-service",
    supportedStates: "all",
    supportedServices: ["efficiency", "lead-generation"],
    referralUrls: {
      default: "https://example.com/efficiency-upgrades",
    },
    leadGeneration: {
      mode: "redirect",
      endpoint: "https://example.com/efficiency-upgrades",
    },
    sponsored: false,
    displayPriority: 60,
    shortDescription: "Home energy efficiency and bill-reduction service marketplace.",
    displayRules: {
      pageTypes: [
        "provider-directory-index",
        "longtail-state-trend",
        "longtail-usage",
        "hub-index",
        "hub-scenarios",
        "calculator-national",
        "calculator-state",
      ],
      serviceCategories: ["efficiency", "lead-generation"],
    },
  },
];
