export type Utility = {
  stateSlug: string;
  slug: string;
  name: string;
  avgRateCentsPerKwh?: number;
};

export const UTILITIES: Utility[] = [
  // California
  { stateSlug: "california", slug: "pg-e", name: "Pacific Gas and Electric (PG&E)", avgRateCentsPerKwh: 32.4 },
  { stateSlug: "california", slug: "southern-california-edison", name: "Southern California Edison (SCE)" },
  { stateSlug: "california", slug: "sdg-e", name: "San Diego Gas & Electric (SDG&E)", avgRateCentsPerKwh: 34.1 },
  { stateSlug: "california", slug: "ladwp", name: "Los Angeles Department of Water and Power (LADWP)" },

  // Texas
  { stateSlug: "texas", slug: "oncor", name: "Oncor Electric Delivery" },
  { stateSlug: "texas", slug: "centerpoint-energy", name: "CenterPoint Energy (Texas Electric)" },
  { stateSlug: "texas", slug: "aep-texas", name: "AEP Texas" },
  { stateSlug: "texas", slug: "tnmp", name: "Texas-New Mexico Power (TNMP)" },

  // Florida
  { stateSlug: "florida", slug: "florida-power-light", name: "Florida Power & Light (FPL)", avgRateCentsPerKwh: 15.0 },
  { stateSlug: "florida", slug: "duke-energy-florida", name: "Duke Energy Florida" },
  { stateSlug: "florida", slug: "tampa-electric", name: "Tampa Electric (TECO)" },
  { stateSlug: "florida", slug: "jea", name: "JEA" },

  // New York
  { stateSlug: "new-york", slug: "con-edison", name: "Con Edison", avgRateCentsPerKwh: 24.6 },
  { stateSlug: "new-york", slug: "national-grid-ny", name: "National Grid (New York)" },
  { stateSlug: "new-york", slug: "nyseg", name: "NYSEG" },
  { stateSlug: "new-york", slug: "rge", name: "Rochester Gas and Electric (RG&E)" },

  // Illinois
  { stateSlug: "illinois", slug: "comed", name: "Commonwealth Edison (ComEd)" },
  { stateSlug: "illinois", slug: "ameren-illinois", name: "Ameren Illinois" },
  { stateSlug: "illinois", slug: "midamerican-illinois", name: "MidAmerican Energy (Illinois)" },

  // Pennsylvania
  { stateSlug: "pennsylvania", slug: "penelec", name: "Penelec" },
  { stateSlug: "pennsylvania", slug: "duquesne-light", name: "Duquesne Light Company" },
  { stateSlug: "pennsylvania", slug: "peco", name: "PECO" },
  { stateSlug: "pennsylvania", slug: "ppl-electric", name: "PPL Electric Utilities" },

  // Ohio
  { stateSlug: "ohio", slug: "aep-ohio", name: "AEP Ohio" },
  { stateSlug: "ohio", slug: "duke-energy-ohio", name: "Duke Energy Ohio" },
  { stateSlug: "ohio", slug: "firstenergy-ohio-edison", name: "FirstEnergy Ohio Edison" },
  { stateSlug: "ohio", slug: "dayton-power-light", name: "Dayton Power & Light (AES Ohio)" },

  // Georgia
  { stateSlug: "georgia", slug: "georgia-power", name: "Georgia Power", avgRateCentsPerKwh: 15.4 },
  { stateSlug: "georgia", slug: "savannah-electric-power", name: "Savannah Electric and Power" },
  { stateSlug: "georgia", slug: "greystone-power", name: "GreyStone Power Corporation" },
  { stateSlug: "georgia", slug: "jackson-emc", name: "Jackson EMC" },
];

export function getUtilitiesByState(stateSlug: string): Utility[] {
  return UTILITIES.filter((utility) => utility.stateSlug === stateSlug);
}

export function getUtility(stateSlug: string, utilitySlug: string): Utility | null {
  return UTILITIES.find(
    (utility) => utility.stateSlug === stateSlug && utility.slug === utilitySlug,
  ) ?? null;
}
