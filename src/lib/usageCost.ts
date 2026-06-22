/**
 * Pure usage-cost math and formatting (client- and server-safe).
 * Client components must import from here — not from stateLongtail.ts.
 */

/** Verbatim from LongtailStateTemplate Source & Method block on usage-cost pages. */
export const USAGE_COST_ESTIMATE_DISCLAIMER =
  "Estimates are energy-only and exclude delivery charges, taxes, and fixed utility fees.";

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
