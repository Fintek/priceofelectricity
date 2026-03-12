import type {
  CommercialModuleType,
  CommercialPageFamily,
} from "@/lib/monetization/placementConfig";
import { STATES } from "@/data/states";

export type ProviderRolloutTier =
  | "tier-1-pilot"
  | "tier-2-deregulated"
  | "tier-3-limited-marketplace"
  | "tier-4-informational-only";

export type ProviderPageFamilyRolloutStatus =
  | "allowed"
  | "restricted"
  | "permanently-blocked"
  | "future-review";

type ProviderTierConfig = {
  label: string;
  states: readonly string[];
  allowProviderModules: boolean;
  allowMarketplaceModules: boolean;
};

type ProviderPageFamilyRolloutPolicy = {
  status: ProviderPageFamilyRolloutStatus;
  allowProviderComparison: boolean;
  allowMarketplaceCta: boolean;
};

const TIER_1_PILOT_STATES = [
  "texas",
  "pennsylvania",
  "ohio",
] as const;

const TIER_2_DEREGULATED_STATES = [
  "illinois",
  "new-jersey",
  "new-york",
  "maryland",
  "connecticut",
  "massachusetts",
  "rhode-island",
  "delaware",
] as const;

const TIER_3_LIMITED_MARKETPLACE_STATES = [
  "maine",
  "new-hampshire",
] as const;

const TIER_4_INFORMATIONAL_ONLY_STATES = Object.keys(STATES)
  .filter((slug) => {
    return (
      !TIER_1_PILOT_STATES.includes(slug as (typeof TIER_1_PILOT_STATES)[number]) &&
      !TIER_2_DEREGULATED_STATES.includes(slug as (typeof TIER_2_DEREGULATED_STATES)[number]) &&
      !TIER_3_LIMITED_MARKETPLACE_STATES.includes(slug as (typeof TIER_3_LIMITED_MARKETPLACE_STATES)[number])
    );
  })
  .sort();

export const PROVIDER_STATE_TIER_CONFIG: Record<ProviderRolloutTier, ProviderTierConfig> = {
  "tier-1-pilot": {
    label: "Pilot states",
    states: TIER_1_PILOT_STATES,
    allowProviderModules: true,
    allowMarketplaceModules: true,
  },
  "tier-2-deregulated": {
    label: "Deregulated market expansion states",
    states: TIER_2_DEREGULATED_STATES,
    allowProviderModules: true,
    allowMarketplaceModules: true,
  },
  "tier-3-limited-marketplace": {
    label: "Limited marketplace states",
    states: TIER_3_LIMITED_MARKETPLACE_STATES,
    allowProviderModules: true,
    allowMarketplaceModules: false,
  },
  "tier-4-informational-only": {
    label: "Informational-only states",
    states: TIER_4_INFORMATIONAL_ONLY_STATES,
    allowProviderModules: false,
    allowMarketplaceModules: false,
  },
};

export const PROVIDER_PAGE_FAMILY_ROLLOUT_POLICY: Record<
  CommercialPageFamily,
  ProviderPageFamilyRolloutPolicy
> = {
  "state-electricity-pages": {
    status: "allowed",
    allowProviderComparison: true,
    allowMarketplaceCta: true,
  },
  "bill-estimator-pages": {
    status: "allowed",
    allowProviderComparison: true,
    allowMarketplaceCta: true,
  },
  "energy-comparison-hub-pages": {
    status: "allowed",
    allowProviderComparison: true,
    allowMarketplaceCta: true,
  },
  "provider-marketplace-pages": {
    status: "allowed",
    allowProviderComparison: true,
    allowMarketplaceCta: true,
  },
  "appliance-cost-pages": {
    status: "future-review",
    allowProviderComparison: false,
    allowMarketplaceCta: false,
  },
  "city-electricity-pages": {
    status: "permanently-blocked",
    allowProviderComparison: false,
    allowMarketplaceCta: false,
  },
  "calculator-pages": {
    status: "permanently-blocked",
    allowProviderComparison: false,
    allowMarketplaceCta: false,
  },
};

export function getProviderRolloutTierForState(state?: string): ProviderRolloutTier {
  if (!state) return "tier-4-informational-only";
  if (PROVIDER_STATE_TIER_CONFIG["tier-1-pilot"].states.includes(state)) return "tier-1-pilot";
  if (PROVIDER_STATE_TIER_CONFIG["tier-2-deregulated"].states.includes(state)) return "tier-2-deregulated";
  if (PROVIDER_STATE_TIER_CONFIG["tier-3-limited-marketplace"].states.includes(state)) {
    return "tier-3-limited-marketplace";
  }
  return "tier-4-informational-only";
}

function isMarketplaceModule(moduleType: CommercialModuleType): boolean {
  return moduleType === "marketplace-cta";
}

function isProviderComparisonModule(moduleType: CommercialModuleType): boolean {
  return moduleType === "provider-comparison";
}

export function isProviderFamilyAllowedByRolloutPlan(
  pageFamily: CommercialPageFamily,
  moduleType: CommercialModuleType,
): boolean {
  const familyPolicy = PROVIDER_PAGE_FAMILY_ROLLOUT_POLICY[pageFamily];
  if (!familyPolicy) return false;
  if (isProviderComparisonModule(moduleType)) return familyPolicy.allowProviderComparison;
  if (isMarketplaceModule(moduleType)) return familyPolicy.allowMarketplaceCta;
  return true;
}

export function isProviderStateAllowedByRolloutPlan(
  state: string | undefined,
  moduleType: CommercialModuleType,
): boolean {
  if (!state) return true;
  const tier = getProviderRolloutTierForState(state);
  const tierConfig = PROVIDER_STATE_TIER_CONFIG[tier];
  if (isMarketplaceModule(moduleType)) return tierConfig.allowMarketplaceModules;
  if (isProviderComparisonModule(moduleType)) return tierConfig.allowProviderModules;
  return true;
}

export function isProviderContextAllowedByRolloutPlan({
  state,
  pageFamily,
  moduleType,
}: {
  state?: string;
  pageFamily: CommercialPageFamily;
  moduleType: CommercialModuleType;
}): boolean {
  return (
    isProviderFamilyAllowedByRolloutPlan(pageFamily, moduleType) &&
    isProviderStateAllowedByRolloutPlan(state, moduleType)
  );
}

