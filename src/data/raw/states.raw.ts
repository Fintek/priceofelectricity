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
    "Estimates use the EIA average all-in residential rate (delivery included); they don't add separately billed taxes, fixed charges, or other utility fees, which vary by utility.",
} as const;

export const RAW_STATES: Record<string, StateRecord> = {
  alabama: { slug: "alabama", name: "Alabama", postal: "AL", avgRateCentsPerKwh: 17.15, updated: "March 2026", ...COMMON_STATE_METADATA },
  alaska: { slug: "alaska", name: "Alaska", postal: "AK", avgRateCentsPerKwh: 27.17, updated: "March 2026", ...COMMON_STATE_METADATA },
  arizona: { slug: "arizona", name: "Arizona", postal: "AZ", avgRateCentsPerKwh: 15.59, updated: "March 2026", ...COMMON_STATE_METADATA },
  arkansas: { slug: "arkansas", name: "Arkansas", postal: "AR", avgRateCentsPerKwh: 13.63, updated: "March 2026", ...COMMON_STATE_METADATA },
  california: { slug: "california", name: "California", postal: "CA", avgRateCentsPerKwh: 33.35, updated: "March 2026", ...COMMON_STATE_METADATA },
  colorado: { slug: "colorado", name: "Colorado", postal: "CO", avgRateCentsPerKwh: 16.74, updated: "March 2026", ...COMMON_STATE_METADATA },
  connecticut: { slug: "connecticut", name: "Connecticut", postal: "CT", avgRateCentsPerKwh: 30.47, updated: "March 2026", ...COMMON_STATE_METADATA },
  delaware: { slug: "delaware", name: "Delaware", postal: "DE", avgRateCentsPerKwh: 17.64, updated: "March 2026", ...COMMON_STATE_METADATA },
  "district-of-columbia": { slug: "district-of-columbia", name: "District of Columbia", postal: "DC", avgRateCentsPerKwh: 25, updated: "March 2026", ...COMMON_STATE_METADATA },
  florida: { slug: "florida", name: "Florida", postal: "FL", avgRateCentsPerKwh: 14.86, updated: "March 2026", ...COMMON_STATE_METADATA },
  georgia: { slug: "georgia", name: "Georgia", postal: "GA", avgRateCentsPerKwh: 15.01, updated: "March 2026", ...COMMON_STATE_METADATA },
  hawaii: { slug: "hawaii", name: "Hawaii", postal: "HI", avgRateCentsPerKwh: 42.23, updated: "March 2026", ...COMMON_STATE_METADATA },
  idaho: { slug: "idaho", name: "Idaho", postal: "ID", avgRateCentsPerKwh: 13.01, updated: "March 2026", ...COMMON_STATE_METADATA },
  illinois: { slug: "illinois", name: "Illinois", postal: "IL", avgRateCentsPerKwh: 18.86, updated: "March 2026", ...COMMON_STATE_METADATA },
  indiana: { slug: "indiana", name: "Indiana", postal: "IN", avgRateCentsPerKwh: 17.85, updated: "March 2026", ...COMMON_STATE_METADATA },
  iowa: { slug: "iowa", name: "Iowa", postal: "IA", avgRateCentsPerKwh: 13.42, updated: "March 2026", ...COMMON_STATE_METADATA },
  kansas: { slug: "kansas", name: "Kansas", postal: "KS", avgRateCentsPerKwh: 15.34, updated: "March 2026", ...COMMON_STATE_METADATA },
  kentucky: { slug: "kentucky", name: "Kentucky", postal: "KY", avgRateCentsPerKwh: 14.88, updated: "March 2026", ...COMMON_STATE_METADATA },
  louisiana: { slug: "louisiana", name: "Louisiana", postal: "LA", avgRateCentsPerKwh: 14.16, updated: "March 2026", ...COMMON_STATE_METADATA },
  maine: { slug: "maine", name: "Maine", postal: "ME", avgRateCentsPerKwh: 28.32, updated: "March 2026", ...COMMON_STATE_METADATA },
  maryland: { slug: "maryland", name: "Maryland", postal: "MD", avgRateCentsPerKwh: 22.2, updated: "March 2026", ...COMMON_STATE_METADATA },
  massachusetts: { slug: "massachusetts", name: "Massachusetts", postal: "MA", avgRateCentsPerKwh: 30.21, updated: "March 2026", ...COMMON_STATE_METADATA },
  michigan: { slug: "michigan", name: "Michigan", postal: "MI", avgRateCentsPerKwh: 21.2, updated: "March 2026", ...COMMON_STATE_METADATA },
  minnesota: { slug: "minnesota", name: "Minnesota", postal: "MN", avgRateCentsPerKwh: 15.08, updated: "March 2026", ...COMMON_STATE_METADATA },
  mississippi: { slug: "mississippi", name: "Mississippi", postal: "MS", avgRateCentsPerKwh: 16.3, updated: "March 2026", ...COMMON_STATE_METADATA },
  missouri: { slug: "missouri", name: "Missouri", postal: "MO", avgRateCentsPerKwh: 13.44, updated: "March 2026", ...COMMON_STATE_METADATA },
  montana: { slug: "montana", name: "Montana", postal: "MT", avgRateCentsPerKwh: 13.48, updated: "March 2026", ...COMMON_STATE_METADATA },
  nebraska: { slug: "nebraska", name: "Nebraska", postal: "NE", avgRateCentsPerKwh: 13.1, updated: "March 2026", ...COMMON_STATE_METADATA },
  nevada: { slug: "nevada", name: "Nevada", postal: "NV", avgRateCentsPerKwh: 14.17, updated: "March 2026", ...COMMON_STATE_METADATA },
  "new-hampshire": { slug: "new-hampshire", name: "New Hampshire", postal: "NH", avgRateCentsPerKwh: 26.92, updated: "March 2026", ...COMMON_STATE_METADATA },
  "new-jersey": { slug: "new-jersey", name: "New Jersey", postal: "NJ", avgRateCentsPerKwh: 23.49, updated: "March 2026", ...COMMON_STATE_METADATA },
  "new-mexico": { slug: "new-mexico", name: "New Mexico", postal: "NM", avgRateCentsPerKwh: 14.81, updated: "March 2026", ...COMMON_STATE_METADATA },
  "new-york": { slug: "new-york", name: "New York", postal: "NY", avgRateCentsPerKwh: 28.55, updated: "March 2026", ...COMMON_STATE_METADATA },
  "north-carolina": { slug: "north-carolina", name: "North Carolina", postal: "NC", avgRateCentsPerKwh: 16, updated: "March 2026", ...COMMON_STATE_METADATA },
  "north-dakota": { slug: "north-dakota", name: "North Dakota", postal: "ND", avgRateCentsPerKwh: 11.95, updated: "March 2026", ...COMMON_STATE_METADATA },
  ohio: { slug: "ohio", name: "Ohio", postal: "OH", avgRateCentsPerKwh: 18.78, updated: "March 2026", ...COMMON_STATE_METADATA },
  oklahoma: { slug: "oklahoma", name: "Oklahoma", postal: "OK", avgRateCentsPerKwh: 13.56, updated: "March 2026", ...COMMON_STATE_METADATA },
  oregon: { slug: "oregon", name: "Oregon", postal: "OR", avgRateCentsPerKwh: 14.89, updated: "March 2026", ...COMMON_STATE_METADATA },
  pennsylvania: { slug: "pennsylvania", name: "Pennsylvania", postal: "PA", avgRateCentsPerKwh: 20.92, updated: "March 2026", ...COMMON_STATE_METADATA },
  "rhode-island": { slug: "rhode-island", name: "Rhode Island", postal: "RI", avgRateCentsPerKwh: 29.91, updated: "March 2026", ...COMMON_STATE_METADATA },
  "south-carolina": { slug: "south-carolina", name: "South Carolina", postal: "SC", avgRateCentsPerKwh: 16.45, updated: "March 2026", ...COMMON_STATE_METADATA },
  "south-dakota": { slug: "south-dakota", name: "South Dakota", postal: "SD", avgRateCentsPerKwh: 14.29, updated: "March 2026", ...COMMON_STATE_METADATA },
  tennessee: { slug: "tennessee", name: "Tennessee", postal: "TN", avgRateCentsPerKwh: 15.08, updated: "March 2026", ...COMMON_STATE_METADATA },
  texas: { slug: "texas", name: "Texas", postal: "TX", avgRateCentsPerKwh: 16.39, updated: "March 2026", ...COMMON_STATE_METADATA },
  utah: { slug: "utah", name: "Utah", postal: "UT", avgRateCentsPerKwh: 13.17, updated: "March 2026", ...COMMON_STATE_METADATA },
  vermont: { slug: "vermont", name: "Vermont", postal: "VT", avgRateCentsPerKwh: 24.11, updated: "March 2026", ...COMMON_STATE_METADATA },
  virginia: { slug: "virginia", name: "Virginia", postal: "VA", avgRateCentsPerKwh: 17.05, updated: "March 2026", ...COMMON_STATE_METADATA },
  washington: { slug: "washington", name: "Washington", postal: "WA", avgRateCentsPerKwh: 14.4, updated: "March 2026", ...COMMON_STATE_METADATA },
  "west-virginia": { slug: "west-virginia", name: "West Virginia", postal: "WV", avgRateCentsPerKwh: 16.37, updated: "March 2026", ...COMMON_STATE_METADATA },
  wisconsin: { slug: "wisconsin", name: "Wisconsin", postal: "WI", avgRateCentsPerKwh: 18.8, updated: "March 2026", ...COMMON_STATE_METADATA },
  wyoming: { slug: "wyoming", name: "Wyoming", postal: "WY", avgRateCentsPerKwh: 13.59, updated: "March 2026", ...COMMON_STATE_METADATA },
};
/**
 * Build-time anchors for residential EIA ingests (canonical CSV-derived).
 * `pipelineSynchronizedAtIso` is the newest ingest timestamp in rows; freshness UX should
 * anchor off this ISO string while `RAW_STATES[].updated` stays the latest EIA reporting month.
 * Optional `eiaReleasePublishedAtIso` is copied from `data/raw/eia/retail_res_monthly_latest_refresh.json`
 * when present (official EIA publication timing for the series cut, not a future data month).
 */
export const EIA_RESIDENTIAL_RETAIL_PRICE_DATA_META = {
  dataThroughYm: "2026-03",
  pipelineSynchronizedAtIso: "2026-05-28T13:54:57.371Z",
} as const;
