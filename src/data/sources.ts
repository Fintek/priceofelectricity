export type Source = {
  slug: string;
  name: string;
  description: string;
  url: string;
  publisher?: string;
};

export const SOURCES: Source[] = [
  {
    slug: "eia",
    name: "U.S. Energy Information Administration",
    description:
      "The EIA is the U.S. government's official source for energy statistics. It publishes state-level average residential electricity prices and is widely cited for electricity rate data.",
    url: "https://www.eia.gov/electricity/data/state/",
    publisher: "U.S. Department of Energy",
  },
  {
    slug: "state-public-utility-commissions",
    name: "State Public Utility Commissions",
    description:
      "State PUCs regulate utilities and often publish rate data, tariffs, and annual reports. Data varies by state and may require manual aggregation.",
    url: "https://www.naruc.org/",
    publisher: "National Association of Regulatory Utility Commissioners",
  },
  {
    slug: "manual-mvp",
    name: "Manual MVP (Temporary)",
    description:
      "Placeholder for manually curated or aggregated data during initial development. Used when automated sources are not yet integrated.",
    url: "https://priceofelectricity.com/about",
    publisher: "PriceOfElectricity.com",
  },
  {
    slug: "poweroutage-us",
    name: "PowerOutage.us",
    description:
      "PowerOutage.us aggregates average residential electricity rates by state from published datasets. Used as a reference benchmark for comparison and estimation.",
    url: "https://poweroutage.us/electricity-rates",
  },
];

const SOURCES_BY_SLUG = Object.fromEntries(
  SOURCES.map((s) => [s.slug, s])
) as Record<string, Source>;

/** Maps state sourceName to source slug for linking. */
const SOURCE_NAME_TO_SLUG: Record<string, string> = {
  "PowerOutage.us": "poweroutage-us",
  "U.S. Energy Information Administration": "eia",
  "U.S. Energy Information Administration (EIA)": "eia",
  EIA: "eia",
};

export function getSource(slug: string): Source | undefined {
  return SOURCES_BY_SLUG[slug];
}

export function getSourceSlugForState(sourceName: string): string | null {
  return SOURCE_NAME_TO_SLUG[sourceName] ?? null;
}

export function getStatesBySourceSlug(
  sourceSlug: string,
  states: Record<string, { sourceName: string }>
): string[] {
  const source = getSource(sourceSlug);
  if (!source) return [];

  return Object.entries(states)
    .filter(([, s]) => getSourceSlugForState(s.sourceName) === sourceSlug)
    .map(([slug]) => slug)
    .sort();
}
