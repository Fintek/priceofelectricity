export type Region = {
  slug: string;
  name: string;
  states: string[];
};

export const REGIONS: Region[] = [
  {
    slug: "northeast",
    name: "Northeast",
    states: [
      "connecticut",
      "maine",
      "massachusetts",
      "new-hampshire",
      "rhode-island",
      "vermont",
      "new-jersey",
      "new-york",
      "pennsylvania",
    ],
  },
  {
    slug: "south",
    name: "South",
    states: [
      "delaware",
      "florida",
      "georgia",
      "maryland",
      "north-carolina",
      "south-carolina",
      "virginia",
      "west-virginia",
      "alabama",
      "kentucky",
      "mississippi",
      "tennessee",
      "arkansas",
      "louisiana",
      "oklahoma",
      "texas",
    ],
  },
  {
    slug: "midwest",
    name: "Midwest",
    states: [
      "illinois",
      "indiana",
      "michigan",
      "ohio",
      "wisconsin",
      "iowa",
      "kansas",
      "minnesota",
      "missouri",
      "nebraska",
      "north-dakota",
      "south-dakota",
    ],
  },
  {
    slug: "west",
    name: "West",
    states: [
      "alaska",
      "arizona",
      "california",
      "colorado",
      "hawaii",
      "idaho",
      "montana",
      "nevada",
      "new-mexico",
      "oregon",
      "utah",
      "washington",
      "wyoming",
    ],
  },
];

export const REGION_BY_SLUG: Record<string, Region> = Object.fromEntries(
  REGIONS.map((region) => [region.slug, region])
) as Record<string, Region>;

export function getRegionByStateSlug(stateSlug: string): Region | null {
  return REGIONS.find((region) => region.states.includes(stateSlug)) ?? null;
}
