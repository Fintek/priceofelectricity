/**
 * U.S. Census Bureau regional divisions.
 * Deterministic, static mapping. No network calls.
 * States not in this map fall into "unknown".
 * @see https://www2.census.gov/geo/pdfs/maps-data/maps/reference/us_regdiv.pdf
 */

export type RegionId = "northeast" | "midwest" | "south" | "west" | "unknown";

export type RegionDef = {
  id: RegionId;
  name: string;
  stateSlugs: string[];
};

const CENSUS_REGIONS: Record<Exclude<RegionId, "unknown">, string[]> = {
  northeast: [
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
  midwest: [
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
  south: [
    "delaware",
    "district-of-columbia",
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
  west: [
    "arizona",
    "colorado",
    "idaho",
    "montana",
    "nevada",
    "new-mexico",
    "utah",
    "wyoming",
    "alaska",
    "california",
    "hawaii",
    "oregon",
    "washington",
  ],
};

export function buildRegionMapping(allStateSlugs: string[]): RegionDef[] {
  const slugToRegion = new Map<string, Exclude<RegionId, "unknown">>();
  for (const [regionId, slugs] of Object.entries(CENSUS_REGIONS) as Array<[Exclude<RegionId, "unknown">, string[]]>) {
    for (const slug of slugs) {
      slugToRegion.set(slug, regionId);
    }
  }

  const unknownSlugs = allStateSlugs.filter((s) => !slugToRegion.has(s));
  const regions: RegionDef[] = [
    { id: "northeast", name: "Northeast", stateSlugs: CENSUS_REGIONS.northeast.filter((s) => allStateSlugs.includes(s)) },
    { id: "midwest", name: "Midwest", stateSlugs: CENSUS_REGIONS.midwest.filter((s) => allStateSlugs.includes(s)) },
    { id: "south", name: "South", stateSlugs: CENSUS_REGIONS.south.filter((s) => allStateSlugs.includes(s)) },
    { id: "west", name: "West", stateSlugs: CENSUS_REGIONS.west.filter((s) => allStateSlugs.includes(s)) },
  ];

  if (unknownSlugs.length > 0) {
    regions.push({ id: "unknown", name: "Unknown", stateSlugs: unknownSlugs });
  }

  return regions;
}

export function getRegionForState(stateSlug: string, allStateSlugs: string[]): RegionId {
  const mapping = buildRegionMapping(allStateSlugs);
  for (const r of mapping) {
    if (r.stateSlugs.includes(stateSlug)) return r.id;
  }
  return "unknown";
}
