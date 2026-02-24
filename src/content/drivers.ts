export type DriverCategory =
  | "generation_mix"
  | "fuel_costs"
  | "transmission_constraints"
  | "distribution_costs"
  | "capacity_markets"
  | "regulatory_rate_cases"
  | "demand_growth"
  | "data_centers_ai"
  | "weather_peaks"
  | "taxes_fees"
  | "other";

export type DriverTaxonomyEntry = {
  category: DriverCategory;
  label: string;
  description: string;
};

export const DRIVER_TAXONOMY: DriverTaxonomyEntry[] = [
  {
    category: "generation_mix",
    label: "Generation Mix",
    description:
      "The blend of energy sources (coal, natural gas, nuclear, renewables) used to generate electricity. States reliant on higher-cost fuels tend to have higher rates.",
  },
  {
    category: "fuel_costs",
    label: "Fuel Costs",
    description:
      "The cost of primary fuels such as natural gas, coal, and uranium. Fuel price volatility can pass through to retail electricity rates via fuel adjustment clauses.",
  },
  {
    category: "transmission_constraints",
    label: "Transmission Constraints",
    description:
      "Bottlenecks in the high-voltage transmission network that can create locational price differences and increase congestion costs.",
  },
  {
    category: "distribution_costs",
    label: "Distribution Costs",
    description:
      "The cost of maintaining and upgrading local distribution infrastructure (poles, wires, transformers) that delivers power to homes and businesses.",
  },
  {
    category: "capacity_markets",
    label: "Capacity Markets",
    description:
      "Markets that compensate generators for being available to produce power during peak demand. Capacity costs flow through to retail rates in organized markets.",
  },
  {
    category: "regulatory_rate_cases",
    label: "Regulatory Rate Cases",
    description:
      "Formal proceedings in which utilities request permission to change their rates. Approved rate cases directly affect what consumers pay.",
  },
  {
    category: "demand_growth",
    label: "Demand Growth",
    description:
      "Changes in overall electricity demand driven by population growth, economic activity, electrification trends, or large new loads connecting to the grid.",
  },
  {
    category: "data_centers_ai",
    label: "Data Centers & AI",
    description:
      "Large-scale data center and AI workload growth that may increase local or regional electricity demand, potentially affecting transmission planning and pricing.",
  },
  {
    category: "weather_peaks",
    label: "Weather & Peak Demand",
    description:
      "Extreme temperatures drive peak electricity demand for heating and cooling, which can stress the grid and trigger higher wholesale prices.",
  },
  {
    category: "taxes_fees",
    label: "Taxes & Fees",
    description:
      "State and local taxes, surcharges, renewable energy mandates, and public benefit charges that are added to electricity bills beyond the energy rate.",
  },
  {
    category: "other",
    label: "Other",
    description:
      "Miscellaneous factors that may influence electricity prices in specific states, including geographic isolation, import dependence, or unique market structures.",
  },
];

export const DRIVER_CATEGORY_LABELS: Record<DriverCategory, string> =
  Object.fromEntries(
    DRIVER_TAXONOMY.map((t) => [t.category, t.label])
  ) as Record<DriverCategory, string>;

export type DriverSignal = {
  id: string;
  category: DriverCategory;
  title: string;
  explanation: string;
  confidence: "low" | "medium" | "high";
  lastReviewed: string;
  related: { title: string; href: string }[];
};

export const STATE_DRIVERS: Record<string, DriverSignal[]> = {
  texas: [
    {
      id: "tx-gen-mix",
      category: "generation_mix",
      title: "Natural gas dominance in generation",
      explanation:
        "Texas generates a large share of its electricity from natural gas. This means retail rates can be sensitive to movements in natural gas prices, particularly during periods of high demand.",
      confidence: "high",
      lastReviewed: "2026-02-22",
      related: [
        { title: "Texas electricity rates", href: "/texas" },
        { title: "Texas regulatory overview", href: "/regulatory/texas" },
      ],
    },
    {
      id: "tx-demand-growth",
      category: "demand_growth",
      title: "Population and economic growth driving load increases",
      explanation:
        "Texas has experienced sustained population and economic growth, which tends to increase overall electricity demand and may contribute to higher peak loads and infrastructure investment needs.",
      confidence: "medium",
      lastReviewed: "2026-02-22",
      related: [
        { title: "National overview", href: "/national" },
      ],
    },
    {
      id: "tx-weather",
      category: "weather_peaks",
      title: "Summer cooling demand and winter storm risk",
      explanation:
        "Extreme summer heat drives high air conditioning demand, while rare but severe winter events can stress the grid. Both patterns can affect wholesale prices and long-term planning costs.",
      confidence: "high",
      lastReviewed: "2026-02-22",
      related: [
        { title: "Texas electricity rates", href: "/texas" },
      ],
    },
    {
      id: "tx-capacity",
      category: "capacity_markets",
      title: "Energy-only market structure (ERCOT)",
      explanation:
        "Texas operates an energy-only wholesale market through ERCOT, without a traditional capacity market. This design can lead to higher price volatility during scarcity events.",
      confidence: "high",
      lastReviewed: "2026-02-22",
      related: [
        { title: "Methodology", href: "/methodology" },
      ],
    },
  ],
  california: [
    {
      id: "ca-gen-mix",
      category: "generation_mix",
      title: "Renewable integration and natural gas backup",
      explanation:
        "California has a high share of solar and wind generation, supplemented by natural gas. The cost of integrating variable renewables, including grid balancing and storage, can contribute to higher retail rates.",
      confidence: "high",
      lastReviewed: "2026-02-22",
      related: [
        { title: "California electricity rates", href: "/california" },
      ],
    },
    {
      id: "ca-taxes",
      category: "taxes_fees",
      title: "Public purpose programs and surcharges",
      explanation:
        "California adds several surcharges to electricity bills for wildfire mitigation, public benefit programs, and renewable energy mandates. These can significantly increase the total cost beyond the base energy rate.",
      confidence: "high",
      lastReviewed: "2026-02-22",
      related: [
        { title: "California regulatory overview", href: "/regulatory/california" },
      ],
    },
    {
      id: "ca-transmission",
      category: "transmission_constraints",
      title: "Transmission investment for wildfire hardening",
      explanation:
        "Utilities in California have invested heavily in transmission and distribution hardening to reduce wildfire risk. These capital costs are recovered through rates.",
      confidence: "medium",
      lastReviewed: "2026-02-22",
      related: [
        { title: "California electricity rates", href: "/california" },
      ],
    },
  ],
  "new-york": [
    {
      id: "ny-distribution",
      category: "distribution_costs",
      title: "High-density distribution infrastructure costs",
      explanation:
        "Maintaining and upgrading underground distribution networks in dense urban areas like New York City is significantly more expensive than overhead lines in less populated regions.",
      confidence: "high",
      lastReviewed: "2026-02-22",
      related: [
        { title: "New York electricity rates", href: "/new-york" },
      ],
    },
    {
      id: "ny-capacity",
      category: "capacity_markets",
      title: "NYISO capacity market obligations",
      explanation:
        "New York participates in the NYISO capacity market, where generators are compensated for availability. Capacity costs are passed through to retail customers and can be a meaningful component of total rates.",
      confidence: "high",
      lastReviewed: "2026-02-22",
      related: [
        { title: "New York regulatory overview", href: "/regulatory/new-york" },
      ],
    },
    {
      id: "ny-taxes",
      category: "taxes_fees",
      title: "State taxes and clean energy surcharges",
      explanation:
        "New York applies state-level taxes and surcharges related to clean energy programs and system benefit charges that increase the all-in cost of electricity.",
      confidence: "medium",
      lastReviewed: "2026-02-22",
      related: [
        { title: "New York electricity rates", href: "/new-york" },
      ],
    },
  ],
  virginia: [
    {
      id: "va-data-centers",
      category: "data_centers_ai",
      title: "Data center cluster and potential demand growth",
      explanation:
        "Virginia hosts a significant concentration of data centers, particularly in Northern Virginia. This level of commercial load may be associated with increased electricity demand in the region, though the extent to which it affects residential rates depends on regulatory and market structure. No specific quantitative claims are made.",
      confidence: "low",
      lastReviewed: "2026-02-22",
      related: [
        { title: "AI & Energy overview", href: "/v/ai-energy/overview" },
        { title: "Where prices may rise", href: "/v/ai-energy/where-prices-rise" },
        { title: "Virginia regulatory overview", href: "/regulatory/virginia" },
      ],
    },
    {
      id: "va-demand-growth",
      category: "demand_growth",
      title: "Large-load interconnection requests",
      explanation:
        "Grid operators in Virginia may be evaluating interconnection requests from large commercial customers. Sustained demand growth can influence transmission planning and long-term rate trajectories.",
      confidence: "low",
      lastReviewed: "2026-02-22",
      related: [
        { title: "AI & Energy load growth", href: "/v/ai-energy/load-growth" },
        { title: "Virginia electricity rates", href: "/virginia" },
      ],
    },
    {
      id: "va-regulatory",
      category: "regulatory_rate_cases",
      title: "Utility rate case activity",
      explanation:
        "Virginia utilities periodically file rate cases with the State Corporation Commission. Approved adjustments can reflect infrastructure investment, fuel costs, and changing load profiles.",
      confidence: "medium",
      lastReviewed: "2026-02-22",
      related: [
        { title: "Virginia regulatory overview", href: "/regulatory/virginia" },
      ],
    },
  ],
};

const CONFIDENCE_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function getDriversForState(stateSlug: string): DriverSignal[] {
  const signals = STATE_DRIVERS[stateSlug] ?? [];
  return [...signals].sort((a, b) => {
    const cDiff = CONFIDENCE_ORDER[a.confidence] - CONFIDENCE_ORDER[b.confidence];
    if (cDiff !== 0) return cDiff;
    return b.lastReviewed.localeCompare(a.lastReviewed);
  });
}

export function getTopDriversForState(
  stateSlug: string,
  n: number
): DriverSignal[] {
  return getDriversForState(stateSlug).slice(0, n);
}
