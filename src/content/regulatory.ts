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

export const RATE_CASES: Record<string, RateCase[]> = {
  texas: [
    {
      id: "tx-rc-001",
      state: "texas",
      docket: "Placeholder-TX-2026-001",
      utility: "Placeholder Utility Co.",
      filedDate: "2026-01-15",
      status: "open",
      summary:
        "Placeholder entry. This is not a real rate case. Replace with actual filings when data becomes available.",
      lastReviewed: "2026-02-22",
      confidence: "low",
      relatedInternalLinks: [
        { title: "Texas electricity rates", href: "/texas" },
      ],
    },
    {
      id: "tx-rc-002",
      state: "texas",
      docket: "Placeholder-TX-2025-002",
      utility: "Sample Electric Inc.",
      filedDate: "2025-06-01",
      status: "closed",
      summary:
        "Placeholder entry. Illustrates a closed rate case. Replace with actual data.",
      lastReviewed: "2026-02-22",
      confidence: "low",
    },
  ],
  california: [
    {
      id: "ca-rc-001",
      state: "california",
      docket: "Placeholder-CA-2026-001",
      utility: "Placeholder California Utility",
      filedDate: "2026-02-01",
      status: "open",
      summary:
        "Placeholder entry. Demonstrates an open case in California. Replace with actual filings.",
      lastReviewed: "2026-02-22",
      confidence: "low",
      relatedInternalLinks: [
        { title: "California electricity rates", href: "/california" },
      ],
    },
  ],
  "new-york": [
    {
      id: "ny-rc-001",
      state: "new-york",
      docket: "Placeholder-NY-2025-001",
      utility: "Demo Energy Corp.",
      filedDate: "2025-03-10",
      status: "closed",
      summary:
        "Placeholder entry. Shows a closed rate case for illustration purposes.",
      lastReviewed: "2026-02-22",
      confidence: "low",
    },
  ],
  virginia: [
    {
      id: "va-rc-001",
      state: "virginia",
      docket: "Placeholder-VA-2026-001",
      utility: "Placeholder Virginia Power",
      filedDate: "2026-01-20",
      status: "open",
      summary:
        "Placeholder entry. Virginia has seen growing interest in rate cases related to infrastructure investment. Replace with actual filings.",
      lastReviewed: "2026-02-22",
      confidence: "low",
      relatedInternalLinks: [
        { title: "Virginia electricity rates", href: "/virginia" },
        { title: "AI & Energy overview", href: "/v/ai-energy/overview" },
      ],
    },
  ],
};

export const REGULATORY_TIMELINES: Record<string, RegulatoryEvent[]> = {
  texas: [
    {
      id: "tx-tl-001",
      state: "texas",
      date: "2026-01",
      type: "rate_case_filed",
      title: "Placeholder: Rate case filing",
      summary:
        "Placeholder entry. A hypothetical rate case filing for illustration. Replace with real events.",
      lastReviewed: "2026-02-22",
      confidence: "low",
    },
    {
      id: "tx-tl-002",
      state: "texas",
      date: "2025-11",
      type: "order_issued",
      title: "Placeholder: Commission order",
      summary:
        "Placeholder entry. Illustrates a commission order event on the timeline.",
      lastReviewed: "2026-02-22",
      confidence: "low",
    },
    {
      id: "tx-tl-003",
      state: "texas",
      date: "2025-08",
      type: "demand_growth",
      title: "Placeholder: Data center load growth discussion",
      summary:
        "Placeholder entry. Grid operators may be evaluating the potential effects of large-scale data center interconnection requests on transmission planning. No specific claims are made.",
      lastReviewed: "2026-02-22",
      confidence: "low",
      relatedInternalLinks: [
        { title: "AI & Energy overview", href: "/v/ai-energy/overview" },
        { title: "Load growth analysis", href: "/v/ai-energy/load-growth" },
      ],
    },
  ],
  california: [
    {
      id: "ca-tl-001",
      state: "california",
      date: "2026-02",
      type: "rate_case_filed",
      title: "Placeholder: New filing submitted",
      summary:
        "Placeholder entry. Demonstrates a California timeline event. Replace with actual data.",
      lastReviewed: "2026-02-22",
      confidence: "low",
    },
    {
      id: "ca-tl-002",
      state: "california",
      date: "2025-09",
      type: "resource_adequacy",
      title: "Placeholder: Resource adequacy proceeding",
      summary:
        "Placeholder entry. California periodically reviews resource adequacy requirements that may influence future rate structures.",
      lastReviewed: "2026-02-22",
      confidence: "low",
    },
  ],
  "new-york": [
    {
      id: "ny-tl-001",
      state: "new-york",
      date: "2025-09",
      type: "order_issued",
      title: "Placeholder: Rate case decision",
      summary:
        "Placeholder entry. Shows an order event on the New York timeline.",
      lastReviewed: "2026-02-22",
      confidence: "low",
    },
  ],
  virginia: [
    {
      id: "va-tl-001",
      state: "virginia",
      date: "2026-01",
      type: "rate_case_filed",
      title: "Placeholder: Rate case filing",
      summary:
        "Placeholder entry. Virginia utilities may file rate cases that reflect infrastructure investment. Replace with actual data.",
      lastReviewed: "2026-02-22",
      confidence: "low",
    },
    {
      id: "va-tl-002",
      state: "virginia",
      date: "2025-10",
      type: "demand_growth",
      title: "Placeholder: Data center demand growth signals",
      summary:
        "Placeholder entry. Virginia is among the states where data center development may be associated with increased electricity demand. The extent to which this affects residential rates depends on regulatory and market structure. No specific claims are made.",
      lastReviewed: "2026-02-22",
      confidence: "low",
      relatedInternalLinks: [
        { title: "AI & Energy overview", href: "/v/ai-energy/overview" },
        {
          title: "Where prices may rise",
          href: "/v/ai-energy/where-prices-rise",
        },
      ],
    },
    {
      id: "va-tl-003",
      state: "virginia",
      date: "2025-06",
      type: "transmission",
      title: "Placeholder: Transmission planning update",
      summary:
        "Placeholder entry. Transmission planning processes may consider growing load from large commercial customers including data centers. Replace with actual data.",
      lastReviewed: "2026-02-22",
      confidence: "low",
    },
  ],
};

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
