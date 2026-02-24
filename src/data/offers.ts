export type OfferCategory = "plans" | "solar" | "efficiency" | "moving" | "other";

export type Offer = {
  id: string;
  stateSlug?: string;
  title: string;
  description: string;
  destinationUrl: string;
  category: OfferCategory;
  active: boolean;
};

export const OFFERS: Offer[] = [
  // ── National offers ──────────────────────────────────────
  {
    id: "nat-plans-compare",
    title: "Compare Electricity Plans",
    description:
      "Placeholder — compare fixed and variable electricity plans from multiple providers.",
    destinationUrl: "https://example.com/compare-plans",
    category: "plans",
    active: true,
  },
  {
    id: "nat-solar-estimate",
    title: "Free Solar Savings Estimate",
    description:
      "Placeholder — get an estimate of potential solar savings for your home.",
    destinationUrl: "https://example.com/solar-estimate",
    category: "solar",
    active: true,
  },
  {
    id: "nat-efficiency-audit",
    title: "Home Energy Audit",
    description:
      "Placeholder — find out where your home loses energy and how to fix it.",
    destinationUrl: "https://example.com/energy-audit",
    category: "efficiency",
    active: true,
  },
  {
    id: "nat-moving-utility-setup",
    title: "Set Up Utilities When Moving",
    description:
      "Placeholder — connect electricity, gas, and internet at your new address in one step.",
    destinationUrl: "https://example.com/moving-utilities",
    category: "moving",
    active: true,
  },
  {
    id: "nat-green-energy",
    title: "Switch to Green Energy",
    description:
      "Placeholder — choose a 100% renewable electricity plan where available.",
    destinationUrl: "https://example.com/green-energy",
    category: "plans",
    active: true,
  },
  {
    id: "nat-smart-thermostat",
    title: "Smart Thermostat Savings",
    description:
      "Placeholder — save on heating and cooling with a programmable smart thermostat.",
    destinationUrl: "https://example.com/smart-thermostat",
    category: "efficiency",
    active: true,
  },
  {
    id: "nat-ev-charging",
    title: "EV Home Charging Plans",
    description:
      "Placeholder — find electricity plans optimized for overnight EV charging.",
    destinationUrl: "https://example.com/ev-charging",
    category: "other",
    active: true,
  },
  {
    id: "nat-home-battery",
    title: "Home Battery Storage",
    description:
      "Placeholder — explore home battery options to store solar energy and reduce peak-hour costs.",
    destinationUrl: "https://example.com/home-battery",
    category: "efficiency",
    active: true,
  },
  {
    id: "nat-weatherization",
    title: "Home Weatherization Programs",
    description:
      "Placeholder — check eligibility for federally funded weatherization assistance in your area.",
    destinationUrl: "https://example.com/weatherization",
    category: "efficiency",
    active: true,
  },

  // ── Texas-specific offers ────────────────────────────────
  {
    id: "tx-fixed-rate",
    stateSlug: "texas",
    title: "Texas Fixed-Rate Plans",
    description:
      "Placeholder — lock in a fixed electricity rate with a Texas retail provider.",
    destinationUrl: "https://example.com/texas-fixed-rate",
    category: "plans",
    active: true,
  },
  {
    id: "tx-variable-rate",
    stateSlug: "texas",
    title: "Texas Variable-Rate Plans",
    description:
      "Placeholder — flexible month-to-month electricity in the Texas deregulated market.",
    destinationUrl: "https://example.com/texas-variable-rate",
    category: "plans",
    active: true,
  },
  {
    id: "tx-solar-install",
    stateSlug: "texas",
    title: "Texas Solar Installation",
    description:
      "Placeholder — get quotes from Texas solar installers and compare savings.",
    destinationUrl: "https://example.com/texas-solar",
    category: "solar",
    active: true,
  },
  {
    id: "tx-prepaid-electric",
    stateSlug: "texas",
    title: "Texas Prepaid Electricity",
    description:
      "Placeholder — pay-as-you-go electricity with no credit check required in Texas.",
    destinationUrl: "https://example.com/texas-prepaid",
    category: "plans",
    active: true,
  },
  {
    id: "tx-green-plans",
    stateSlug: "texas",
    title: "Texas Green Energy Plans",
    description:
      "Placeholder — 100% renewable energy plans available in the ERCOT market.",
    destinationUrl: "https://example.com/texas-green",
    category: "plans",
    active: true,
  },

  // ── California-specific offers ─────────────────────────────
  {
    id: "ca-solar-install",
    stateSlug: "california",
    title: "California Solar Installation Quotes",
    description:
      "Placeholder — compare solar installation quotes from California-licensed contractors.",
    destinationUrl: "https://example.com/california-solar",
    category: "solar",
    active: true,
  },
  {
    id: "ca-solar-battery",
    stateSlug: "california",
    title: "California Solar + Battery Bundles",
    description:
      "Placeholder — pair rooftop solar with home battery storage under California incentive programs.",
    destinationUrl: "https://example.com/california-solar-battery",
    category: "solar",
    active: true,
  },
  {
    id: "ca-efficiency-rebates",
    stateSlug: "california",
    title: "California Energy Efficiency Rebates",
    description:
      "Placeholder — check available rebates for energy-efficient appliances and home upgrades in California.",
    destinationUrl: "https://example.com/california-rebates",
    category: "efficiency",
    active: true,
  },
  {
    id: "ca-community-solar",
    stateSlug: "california",
    title: "California Community Solar Programs",
    description:
      "Placeholder — subscribe to a local community solar project without rooftop installation.",
    destinationUrl: "https://example.com/california-community-solar",
    category: "solar",
    active: true,
  },
  {
    id: "ca-tou-plans",
    stateSlug: "california",
    title: "California Time-of-Use Plan Comparison",
    description:
      "Placeholder — compare time-of-use rate schedules from California utilities.",
    destinationUrl: "https://example.com/california-tou",
    category: "plans",
    active: true,
  },
];

export const OFFER_BY_ID: Record<string, Offer> = Object.fromEntries(
  OFFERS.map((o) => [o.id, o]),
);

export function getActiveOffers(): Offer[] {
  return OFFERS.filter((o) => o.active);
}

export function getNationalOffers(): Offer[] {
  return OFFERS.filter((o) => o.active && !o.stateSlug);
}

export function getOffersForState(stateSlug: string): Offer[] {
  return OFFERS.filter(
    (o) => o.active && (o.stateSlug === stateSlug || !o.stateSlug),
  );
}

export function getStateSpecificOffers(stateSlug: string): Offer[] {
  return OFFERS.filter((o) => o.active && o.stateSlug === stateSlug);
}

const CATEGORY_LABELS: Record<Offer["category"], string> = {
  plans: "Electricity Plans",
  solar: "Solar",
  efficiency: "Energy Efficiency",
  moving: "Moving & Setup",
  other: "Other",
};

export function categoryLabel(category: Offer["category"]): string {
  return CATEGORY_LABELS[category];
}
