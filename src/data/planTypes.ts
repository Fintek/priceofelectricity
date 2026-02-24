export type PlanType = {
  slug: string;
  name: string;
  description: string;
  pros: string[];
  cons: string[];
};

export const PLAN_TYPES: PlanType[] = [
  {
    slug: "fixed-rate",
    name: "Fixed-Rate Plans",
    description:
      "A fixed-rate plan keeps the energy rate per kWh stable for the contract term.",
    pros: [
      "Predictable energy rate during the contract term",
      "Protection against short-term wholesale price spikes",
      "Easier monthly budgeting",
    ],
    cons: [
      "May include early termination fees",
      "Can be priced above variable offers at signup",
      "Plan terms and fees vary by provider",
    ],
  },
  {
    slug: "variable-rate",
    name: "Variable-Rate Plans",
    description:
      "A variable-rate plan can change from month to month based on market conditions and provider pricing.",
    pros: [
      "Usually no long contract commitment",
      "Can benefit from lower market prices in some periods",
      "More flexibility to switch providers",
    ],
    cons: [
      "Monthly price can rise without long-term protection",
      "Bill volatility can make budgeting harder",
      "Requires active monitoring",
    ],
  },
  {
    slug: "time-of-use",
    name: "Time-of-Use Plans",
    description:
      "Time-of-use plans charge different rates depending on time of day, with higher rates during peak demand windows.",
    pros: [
      "Potential savings if usage shifts to off-peak hours",
      "Encourages efficient consumption patterns",
      "Can align well with smart home controls",
    ],
    cons: [
      "Peak usage can increase costs",
      "Requires behavior changes to maximize savings",
      "Rate windows and rules differ by utility",
    ],
  },
  {
    slug: "prepaid",
    name: "Prepaid Plans",
    description:
      "Prepaid plans let customers fund electricity service in advance and track balance usage over time.",
    pros: [
      "No long-term contract in many markets",
      "Can help monitor daily usage closely",
      "May have fewer credit requirements",
    ],
    cons: [
      "Service interruption risk if balance runs low",
      "Fees and recharge rules vary by provider",
      "Rates may be higher than standard plans",
    ],
  },
  {
    slug: "green-energy",
    name: "Green Energy Plans",
    description:
      "Green energy plans source or match electricity usage with renewable energy through provider supply or renewable certificates.",
    pros: [
      "Supports renewable generation goals",
      "May reduce household carbon footprint claims",
      "Available in many competitive markets",
    ],
    cons: [
      "Can carry a premium versus standard offers",
      "Product details differ across providers",
      "Renewable content disclosures require review",
    ],
  },
];
