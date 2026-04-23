import type { StateRecord } from "@/data/types";

// GENERATED FILE — do not edit by hand.
// Written by scripts/eia/generate_snapshots_from_eia_csv.ts from the canonical
// EIA residential retail-sales CSV. Rates and "updated" labels reflect the
// latest complete EIA monthly period in the dataset.
const COMMON_STATE_METADATA = {
  sourceName: "U.S. Energy Information Administration (EIA)",
  sourceUrl: "https://www.eia.gov/electricity/data/state/",
  methodology:
    "Average residential electricity price in cents per kWh from the U.S. Energy Information Administration (EIA) Form EIA-861M retail sales dataset. Values are used as a reference benchmark for comparison and estimation.",
  disclaimer:
    "Estimates are energy-only and exclude delivery fees, taxes, fixed charges, and other utility fees.",
} as const;

export const RAW_STATES: Record<string, StateRecord> = {
  alabama: { slug: "alabama", name: "Alabama", postal: "AL", avgRateCentsPerKwh: 16.06, updated: "January 2026", ...COMMON_STATE_METADATA },
  alaska: { slug: "alaska", name: "Alaska", postal: "AK", avgRateCentsPerKwh: 25.52, updated: "January 2026", ...COMMON_STATE_METADATA },
  arizona: { slug: "arizona", name: "Arizona", postal: "AZ", avgRateCentsPerKwh: 15.61, updated: "January 2026", ...COMMON_STATE_METADATA },
  arkansas: { slug: "arkansas", name: "Arkansas", postal: "AR", avgRateCentsPerKwh: 12.35, updated: "January 2026", ...COMMON_STATE_METADATA },
  california: { slug: "california", name: "California", postal: "CA", avgRateCentsPerKwh: 30.29, updated: "January 2026", ...COMMON_STATE_METADATA },
  colorado: { slug: "colorado", name: "Colorado", postal: "CO", avgRateCentsPerKwh: 16.44, updated: "January 2026", ...COMMON_STATE_METADATA },
  connecticut: { slug: "connecticut", name: "Connecticut", postal: "CT", avgRateCentsPerKwh: 28.3, updated: "January 2026", ...COMMON_STATE_METADATA },
  delaware: { slug: "delaware", name: "Delaware", postal: "DE", avgRateCentsPerKwh: 16.51, updated: "January 2026", ...COMMON_STATE_METADATA },
  florida: { slug: "florida", name: "Florida", postal: "FL", avgRateCentsPerKwh: 15.92, updated: "January 2026", ...COMMON_STATE_METADATA },
  georgia: { slug: "georgia", name: "Georgia", postal: "GA", avgRateCentsPerKwh: 14.46, updated: "January 2026", ...COMMON_STATE_METADATA },
  hawaii: { slug: "hawaii", name: "Hawaii", postal: "HI", avgRateCentsPerKwh: 39.79, updated: "January 2026", ...COMMON_STATE_METADATA },
  idaho: { slug: "idaho", name: "Idaho", postal: "ID", avgRateCentsPerKwh: 12.07, updated: "January 2026", ...COMMON_STATE_METADATA },
  illinois: { slug: "illinois", name: "Illinois", postal: "IL", avgRateCentsPerKwh: 16.36, updated: "January 2026", ...COMMON_STATE_METADATA },
  indiana: { slug: "indiana", name: "Indiana", postal: "IN", avgRateCentsPerKwh: 16.19, updated: "January 2026", ...COMMON_STATE_METADATA },
  iowa: { slug: "iowa", name: "Iowa", postal: "IA", avgRateCentsPerKwh: 12.83, updated: "January 2026", ...COMMON_STATE_METADATA },
  kansas: { slug: "kansas", name: "Kansas", postal: "KS", avgRateCentsPerKwh: 14.29, updated: "January 2026", ...COMMON_STATE_METADATA },
  kentucky: { slug: "kentucky", name: "Kentucky", postal: "KY", avgRateCentsPerKwh: 14.27, updated: "January 2026", ...COMMON_STATE_METADATA },
  louisiana: { slug: "louisiana", name: "Louisiana", postal: "LA", avgRateCentsPerKwh: 12.46, updated: "January 2026", ...COMMON_STATE_METADATA },
  maine: { slug: "maine", name: "Maine", postal: "ME", avgRateCentsPerKwh: 30.73, updated: "January 2026", ...COMMON_STATE_METADATA },
  maryland: { slug: "maryland", name: "Maryland", postal: "MD", avgRateCentsPerKwh: 20.61, updated: "January 2026", ...COMMON_STATE_METADATA },
  massachusetts: { slug: "massachusetts", name: "Massachusetts", postal: "MA", avgRateCentsPerKwh: 31.16, updated: "January 2026", ...COMMON_STATE_METADATA },
  michigan: { slug: "michigan", name: "Michigan", postal: "MI", avgRateCentsPerKwh: 19.52, updated: "January 2026", ...COMMON_STATE_METADATA },
  minnesota: { slug: "minnesota", name: "Minnesota", postal: "MN", avgRateCentsPerKwh: 14.98, updated: "January 2026", ...COMMON_STATE_METADATA },
  mississippi: { slug: "mississippi", name: "Mississippi", postal: "MS", avgRateCentsPerKwh: 14.24, updated: "January 2026", ...COMMON_STATE_METADATA },
  missouri: { slug: "missouri", name: "Missouri", postal: "MO", avgRateCentsPerKwh: 11.8, updated: "January 2026", ...COMMON_STATE_METADATA },
  montana: { slug: "montana", name: "Montana", postal: "MT", avgRateCentsPerKwh: 12.86, updated: "January 2026", ...COMMON_STATE_METADATA },
  nebraska: { slug: "nebraska", name: "Nebraska", postal: "NE", avgRateCentsPerKwh: 11.76, updated: "January 2026", ...COMMON_STATE_METADATA },
  nevada: { slug: "nevada", name: "Nevada", postal: "NV", avgRateCentsPerKwh: 13.98, updated: "January 2026", ...COMMON_STATE_METADATA },
  "new-hampshire": { slug: "new-hampshire", name: "New Hampshire", postal: "NH", avgRateCentsPerKwh: 26.32, updated: "January 2026", ...COMMON_STATE_METADATA },
  "new-jersey": { slug: "new-jersey", name: "New Jersey", postal: "NJ", avgRateCentsPerKwh: 23.13, updated: "January 2026", ...COMMON_STATE_METADATA },
  "new-mexico": { slug: "new-mexico", name: "New Mexico", postal: "NM", avgRateCentsPerKwh: 14.7, updated: "January 2026", ...COMMON_STATE_METADATA },
  "new-york": { slug: "new-york", name: "New York", postal: "NY", avgRateCentsPerKwh: 28.37, updated: "January 2026", ...COMMON_STATE_METADATA },
  "north-carolina": { slug: "north-carolina", name: "North Carolina", postal: "NC", avgRateCentsPerKwh: 13.68, updated: "January 2026", ...COMMON_STATE_METADATA },
  "north-dakota": { slug: "north-dakota", name: "North Dakota", postal: "ND", avgRateCentsPerKwh: 10.92, updated: "January 2026", ...COMMON_STATE_METADATA },
  ohio: { slug: "ohio", name: "Ohio", postal: "OH", avgRateCentsPerKwh: 17.59, updated: "January 2026", ...COMMON_STATE_METADATA },
  oklahoma: { slug: "oklahoma", name: "Oklahoma", postal: "OK", avgRateCentsPerKwh: 12.62, updated: "January 2026", ...COMMON_STATE_METADATA },
  oregon: { slug: "oregon", name: "Oregon", postal: "OR", avgRateCentsPerKwh: 14.66, updated: "January 2026", ...COMMON_STATE_METADATA },
  pennsylvania: { slug: "pennsylvania", name: "Pennsylvania", postal: "PA", avgRateCentsPerKwh: 20.19, updated: "January 2026", ...COMMON_STATE_METADATA },
  "rhode-island": { slug: "rhode-island", name: "Rhode Island", postal: "RI", avgRateCentsPerKwh: 30.14, updated: "January 2026", ...COMMON_STATE_METADATA },
  "south-carolina": { slug: "south-carolina", name: "South Carolina", postal: "SC", avgRateCentsPerKwh: 15.41, updated: "January 2026", ...COMMON_STATE_METADATA },
  "south-dakota": { slug: "south-dakota", name: "South Dakota", postal: "SD", avgRateCentsPerKwh: 13.6, updated: "January 2026", ...COMMON_STATE_METADATA },
  tennessee: { slug: "tennessee", name: "Tennessee", postal: "TN", avgRateCentsPerKwh: 13.1, updated: "January 2026", ...COMMON_STATE_METADATA },
  texas: { slug: "texas", name: "Texas", postal: "TX", avgRateCentsPerKwh: 15.69, updated: "January 2026", ...COMMON_STATE_METADATA },
  utah: { slug: "utah", name: "Utah", postal: "UT", avgRateCentsPerKwh: 12.88, updated: "January 2026", ...COMMON_STATE_METADATA },
  vermont: { slug: "vermont", name: "Vermont", postal: "VT", avgRateCentsPerKwh: 23.29, updated: "January 2026", ...COMMON_STATE_METADATA },
  virginia: { slug: "virginia", name: "Virginia", postal: "VA", avgRateCentsPerKwh: 15.87, updated: "January 2026", ...COMMON_STATE_METADATA },
  washington: { slug: "washington", name: "Washington", postal: "WA", avgRateCentsPerKwh: 13.81, updated: "January 2026", ...COMMON_STATE_METADATA },
  "west-virginia": { slug: "west-virginia", name: "West Virginia", postal: "WV", avgRateCentsPerKwh: 14.77, updated: "January 2026", ...COMMON_STATE_METADATA },
  wisconsin: { slug: "wisconsin", name: "Wisconsin", postal: "WI", avgRateCentsPerKwh: 18.2, updated: "January 2026", ...COMMON_STATE_METADATA },
  wyoming: { slug: "wyoming", name: "Wyoming", postal: "WY", avgRateCentsPerKwh: 12.85, updated: "January 2026", ...COMMON_STATE_METADATA },
};
