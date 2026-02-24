export type City = {
  stateSlug: string;
  slug: string;
  name: string;
  population?: number;
  avgRateCentsPerKwh?: number;
};

export const CITIES: City[] = [
  // California
  { stateSlug: "california", slug: "los-angeles", name: "Los Angeles", population: 3820000, avgRateCentsPerKwh: 30.9 },
  { stateSlug: "california", slug: "san-diego", name: "San Diego", population: 1380000, avgRateCentsPerKwh: 33.5 },
  { stateSlug: "california", slug: "san-jose", name: "San Jose", population: 970000 },
  { stateSlug: "california", slug: "san-francisco", name: "San Francisco", population: 810000 },
  { stateSlug: "california", slug: "fresno", name: "Fresno", population: 550000 },
  { stateSlug: "california", slug: "sacramento", name: "Sacramento", population: 525000 },

  // Texas
  { stateSlug: "texas", slug: "houston", name: "Houston", population: 2300000, avgRateCentsPerKwh: 15.6 },
  { stateSlug: "texas", slug: "san-antonio", name: "San Antonio", population: 1490000 },
  { stateSlug: "texas", slug: "dallas", name: "Dallas", population: 1300000 },
  { stateSlug: "texas", slug: "austin", name: "Austin", population: 980000, avgRateCentsPerKwh: 16.2 },
  { stateSlug: "texas", slug: "fort-worth", name: "Fort Worth", population: 960000 },
  { stateSlug: "texas", slug: "el-paso", name: "El Paso", population: 680000 },

  // Florida
  { stateSlug: "florida", slug: "jacksonville", name: "Jacksonville", population: 990000 },
  { stateSlug: "florida", slug: "miami", name: "Miami", population: 460000, avgRateCentsPerKwh: 15.4 },
  { stateSlug: "florida", slug: "tampa", name: "Tampa", population: 400000 },
  { stateSlug: "florida", slug: "orlando", name: "Orlando", population: 320000 },
  { stateSlug: "florida", slug: "st-petersburg", name: "St. Petersburg", population: 270000 },
  { stateSlug: "florida", slug: "hialeah", name: "Hialeah", population: 220000 },

  // New York
  { stateSlug: "new-york", slug: "new-york-city", name: "New York City", population: 8330000, avgRateCentsPerKwh: 24.9 },
  { stateSlug: "new-york", slug: "buffalo", name: "Buffalo", population: 275000 },
  { stateSlug: "new-york", slug: "rochester", name: "Rochester", population: 210000 },
  { stateSlug: "new-york", slug: "yonkers", name: "Yonkers", population: 210000 },
  { stateSlug: "new-york", slug: "syracuse", name: "Syracuse", population: 145000 },
  { stateSlug: "new-york", slug: "albany", name: "Albany", population: 100000 },

  // Illinois
  { stateSlug: "illinois", slug: "chicago", name: "Chicago", population: 2660000, avgRateCentsPerKwh: 17.2 },
  { stateSlug: "illinois", slug: "aurora", name: "Aurora", population: 180000 },
  { stateSlug: "illinois", slug: "naperville", name: "Naperville", population: 151000 },
  { stateSlug: "illinois", slug: "joliet", name: "Joliet", population: 150000 },
  { stateSlug: "illinois", slug: "rockford", name: "Rockford", population: 147000 },
  { stateSlug: "illinois", slug: "springfield", name: "Springfield", population: 113000 },

  // Pennsylvania
  { stateSlug: "pennsylvania", slug: "philadelphia", name: "Philadelphia", population: 1550000, avgRateCentsPerKwh: 18.1 },
  { stateSlug: "pennsylvania", slug: "pittsburgh", name: "Pittsburgh", population: 303000 },
  { stateSlug: "pennsylvania", slug: "allentown", name: "Allentown", population: 126000 },
  { stateSlug: "pennsylvania", slug: "reading", name: "Reading", population: 95000 },
  { stateSlug: "pennsylvania", slug: "erie", name: "Erie", population: 94000 },
  { stateSlug: "pennsylvania", slug: "scranton", name: "Scranton", population: 76000 },

  // Ohio
  { stateSlug: "ohio", slug: "columbus", name: "Columbus", population: 905000, avgRateCentsPerKwh: 16.7 },
  { stateSlug: "ohio", slug: "cleveland", name: "Cleveland", population: 370000 },
  { stateSlug: "ohio", slug: "cincinnati", name: "Cincinnati", population: 310000 },
  { stateSlug: "ohio", slug: "toledo", name: "Toledo", population: 265000 },
  { stateSlug: "ohio", slug: "akron", name: "Akron", population: 190000 },
  { stateSlug: "ohio", slug: "dayton", name: "Dayton", population: 135000 },

  // Georgia
  { stateSlug: "georgia", slug: "atlanta", name: "Atlanta", population: 500000, avgRateCentsPerKwh: 15.4 },
  { stateSlug: "georgia", slug: "augusta", name: "Augusta", population: 202000 },
  { stateSlug: "georgia", slug: "columbus", name: "Columbus", population: 206000 },
  { stateSlug: "georgia", slug: "macon", name: "Macon", population: 157000 },
  { stateSlug: "georgia", slug: "savannah", name: "Savannah", population: 148000 },
  { stateSlug: "georgia", slug: "athens", name: "Athens", population: 128000 },
];

export const CITIES_BY_STATE: Record<string, City[]> = CITIES.reduce(
  (acc, city) => {
    if (!acc[city.stateSlug]) {
      acc[city.stateSlug] = [];
    }
    acc[city.stateSlug].push(city);
    return acc;
  },
  {} as Record<string, City[]>,
);

export function getCitiesByState(stateSlug: string): City[] {
  return CITIES_BY_STATE[stateSlug] ?? [];
}

// Backward-compatible export name retained for existing imports.
export const CITY_RECORDS: City[] = CITIES;
