/**
 * Pure usage-cost math and formatting (client- and server-safe).
 * Client components must import from here — not from stateLongtail.ts.
 */

/** Canonical estimate disclaimer — keep in sync with RAW_STATES_DISCLAIMER in scripts/eia/generate_snapshots_from_eia_csv.ts and states.raw.ts. */
export const USAGE_COST_ESTIMATE_DISCLAIMER =
  "Estimates use the EIA average all-in residential rate (delivery included); they don't add separately billed taxes, fixed charges, or other utility fees, which vary by utility.";

/** Long-form disclaimer for methodology and policy pages. */
export const USAGE_COST_ESTIMATE_DISCLAIMER_LONG =
  "These figures use the EIA average residential retail rate (total revenue ÷ kWh), which already includes delivery (transmission and distribution) charges. Estimates multiply usage by this all-in rate; they don't add separately billed taxes, fixed charges, or other utility fees, which vary by utility.";

/** Short suffix for inline disclaimers after rate or bill figures. */
export const USAGE_COST_ESTIMATE_DISCLAIMER_SHORT =
  "That uses the EIA average all-in residential rate (delivery included); taxes and fixed fees still vary by utility.";

export function formatRate(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "N/A";
  return `${value.toFixed(2)} ¢/kWh`;
}

export function formatUsd(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "N/A";
  return `$${value.toFixed(2)}`;
}

export function calculateUsageCost(avgRateCentsPerKwh: number | null, kwh: number): number | null {
  if (avgRateCentsPerKwh == null || Number.isNaN(avgRateCentsPerKwh)) return null;
  return (avgRateCentsPerKwh / 100) * kwh;
}
