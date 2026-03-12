import type {
  CommercialModuleType,
  CommercialPageFamily,
} from "@/lib/monetization/placementConfig";
import {
  isProviderModuleAllowedInFamily,
} from "@/lib/monetization/placementConfig";
import {
  getEnabledProviderCatalogEntries,
  type ProviderCatalogEntry,
  type ProviderOfferType,
  supportsProviderState,
} from "@/lib/providers/providerCatalog";
import { isProviderPilotActiveForContext } from "@/lib/providers/providerPilot";
import { isProviderContextAllowedByRolloutPlan } from "@/lib/providers/providerRolloutPlan";

export type ProviderResolverInput = {
  state?: string;
  pageFamily: CommercialPageFamily;
  moduleType: CommercialModuleType;
  maxResults?: number;
};

export type ResolvedProviderOffer = {
  providerId: string;
  providerName: string;
  offerType: ProviderOfferType;
  offerDescription: string;
  coverageAreaDescription: string;
  planTypeSummary: string;
  featureHighlights: string[];
  signupUrl: string;
  regulatoryNotes?: string;
  hasAffiliateDisclosure: boolean;
};

function buildTrackedUrl(entry: ProviderCatalogEntry): string {
  if (!entry.trackingParams || Object.keys(entry.trackingParams).length === 0) {
    return entry.signupUrl;
  }
  const url = new URL(entry.signupUrl);
  const sortedParams = Object.entries(entry.trackingParams).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  for (const [key, value] of sortedParams) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

function toResolvedOffer(entry: ProviderCatalogEntry): ResolvedProviderOffer {
  return {
    providerId: entry.providerId,
    providerName: entry.providerName,
    offerType: entry.offerType,
    offerDescription: entry.offerDescription,
    coverageAreaDescription: entry.coverageAreaDescription,
    planTypeSummary: entry.planTypeSummary,
    featureHighlights: entry.featureHighlights,
    signupUrl: buildTrackedUrl(entry),
    regulatoryNotes: entry.regulatoryNotes,
    hasAffiliateDisclosure: entry.offerType === "affiliate",
  };
}

function getOfferTypeWeight(
  offerType: ProviderOfferType,
  moduleType: CommercialModuleType,
): number {
  if (moduleType === "marketplace-cta") {
    if (offerType === "marketplace") return 300;
    if (offerType === "supplier") return 200;
    return 100;
  }
  if (offerType === "marketplace") return 220;
  if (offerType === "supplier") return 180;
  return 140;
}

function deterministicRank(
  entry: ProviderCatalogEntry,
  moduleType: CommercialModuleType,
): number {
  return entry.priority + getOfferTypeWeight(entry.offerType, moduleType);
}

function sortProviders(
  entries: ProviderCatalogEntry[],
  moduleType: CommercialModuleType,
): ProviderCatalogEntry[] {
  return [...entries].sort((a, b) => {
    const rankDiff = deterministicRank(b, moduleType) - deterministicRank(a, moduleType);
    if (rankDiff !== 0) return rankDiff;
    return a.providerName.localeCompare(b.providerName);
  });
}

function applyComparisonDiversity(entries: ProviderCatalogEntry[]): ProviderCatalogEntry[] {
  const byType: Record<ProviderOfferType, ProviderCatalogEntry[]> = {
    marketplace: [],
    supplier: [],
    affiliate: [],
  };
  for (const entry of entries) {
    byType[entry.offerType].push(entry);
  }
  const orderedTypes: ProviderOfferType[] = ["marketplace", "supplier", "affiliate"];
  const output: ProviderCatalogEntry[] = [];
  let remaining = true;
  while (remaining) {
    remaining = false;
    for (const type of orderedTypes) {
      const next = byType[type].shift();
      if (!next) continue;
      output.push(next);
      remaining = true;
    }
  }
  return output;
}

export function resolveProviderMarketplaceOffers({
  state,
  pageFamily,
  moduleType,
  maxResults = 3,
}: ProviderResolverInput): ResolvedProviderOffer[] {
  if (!isProviderModuleAllowedInFamily(pageFamily, moduleType)) return [];
  if (!isProviderPilotActiveForContext({ pageFamily, moduleType, state })) return [];
  if (!isProviderContextAllowedByRolloutPlan({ pageFamily, moduleType, state })) return [];

  const matching = getEnabledProviderCatalogEntries()
    .filter((entry) => supportsProviderState(entry, state))
    .filter((entry) => entry.allowedPageFamilies.includes(pageFamily))
    .filter((entry) => entry.allowedModuleTypes.includes(moduleType));
  const ranked = sortProviders(matching, moduleType);
  const diversified =
    moduleType === "provider-comparison" ? applyComparisonDiversity(ranked) : ranked;
  return diversified.slice(0, maxResults).map(toResolvedOffer);
}
