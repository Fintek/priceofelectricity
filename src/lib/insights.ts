import type { StateRecord } from "@/data/types";

export type RateTier = "low" | "medium" | "high";

export function getRateTier(avgRateCentsPerKwh: number): RateTier {
  if (avgRateCentsPerKwh < 15) {
    return "low";
  }
  if (avgRateCentsPerKwh <= 22) {
    return "medium";
  }
  return "high";
}

export function getRateTierLabel(tier: RateTier): "Low" | "Medium" | "High" {
  if (tier === "low") {
    return "Low";
  }
  if (tier === "medium") {
    return "Medium";
  }
  return "High";
}

export function getExampleBills(avgRateCentsPerKwh: number): {
  kwh: number;
  dollars: number;
}[] {
  return [500, 750, 1000, 1500].map((kwh) => ({
    kwh,
    dollars: (kwh * avgRateCentsPerKwh) / 100,
  }));
}

export function getShortSummary(state: StateRecord): string {
  const tier = getRateTierLabel(getRateTier(state.avgRateCentsPerKwh)).toLowerCase();
  const billAt900 = (900 * state.avgRateCentsPerKwh) / 100;
  return `${state.name}'s average residential electricity price is ${state.avgRateCentsPerKwh}¢/kWh as of ${state.updated}. This places ${state.name} in the ${tier} rate tier based on the same threshold model used across all states. At 900 kWh of monthly usage, the estimated energy-only charge is about $${billAt900.toFixed(2)}.`;
}
