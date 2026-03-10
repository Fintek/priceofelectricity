import {
  PROVIDERS,
  PROVIDER_SERVICE_LABELS,
  type ProviderPageContext,
  type ProviderRecord,
  type ProviderServiceCategory,
} from "@/lib/providers/config";

export type ResolvedProvider = {
  id: string;
  name: string;
  providerType: ProviderRecord["providerType"];
  sponsored: boolean;
  displayPriority: number;
  shortDescription: string;
  href: string;
  services: ProviderServiceCategory[];
  leadGenerationLabel?: string;
};

function providerSupportsState(provider: ProviderRecord, state?: string): boolean {
  if (provider.supportedStates === "all") return true;
  if (!state) return false;
  return provider.supportedStates.includes(state);
}

function providerSupportsPageContext(provider: ProviderRecord, context: ProviderPageContext): boolean {
  if (!provider.enabled) return false;
  if (!provider.displayRules.pageTypes.includes(context.pageType)) return false;
  if (!providerSupportsState(provider, context.state)) return false;

  if (context.serviceCategory) {
    if (!provider.supportedServices.includes(context.serviceCategory)) return false;
    if (
      provider.displayRules.serviceCategories &&
      provider.displayRules.serviceCategories.length > 0 &&
      !provider.displayRules.serviceCategories.includes(context.serviceCategory)
    ) {
      return false;
    }
  }

  if (context.includeSponsored === false && provider.sponsored) {
    return false;
  }

  return true;
}

function resolveHref(provider: ProviderRecord, state?: string): string {
  if (state && provider.referralUrls.byState?.[state]) {
    return provider.referralUrls.byState[state] as string;
  }
  return provider.referralUrls.default;
}

function toResolvedProvider(provider: ProviderRecord, state?: string): ResolvedProvider {
  return {
    id: provider.id,
    name: provider.name,
    providerType: provider.providerType,
    sponsored: provider.sponsored,
    displayPriority: provider.displayPriority,
    shortDescription: provider.shortDescription,
    href: resolveHref(provider, state),
    services: provider.supportedServices,
    leadGenerationLabel:
      provider.leadGeneration?.mode === "internal-form"
        ? "Lead form"
        : provider.leadGeneration?.mode === "api-placeholder"
          ? "API lead integration"
          : provider.leadGeneration?.mode === "redirect"
            ? "Referral redirect"
            : undefined,
  };
}

export function resolveProvidersForContext(
  context: ProviderPageContext,
  max = 4,
): ResolvedProvider[] {
  return PROVIDERS
    .filter((provider) => providerSupportsPageContext(provider, context))
    .sort((a, b) => {
      if (a.sponsored !== b.sponsored) {
        return a.sponsored ? -1 : 1;
      }
      return b.displayPriority - a.displayPriority || a.name.localeCompare(b.name);
    })
    .slice(0, max)
    .map((provider) => toResolvedProvider(provider, context.state));
}

export function resolveStateProviderListings(state: string): ResolvedProvider[] {
  return PROVIDERS
    .filter((provider) => provider.enabled && providerSupportsState(provider, state))
    .sort((a, b) => {
      if (a.sponsored !== b.sponsored) {
        return a.sponsored ? -1 : 1;
      }
      return b.displayPriority - a.displayPriority || a.name.localeCompare(b.name);
    })
    .map((provider) => toResolvedProvider(provider, state));
}

export function buildProviderComparisonRows(providers: ResolvedProvider[]): Array<{
  id: string;
  name: string;
  providerType: string;
  services: string;
  leadModel: string;
  sponsored: string;
}> {
  return providers.map((provider) => ({
    id: provider.id,
    name: provider.name,
    providerType: provider.providerType,
    services: provider.services.map((service) => PROVIDER_SERVICE_LABELS[service]).join(", "),
    leadModel: provider.leadGenerationLabel ?? "N/A",
    sponsored: provider.sponsored ? "Yes" : "No",
  }));
}

export function hasProvidersForContext(context: ProviderPageContext): boolean {
  return resolveProvidersForContext(context, 1).length > 0;
}
