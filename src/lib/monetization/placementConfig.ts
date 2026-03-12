import type { MonetizationContext } from "@/lib/monetization/config";

export type CommercialModuleType =
  | "provider-comparison"
  | "marketplace-cta"
  | "affiliate-link-block"
  | "educational-offer";

export type CommercialPlacementSlot = "inline-section" | "sidebar-module" | "footer-block";

export type CommercialPlacementModuleRule = {
  type: CommercialModuleType;
  enabled: boolean;
  priority: number;
  defaultSlot: CommercialPlacementSlot;
  optionalByDefault: boolean;
};

export type CommercialPageFamily =
  | "state-electricity-pages"
  | "city-electricity-pages"
  | "appliance-cost-pages"
  | "bill-estimator-pages"
  | "calculator-pages"
  | "energy-comparison-hub-pages"
  | "provider-marketplace-pages";

export type CommercialPlacementFamilyConfig = {
  enabled: boolean;
  modules: CommercialPlacementModuleRule[];
};

export const GLOBAL_COMMERCIAL_MODULES_ENABLED = true;

export const COMMERCIAL_PLACEMENT_CONFIG: Record<
  CommercialPageFamily,
  CommercialPlacementFamilyConfig
> = {
  "state-electricity-pages": {
    enabled: true,
    modules: [
      {
        type: "provider-comparison",
        enabled: true,
        priority: 10,
        defaultSlot: "inline-section",
        optionalByDefault: true,
      },
      {
        type: "marketplace-cta",
        enabled: true,
        priority: 20,
        defaultSlot: "inline-section",
        optionalByDefault: true,
      },
      {
        type: "educational-offer",
        enabled: false,
        priority: 30,
        defaultSlot: "footer-block",
        optionalByDefault: true,
      },
    ],
  },
  "city-electricity-pages": {
    enabled: true,
    modules: [
      {
        type: "educational-offer",
        enabled: false,
        priority: 10,
        defaultSlot: "footer-block",
        optionalByDefault: true,
      },
    ],
  },
  "appliance-cost-pages": {
    enabled: true,
    modules: [
      {
        type: "affiliate-link-block",
        enabled: false,
        priority: 10,
        defaultSlot: "inline-section",
        optionalByDefault: true,
      },
      {
        type: "educational-offer",
        enabled: false,
        priority: 20,
        defaultSlot: "footer-block",
        optionalByDefault: true,
      },
    ],
  },
  "bill-estimator-pages": {
    enabled: true,
    modules: [
      {
        type: "provider-comparison",
        enabled: true,
        priority: 10,
        defaultSlot: "inline-section",
        optionalByDefault: true,
      },
      {
        type: "educational-offer",
        enabled: true,
        priority: 20,
        defaultSlot: "inline-section",
        optionalByDefault: true,
      },
      {
        type: "marketplace-cta",
        enabled: true,
        priority: 30,
        defaultSlot: "footer-block",
        optionalByDefault: true,
      },
    ],
  },
  "calculator-pages": {
    enabled: true,
    modules: [
      {
        type: "educational-offer",
        enabled: false,
        priority: 10,
        defaultSlot: "inline-section",
        optionalByDefault: true,
      },
    ],
  },
  "energy-comparison-hub-pages": {
    enabled: true,
    modules: [
      {
        type: "marketplace-cta",
        enabled: true,
        priority: 10,
        defaultSlot: "footer-block",
        optionalByDefault: true,
      },
      {
        type: "provider-comparison",
        enabled: true,
        priority: 20,
        defaultSlot: "footer-block",
        optionalByDefault: true,
      },
    ],
  },
  "provider-marketplace-pages": {
    enabled: true,
    modules: [
      {
        type: "provider-comparison",
        enabled: true,
        priority: 10,
        defaultSlot: "inline-section",
        optionalByDefault: true,
      },
      {
        type: "marketplace-cta",
        enabled: true,
        priority: 20,
        defaultSlot: "footer-block",
        optionalByDefault: true,
      },
    ],
  },
};

export function getEnabledCommercialModuleRules(
  pageFamily: CommercialPageFamily,
): CommercialPlacementModuleRule[] {
  if (!GLOBAL_COMMERCIAL_MODULES_ENABLED) return [];
  const familyConfig = COMMERCIAL_PLACEMENT_CONFIG[pageFamily];
  if (!familyConfig?.enabled) return [];
  return familyConfig.modules
    .filter((module) => module.enabled)
    .sort((a, b) => a.priority - b.priority);
}

export function hasCommercialModulesEnabledForFamily(
  pageFamily: CommercialPageFamily,
): boolean {
  return getEnabledCommercialModuleRules(pageFamily).length > 0;
}

const PROVIDER_MODULE_TYPES: CommercialModuleType[] = [
  "provider-comparison",
  "marketplace-cta",
];

const PROVIDER_ALLOWED_FAMILIES = new Set<CommercialPageFamily>([
  "state-electricity-pages",
  "bill-estimator-pages",
  "energy-comparison-hub-pages",
  "appliance-cost-pages",
  "provider-marketplace-pages",
]);

export function isProviderModuleAllowedInFamily(
  pageFamily: CommercialPageFamily,
  moduleType: CommercialModuleType,
): boolean {
  if (!PROVIDER_MODULE_TYPES.includes(moduleType)) return true;
  return PROVIDER_ALLOWED_FAMILIES.has(pageFamily);
}

export function isProviderModuleType(moduleType: CommercialModuleType): boolean {
  return PROVIDER_MODULE_TYPES.includes(moduleType);
}

export function getDefaultMonetizationContextForFamily(
  pageFamily: CommercialPageFamily,
  partial: Omit<MonetizationContext, "pageType">,
): MonetizationContext {
  switch (pageFamily) {
    case "state-electricity-pages":
      return {
        pageType: "state-authority",
        ...partial,
      };
    case "city-electricity-pages":
      return {
        pageType: "longtail-usage",
        ...partial,
      };
    case "appliance-cost-pages":
      return {
        pageType: "longtail-usage",
        ...partial,
      };
    case "bill-estimator-pages":
      return {
        pageType: "longtail-usage",
        ...partial,
      };
    case "calculator-pages":
      return {
        pageType: partial.state ? "calculator-state" : "calculator-national",
        ...partial,
      };
    case "energy-comparison-hub-pages":
      return {
        pageType: "hub-comparisons",
        ...partial,
      };
    case "provider-marketplace-pages":
      return {
        pageType: "hub-comparisons",
        ...partial,
      };
    default:
      return {
        pageType: "hub-index",
        ...partial,
      };
  }
}
