import type {
  CommercialModuleType,
  CommercialPageFamily,
} from "@/lib/monetization/placementConfig";

type ProviderPilotConfig = {
  enabled: boolean;
  allowedFamilies: CommercialPageFamily[];
  allowedModuleTypes: CommercialModuleType[];
  stateScopedFamilies: Partial<Record<CommercialPageFamily, string[]>>;
};

export const PROVIDER_ONBOARDING_PILOT: ProviderPilotConfig = {
  enabled: true,
  allowedFamilies: [
    "state-electricity-pages",
    "bill-estimator-pages",
    "energy-comparison-hub-pages",
    "provider-marketplace-pages",
  ],
  allowedModuleTypes: ["provider-comparison", "marketplace-cta"],
  stateScopedFamilies: {
    "state-electricity-pages": ["texas", "pennsylvania", "ohio", "illinois", "new-jersey", "new-york"],
    "bill-estimator-pages": ["texas", "pennsylvania", "ohio", "illinois", "new-jersey", "new-york"],
  },
};

export function isProviderPilotActiveForContext({
  pageFamily,
  moduleType,
  state,
}: {
  pageFamily: CommercialPageFamily;
  moduleType: CommercialModuleType;
  state?: string;
}): boolean {
  if (!PROVIDER_ONBOARDING_PILOT.enabled) return false;
  if (!PROVIDER_ONBOARDING_PILOT.allowedFamilies.includes(pageFamily)) return false;
  if (!PROVIDER_ONBOARDING_PILOT.allowedModuleTypes.includes(moduleType)) return false;

  const scopedStates = PROVIDER_ONBOARDING_PILOT.stateScopedFamilies[pageFamily];
  if (!scopedStates || scopedStates.length === 0) return true;
  if (!state) return false;
  return scopedStates.includes(state);
}
