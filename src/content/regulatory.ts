export type RegulatoryEventType =
  | "rate_case_filed"
  | "hearing"
  | "order_issued"
  | "settlement"
  | "tariff_update"
  | "capacity_market"
  | "resource_adequacy"
  | "transmission"
  | "fuel_adjustment"
  | "demand_growth"
  | "other";

export const EVENT_TYPE_LABELS: Record<RegulatoryEventType, string> = {
  rate_case_filed: "Rate Case Filed",
  hearing: "Hearing",
  order_issued: "Order Issued",
  settlement: "Settlement",
  tariff_update: "Tariff Update",
  capacity_market: "Capacity Market",
  resource_adequacy: "Resource Adequacy",
  transmission: "Transmission",
  fuel_adjustment: "Fuel Adjustment",
  demand_growth: "Demand Growth",
  other: "Other",
};

export type RegulatoryEvent = {
  id: string;
  state: string;
  date: string;
  type: RegulatoryEventType;
  title: string;
  summary: string;
  lastReviewed: string;
  confidence: "low" | "medium" | "high";
  relatedInternalLinks?: { title: string; href: string }[];
};

export type RateCase = {
  id: string;
  state: string;
  docket?: string;
  utility?: string;
  filedDate?: string;
  status: "open" | "closed" | "unknown";
  summary: string;
  lastReviewed: string;
  confidence: "low" | "medium" | "high";
  relatedInternalLinks?: { title: string; href: string }[];
};

// Rate cases are sourced from verified regulatory filings. Until per-state
// docket data is integrated, this map is intentionally empty so consumers show
// the honest "No regulatory events tracked yet" / "Open rate cases: 0" state.
export const RATE_CASES: Record<string, RateCase[]> = {};

// Regulatory timelines are sourced from verified regulatory events. Until
// per-state event data is integrated, this map is intentionally empty so
// consumers show the honest "No regulatory events tracked yet" state.
export const REGULATORY_TIMELINES: Record<string, RegulatoryEvent[]> = {};

export function getRateCasesForState(stateSlug: string): RateCase[] {
  const cases = RATE_CASES[stateSlug] ?? [];
  return [...cases].sort((a, b) => {
    const da = a.filedDate ? Date.parse(a.filedDate) : 0;
    const db = b.filedDate ? Date.parse(b.filedDate) : 0;
    return db - da;
  });
}

export function getTimelineForState(stateSlug: string): RegulatoryEvent[] {
  const events = REGULATORY_TIMELINES[stateSlug] ?? [];
  return [...events].sort((a, b) => b.date.localeCompare(a.date));
}
