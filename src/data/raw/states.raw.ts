import type { StateRecord } from "@/data/types";

// Source: PowerOutage.us "Average residential electricity rates by state" table.
// Dataset reflects the latest published snapshot available in this environment (February 2026).
// AUTO-UPDATE READY:
// Future enhancement: fetch monthly rates from API and regenerate static pages.
const COMMON_STATE_METADATA = {
  sourceName: "PowerOutage.us",
  sourceUrl: "https://poweroutage.us/electricity-rates",
  methodology:
    "Average residential electricity price in cents per kWh from the published state-level dataset. Values are used as a reference benchmark for comparison and estimation.",
  disclaimer:
    "Estimates are energy-only and exclude delivery fees, taxes, fixed charges, and other utility fees.",
} as const;

export const RAW_STATES: Record<string, StateRecord> = {
  alabama: { slug: "alabama", name: "Alabama", postal: "AL", avgRateCentsPerKwh: 16.55, updated: "February 2026", ...COMMON_STATE_METADATA },
  alaska: { slug: "alaska", name: "Alaska", postal: "AK", avgRateCentsPerKwh: 25.01, updated: "February 2026", ...COMMON_STATE_METADATA },
  arizona: { slug: "arizona", name: "Arizona", postal: "AZ", avgRateCentsPerKwh: 15.7, updated: "February 2026", ...COMMON_STATE_METADATA },
  arkansas: { slug: "arkansas", name: "Arkansas", postal: "AR", avgRateCentsPerKwh: 12.83, updated: "February 2026", ...COMMON_STATE_METADATA },
  california: { slug: "california", name: "California", postal: "CA", avgRateCentsPerKwh: 31.14, updated: "February 2026", ...COMMON_STATE_METADATA },
  colorado: { slug: "colorado", name: "Colorado", postal: "CO", avgRateCentsPerKwh: 15.79, updated: "February 2026", ...COMMON_STATE_METADATA },
  connecticut: { slug: "connecticut", name: "Connecticut", postal: "CT", avgRateCentsPerKwh: 30.35, updated: "February 2026", ...COMMON_STATE_METADATA },
  delaware: { slug: "delaware", name: "Delaware", postal: "DE", avgRateCentsPerKwh: 17.18, updated: "February 2026", ...COMMON_STATE_METADATA },
  florida: { slug: "florida", name: "Florida", postal: "FL", avgRateCentsPerKwh: 15.27, updated: "February 2026", ...COMMON_STATE_METADATA },
  georgia: { slug: "georgia", name: "Georgia", postal: "GA", avgRateCentsPerKwh: 15.22, updated: "February 2026", ...COMMON_STATE_METADATA },
  hawaii: { slug: "hawaii", name: "Hawaii", postal: "HI", avgRateCentsPerKwh: 41.3, updated: "February 2026", ...COMMON_STATE_METADATA },
  idaho: { slug: "idaho", name: "Idaho", postal: "ID", avgRateCentsPerKwh: 11.74, updated: "February 2026", ...COMMON_STATE_METADATA },
  illinois: { slug: "illinois", name: "Illinois", postal: "IL", avgRateCentsPerKwh: 16.96, updated: "February 2026", ...COMMON_STATE_METADATA },
  indiana: { slug: "indiana", name: "Indiana", postal: "IN", avgRateCentsPerKwh: 16.12, updated: "February 2026", ...COMMON_STATE_METADATA },
  iowa: { slug: "iowa", name: "Iowa", postal: "IA", avgRateCentsPerKwh: 13.18, updated: "February 2026", ...COMMON_STATE_METADATA },
  kansas: { slug: "kansas", name: "Kansas", postal: "KS", avgRateCentsPerKwh: 14.48, updated: "February 2026", ...COMMON_STATE_METADATA },
  kentucky: { slug: "kentucky", name: "Kentucky", postal: "KY", avgRateCentsPerKwh: 13.2, updated: "February 2026", ...COMMON_STATE_METADATA },
  louisiana: { slug: "louisiana", name: "Louisiana", postal: "LA", avgRateCentsPerKwh: 12.34, updated: "February 2026", ...COMMON_STATE_METADATA },
  maine: { slug: "maine", name: "Maine", postal: "ME", avgRateCentsPerKwh: 27.24, updated: "February 2026", ...COMMON_STATE_METADATA },
  maryland: { slug: "maryland", name: "Maryland", postal: "MD", avgRateCentsPerKwh: 19.29, updated: "February 2026", ...COMMON_STATE_METADATA },
  massachusetts: { slug: "massachusetts", name: "Massachusetts", postal: "MA", avgRateCentsPerKwh: 26.01, updated: "February 2026", ...COMMON_STATE_METADATA },
  michigan: { slug: "michigan", name: "Michigan", postal: "MI", avgRateCentsPerKwh: 19.91, updated: "February 2026", ...COMMON_STATE_METADATA },
  minnesota: { slug: "minnesota", name: "Minnesota", postal: "MN", avgRateCentsPerKwh: 16.04, updated: "February 2026", ...COMMON_STATE_METADATA },
  mississippi: { slug: "mississippi", name: "Mississippi", postal: "MS", avgRateCentsPerKwh: 13.91, updated: "February 2026", ...COMMON_STATE_METADATA },
  missouri: { slug: "missouri", name: "Missouri", postal: "MO", avgRateCentsPerKwh: 13.37, updated: "February 2026", ...COMMON_STATE_METADATA },
  montana: { slug: "montana", name: "Montana", postal: "MT", avgRateCentsPerKwh: 13.12, updated: "February 2026", ...COMMON_STATE_METADATA },
  nebraska: { slug: "nebraska", name: "Nebraska", postal: "NE", avgRateCentsPerKwh: 12.19, updated: "February 2026", ...COMMON_STATE_METADATA },
  nevada: { slug: "nevada", name: "Nevada", postal: "NV", avgRateCentsPerKwh: 13.16, updated: "February 2026", ...COMMON_STATE_METADATA },
  "new-hampshire": { slug: "new-hampshire", name: "New Hampshire", postal: "NH", avgRateCentsPerKwh: 23.35, updated: "February 2026", ...COMMON_STATE_METADATA },
  "new-jersey": { slug: "new-jersey", name: "New Jersey", postal: "NJ", avgRateCentsPerKwh: 22.15, updated: "February 2026", ...COMMON_STATE_METADATA },
  "new-mexico": { slug: "new-mexico", name: "New Mexico", postal: "NM", avgRateCentsPerKwh: 15.29, updated: "February 2026", ...COMMON_STATE_METADATA },
  "new-york": { slug: "new-york", name: "New York", postal: "NY", avgRateCentsPerKwh: 23.87, updated: "February 2026", ...COMMON_STATE_METADATA },
  "north-carolina": { slug: "north-carolina", name: "North Carolina", postal: "NC", avgRateCentsPerKwh: 14.08, updated: "February 2026", ...COMMON_STATE_METADATA },
  "north-dakota": { slug: "north-dakota", name: "North Dakota", postal: "ND", avgRateCentsPerKwh: 11.92, updated: "February 2026", ...COMMON_STATE_METADATA },
  ohio: { slug: "ohio", name: "Ohio", postal: "OH", avgRateCentsPerKwh: 16.9, updated: "February 2026", ...COMMON_STATE_METADATA },
  oklahoma: { slug: "oklahoma", name: "Oklahoma", postal: "OK", avgRateCentsPerKwh: 13.05, updated: "February 2026", ...COMMON_STATE_METADATA },
  oregon: { slug: "oregon", name: "Oregon", postal: "OR", avgRateCentsPerKwh: 15.0, updated: "February 2026", ...COMMON_STATE_METADATA },
  pennsylvania: { slug: "pennsylvania", name: "Pennsylvania", postal: "PA", avgRateCentsPerKwh: 17.78, updated: "February 2026", ...COMMON_STATE_METADATA },
  "rhode-island": { slug: "rhode-island", name: "Rhode Island", postal: "RI", avgRateCentsPerKwh: 28.42, updated: "February 2026", ...COMMON_STATE_METADATA },
  "south-carolina": { slug: "south-carolina", name: "South Carolina", postal: "SC", avgRateCentsPerKwh: 14.72, updated: "February 2026", ...COMMON_STATE_METADATA },
  "south-dakota": { slug: "south-dakota", name: "South Dakota", postal: "SD", avgRateCentsPerKwh: 13.14, updated: "February 2026", ...COMMON_STATE_METADATA },
  tennessee: { slug: "tennessee", name: "Tennessee", postal: "TN", avgRateCentsPerKwh: 13.28, updated: "February 2026", ...COMMON_STATE_METADATA },
  texas: { slug: "texas", name: "Texas", postal: "TX", avgRateCentsPerKwh: 15.83, updated: "February 2026", ...COMMON_STATE_METADATA },
  utah: { slug: "utah", name: "Utah", postal: "UT", avgRateCentsPerKwh: 12.97, updated: "February 2026", ...COMMON_STATE_METADATA },
  vermont: { slug: "vermont", name: "Vermont", postal: "VT", avgRateCentsPerKwh: 22.58, updated: "February 2026", ...COMMON_STATE_METADATA },
  virginia: { slug: "virginia", name: "Virginia", postal: "VA", avgRateCentsPerKwh: 15.26, updated: "February 2026", ...COMMON_STATE_METADATA },
  washington: { slug: "washington", name: "Washington", postal: "WA", avgRateCentsPerKwh: 12.86, updated: "February 2026", ...COMMON_STATE_METADATA },
  "west-virginia": { slug: "west-virginia", name: "West Virginia", postal: "WV", avgRateCentsPerKwh: 15.39, updated: "February 2026", ...COMMON_STATE_METADATA },
  wisconsin: { slug: "wisconsin", name: "Wisconsin", postal: "WI", avgRateCentsPerKwh: 18.04, updated: "February 2026", ...COMMON_STATE_METADATA },
  wyoming: { slug: "wyoming", name: "Wyoming", postal: "WY", avgRateCentsPerKwh: 14.02, updated: "February 2026", ...COMMON_STATE_METADATA },
};
