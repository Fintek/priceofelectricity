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
  alabama: { slug: "alabama", name: "Alabama", postal: "AL", avgRateCentsPerKwh: 16.18, updated: "February 2026", ...COMMON_STATE_METADATA },
  alaska: { slug: "alaska", name: "Alaska", postal: "AK", avgRateCentsPerKwh: 25.79, updated: "February 2026", ...COMMON_STATE_METADATA },
  arizona: { slug: "arizona", name: "Arizona", postal: "AZ", avgRateCentsPerKwh: 16.03, updated: "February 2026", ...COMMON_STATE_METADATA },
  arkansas: { slug: "arkansas", name: "Arkansas", postal: "AR", avgRateCentsPerKwh: 12.73, updated: "February 2026", ...COMMON_STATE_METADATA },
  california: { slug: "california", name: "California", postal: "CA", avgRateCentsPerKwh: 33.22, updated: "February 2026", ...COMMON_STATE_METADATA },
  colorado: { slug: "colorado", name: "Colorado", postal: "CO", avgRateCentsPerKwh: 16.79, updated: "February 2026", ...COMMON_STATE_METADATA },
  connecticut: { slug: "connecticut", name: "Connecticut", postal: "CT", avgRateCentsPerKwh: 30.77, updated: "February 2026", ...COMMON_STATE_METADATA },
  delaware: { slug: "delaware", name: "Delaware", postal: "DE", avgRateCentsPerKwh: 16.27, updated: "February 2026", ...COMMON_STATE_METADATA },
  florida: { slug: "florida", name: "Florida", postal: "FL", avgRateCentsPerKwh: 15.8, updated: "February 2026", ...COMMON_STATE_METADATA },
  georgia: { slug: "georgia", name: "Georgia", postal: "GA", avgRateCentsPerKwh: 14.13, updated: "February 2026", ...COMMON_STATE_METADATA },
  hawaii: { slug: "hawaii", name: "Hawaii", postal: "HI", avgRateCentsPerKwh: 43, updated: "February 2026", ...COMMON_STATE_METADATA },
  idaho: { slug: "idaho", name: "Idaho", postal: "ID", avgRateCentsPerKwh: 12.63, updated: "February 2026", ...COMMON_STATE_METADATA },
  illinois: { slug: "illinois", name: "Illinois", postal: "IL", avgRateCentsPerKwh: 17.83, updated: "February 2026", ...COMMON_STATE_METADATA },
  indiana: { slug: "indiana", name: "Indiana", postal: "IN", avgRateCentsPerKwh: 16.06, updated: "February 2026", ...COMMON_STATE_METADATA },
  iowa: { slug: "iowa", name: "Iowa", postal: "IA", avgRateCentsPerKwh: 12.74, updated: "February 2026", ...COMMON_STATE_METADATA },
  kansas: { slug: "kansas", name: "Kansas", postal: "KS", avgRateCentsPerKwh: 15.11, updated: "February 2026", ...COMMON_STATE_METADATA },
  kentucky: { slug: "kentucky", name: "Kentucky", postal: "KY", avgRateCentsPerKwh: 13.42, updated: "February 2026", ...COMMON_STATE_METADATA },
  louisiana: { slug: "louisiana", name: "Louisiana", postal: "LA", avgRateCentsPerKwh: 12.87, updated: "February 2026", ...COMMON_STATE_METADATA },
  maine: { slug: "maine", name: "Maine", postal: "ME", avgRateCentsPerKwh: 32.17, updated: "February 2026", ...COMMON_STATE_METADATA },
  maryland: { slug: "maryland", name: "Maryland", postal: "MD", avgRateCentsPerKwh: 20.08, updated: "February 2026", ...COMMON_STATE_METADATA },
  massachusetts: { slug: "massachusetts", name: "Massachusetts", postal: "MA", avgRateCentsPerKwh: 30.46, updated: "February 2026", ...COMMON_STATE_METADATA },
  michigan: { slug: "michigan", name: "Michigan", postal: "MI", avgRateCentsPerKwh: 20, updated: "February 2026", ...COMMON_STATE_METADATA },
  minnesota: { slug: "minnesota", name: "Minnesota", postal: "MN", avgRateCentsPerKwh: 15.39, updated: "February 2026", ...COMMON_STATE_METADATA },
  mississippi: { slug: "mississippi", name: "Mississippi", postal: "MS", avgRateCentsPerKwh: 14.72, updated: "February 2026", ...COMMON_STATE_METADATA },
  missouri: { slug: "missouri", name: "Missouri", postal: "MO", avgRateCentsPerKwh: 12.17, updated: "February 2026", ...COMMON_STATE_METADATA },
  montana: { slug: "montana", name: "Montana", postal: "MT", avgRateCentsPerKwh: 13.33, updated: "February 2026", ...COMMON_STATE_METADATA },
  nebraska: { slug: "nebraska", name: "Nebraska", postal: "NE", avgRateCentsPerKwh: 11.79, updated: "February 2026", ...COMMON_STATE_METADATA },
  nevada: { slug: "nevada", name: "Nevada", postal: "NV", avgRateCentsPerKwh: 14.38, updated: "February 2026", ...COMMON_STATE_METADATA },
  "new-hampshire": { slug: "new-hampshire", name: "New Hampshire", postal: "NH", avgRateCentsPerKwh: 26.52, updated: "February 2026", ...COMMON_STATE_METADATA },
  "new-jersey": { slug: "new-jersey", name: "New Jersey", postal: "NJ", avgRateCentsPerKwh: 23.12, updated: "February 2026", ...COMMON_STATE_METADATA },
  "new-mexico": { slug: "new-mexico", name: "New Mexico", postal: "NM", avgRateCentsPerKwh: 15.07, updated: "February 2026", ...COMMON_STATE_METADATA },
  "new-york": { slug: "new-york", name: "New York", postal: "NY", avgRateCentsPerKwh: 29.99, updated: "February 2026", ...COMMON_STATE_METADATA },
  "north-carolina": { slug: "north-carolina", name: "North Carolina", postal: "NC", avgRateCentsPerKwh: 14.64, updated: "February 2026", ...COMMON_STATE_METADATA },
  "north-dakota": { slug: "north-dakota", name: "North Dakota", postal: "ND", avgRateCentsPerKwh: 11.64, updated: "February 2026", ...COMMON_STATE_METADATA },
  ohio: { slug: "ohio", name: "Ohio", postal: "OH", avgRateCentsPerKwh: 17.52, updated: "February 2026", ...COMMON_STATE_METADATA },
  oklahoma: { slug: "oklahoma", name: "Oklahoma", postal: "OK", avgRateCentsPerKwh: 12.89, updated: "February 2026", ...COMMON_STATE_METADATA },
  oregon: { slug: "oregon", name: "Oregon", postal: "OR", avgRateCentsPerKwh: 14.64, updated: "February 2026", ...COMMON_STATE_METADATA },
  pennsylvania: { slug: "pennsylvania", name: "Pennsylvania", postal: "PA", avgRateCentsPerKwh: 20.3, updated: "February 2026", ...COMMON_STATE_METADATA },
  "rhode-island": { slug: "rhode-island", name: "Rhode Island", postal: "RI", avgRateCentsPerKwh: 29.45, updated: "February 2026", ...COMMON_STATE_METADATA },
  "south-carolina": { slug: "south-carolina", name: "South Carolina", postal: "SC", avgRateCentsPerKwh: 16.15, updated: "February 2026", ...COMMON_STATE_METADATA },
  "south-dakota": { slug: "south-dakota", name: "South Dakota", postal: "SD", avgRateCentsPerKwh: 13.24, updated: "February 2026", ...COMMON_STATE_METADATA },
  tennessee: { slug: "tennessee", name: "Tennessee", postal: "TN", avgRateCentsPerKwh: 12.82, updated: "February 2026", ...COMMON_STATE_METADATA },
  texas: { slug: "texas", name: "Texas", postal: "TX", avgRateCentsPerKwh: 15.41, updated: "February 2026", ...COMMON_STATE_METADATA },
  utah: { slug: "utah", name: "Utah", postal: "UT", avgRateCentsPerKwh: 13.33, updated: "February 2026", ...COMMON_STATE_METADATA },
  vermont: { slug: "vermont", name: "Vermont", postal: "VT", avgRateCentsPerKwh: 23.27, updated: "February 2026", ...COMMON_STATE_METADATA },
  virginia: { slug: "virginia", name: "Virginia", postal: "VA", avgRateCentsPerKwh: 15.96, updated: "February 2026", ...COMMON_STATE_METADATA },
  washington: { slug: "washington", name: "Washington", postal: "WA", avgRateCentsPerKwh: 14.11, updated: "February 2026", ...COMMON_STATE_METADATA },
  "west-virginia": { slug: "west-virginia", name: "West Virginia", postal: "WV", avgRateCentsPerKwh: 14.41, updated: "February 2026", ...COMMON_STATE_METADATA },
  wisconsin: { slug: "wisconsin", name: "Wisconsin", postal: "WI", avgRateCentsPerKwh: 18.74, updated: "February 2026", ...COMMON_STATE_METADATA },
  wyoming: { slug: "wyoming", name: "Wyoming", postal: "WY", avgRateCentsPerKwh: 13.04, updated: "February 2026", ...COMMON_STATE_METADATA },
};
