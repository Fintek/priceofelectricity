import type { ItemListEntry } from "@/lib/seo/jsonld";
import { STATES } from "@/data/states";
import { getProviderCatalogCoverageByState } from "@/lib/providers/providerCatalog";

export const PROVIDER_DISCOVERY_SECTION_TITLE = "Compare providers by state";

export const PROVIDER_DISCOVERY_SECTION_INTRO =
  "Browse provider options alongside our independent electricity data. These links connect you to provider details and plan information.";

export type ProviderDiscoveryState = {
  slug: string;
  name: string;
};

export type ProviderDiscoveryLink = {
  href: string;
  label: string;
  companionHref?: string;
  companionLabel?: string;
};

export type ProviderOfferItem = {
  providerName: string;
  signupUrl: string;
  offerDescription?: string;
};

function toTitleFromSlug(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function buildProviderDiscoveryLinks(
  states: ProviderDiscoveryState[],
  maxStates = 3,
): ProviderDiscoveryLink[] {
  const scopedStates = states.slice(0, maxStates);
  return [
    {
      href: "/electricity-providers",
      label: "Electricity providers by state",
    },
    ...scopedStates.map((state) => ({
      href: `/electricity-providers/${state.slug}`,
      label: `Providers in ${state.name}`,
      companionHref: `/electricity-cost/${state.slug}`,
      companionLabel: `Electricity cost in ${state.name}`,
    })),
  ];
}

export function buildProviderDiscoveryItemListEntries(
  states: ProviderDiscoveryState[],
  maxStates = 3,
): ItemListEntry[] {
  return [
    { name: "Provider marketplace index", url: "/electricity-providers" },
    ...states.slice(0, maxStates).map((state) => ({
      name: `${state.name} provider context`,
      url: `/electricity-providers/${state.slug}`,
      description: "State-level provider options and market details",
    })),
  ];
}

export function buildProviderOfferItemListEntries(
  offers: ProviderOfferItem[],
  maxOffers = 6,
): ItemListEntry[] {
  return offers.slice(0, maxOffers).map((offer) => ({
    name: offer.providerName,
    url: offer.signupUrl,
    description: offer.offerDescription,
  }));
}

export function getProviderDiscoveryStatesFromCatalog(maxStates = 8): ProviderDiscoveryState[] {
  const coverage = getProviderCatalogCoverageByState();
  return Array.from(coverage.entries())
    .sort((a, b) => {
      const countDiff = b[1].length - a[1].length;
      if (countDiff !== 0) return countDiff;
      return a[0].localeCompare(b[0]);
    })
    .slice(0, maxStates)
    .map(([slug]) => ({
      slug,
      name: STATES[slug]?.name ?? toTitleFromSlug(slug),
    }));
}
