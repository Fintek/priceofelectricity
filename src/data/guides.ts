export type Guide = {
  slug: string;
  title: string;
  description: string;
  body: string[];
  relatedStates?: string[];
};

export const GUIDES: Guide[] = [
  {
    slug: "how-electricity-bills-work",
    title: "How Electricity Bills Work",
    description:
      "Understand the main line items on a typical electric bill and what changes month to month.",
    body: [
      "Most residential electricity bills combine energy charges with delivery charges. Energy charges are based on how many kilowatt-hours (kWh) you use, while delivery charges pay for poles, wires, and grid operations.",
      "Your bill usually starts with a billing period and total usage. Usage is measured by your meter and reported in kWh. Higher usage generally means higher total cost, but the exact cost depends on the rate structure in your area.",
      "Many bills include fixed monthly fees such as a customer charge or basic service charge. These fees apply even when usage is low, which is why total bills do not always drop in direct proportion to kWh reductions.",
      "Some utilities use tiered or time-based rates. Tiered rates increase the per-kWh price after certain usage thresholds, while time-of-use rates vary by hour of day and season.",
      "Taxes, riders, and regulatory adjustments may appear as separate lines. These can include state and local taxes, fuel adjustments, renewable programs, and other approved cost-recovery items.",
      "When comparing providers or plans, focus on both the effective price per kWh and fixed fees. A low advertised rate can still produce a higher bill if non-energy charges are substantial.",
    ],
    relatedStates: ["texas", "california", "florida"],
  },
  {
    slug: "what-is-kwh",
    title: "What Is kWh?",
    description:
      "Learn what a kilowatt-hour means and how it connects your appliance use to your electricity cost.",
    body: [
      "A kilowatt-hour (kWh) is a unit of energy. It means using 1,000 watts of power for one hour, or an equivalent combination of power and time.",
      "Your electricity meter tracks cumulative kWh usage. Utilities bill you for the amount used during each billing cycle, not for instantaneous power demand in most residential settings.",
      "Power is measured in watts or kilowatts, while energy is measured in watt-hours or kilowatt-hours. Power tells you how fast energy is being used; energy tells you how much was used over time.",
      "To estimate appliance consumption, multiply power by time. For example, a 1,500-watt space heater running for two hours uses roughly 3 kWh.",
      "You can estimate energy-only cost with a simple formula: kWh multiplied by cents per kWh, then divided by 100 to convert cents to dollars.",
      "Understanding kWh helps you compare plans, interpret your bill, and evaluate efficiency upgrades such as insulation, smart thermostats, and high-efficiency appliances.",
    ],
    relatedStates: ["new-york", "illinois", "arizona"],
  },
  {
    slug: "why-electricity-prices-vary-by-state",
    title: "Why Electricity Prices Vary by State",
    description:
      "See the core factors that drive state-to-state differences in residential electricity rates.",
    body: [
      "State electricity prices differ because utilities operate under different resource mixes, regulations, and infrastructure costs. No single factor explains every state.",
      "Fuel mix is a major driver. States with more hydropower, nuclear, or low-cost gas generation may have lower average rates than states relying on imported fuels or costly peaking resources.",
      "Transmission and distribution investments vary by geography and weather risk. Areas with long-distance delivery needs, wildfire mitigation, or storm hardening often face higher delivery costs.",
      "Regulatory models and market design also matter. Some states use regulated monopoly utilities, while others have retail choice models where suppliers compete for customers.",
      "Population density and load profile influence fixed cost recovery. Utilities serving sparse or highly seasonal demand often spread infrastructure costs across fewer customer kilowatt-hours.",
      "Policy choices such as efficiency mandates, renewable targets, and low-income programs can affect near-term rates, though they may also deliver long-term reliability and cost benefits.",
    ],
    relatedStates: ["hawaii", "california", "louisiana"],
  },
  {
    slug: "fixed-vs-variable-electricity-rates",
    title: "Fixed vs Variable Electricity Rates",
    description:
      "Compare fixed and variable electricity rate plans and understand trade-offs in price stability.",
    body: [
      "A fixed-rate plan generally keeps the energy rate stable for a contract term, such as 12 or 24 months. This can make budgeting easier when market prices fluctuate.",
      "A variable-rate plan can change month to month based on market conditions or provider pricing policies. It may offer flexibility but can expose customers to higher costs during volatile periods.",
      "Fixed plans may include early termination fees and credit requirements. Variable plans may have fewer commitment constraints but require ongoing monitoring.",
      "The best choice depends on risk tolerance and expected market direction. Customers prioritizing predictability often prefer fixed terms, while flexible movers may prefer variable options.",
      "Always check the electricity facts label or equivalent plan disclosure. Important details include base charge, pass-through charges, contract length, and cancellation terms.",
      "When comparing plans, evaluate total estimated monthly cost at your expected usage, not only the headline cents per kWh rate.",
    ],
    relatedStates: ["texas", "pennsylvania", "ohio"],
  },
  {
    slug: "how-to-lower-your-electric-bill",
    title: "How to Lower Your Electric Bill",
    description:
      "Practical ways to reduce electricity use and improve bill predictability without sacrificing comfort.",
    body: [
      "Start with the highest-impact loads in your home: heating and cooling, water heating, and major appliances. Small efficiency gains in these categories can lower monthly usage meaningfully.",
      "Set thermostat schedules and reduce unnecessary runtime. Smart thermostats can automate setbacks and help avoid peak-hour overuse.",
      "Seal air leaks and improve insulation where practical. Weatherization helps reduce HVAC demand in both hot and cold seasons.",
      "Use efficient lighting and appliances, and replace aging equipment at end-of-life with high-efficiency models. Efficiency upgrades often deliver recurring savings over many years.",
      "Shift flexible usage away from expensive periods if your utility uses time-varying rates. Laundry, dishwashing, and EV charging are common candidates.",
      "Review your plan annually and compare options when allowed in your market. Better plan fit, combined with usage efficiency, usually delivers the strongest long-term savings.",
    ],
    relatedStates: ["texas", "georgia", "north-carolina"],
  },
  {
    slug: "regulated-vs-deregulated-electricity-markets",
    title: "Regulated vs Deregulated Electricity Markets",
    description:
      "Understand how regulated utility models differ from retail choice markets in electricity service.",
    body: [
      "In regulated markets, one utility typically provides bundled generation, delivery, and billing in a service territory. Rates are approved by state regulators through formal proceedings.",
      "In deregulated or retail choice markets, delivery remains a regulated monopoly, but customers may choose a retail supplier for the energy portion of service.",
      "Regulated markets can offer simpler default service, while choice markets can provide more plan options and contract structures. Each model has trade-offs in complexity and competition.",
      "Even in choice states, not all customers are eligible for every offer. Utility territory rules, product availability, and contract terms vary by location.",
      "Delivery reliability responsibilities generally stay with the local utility in both models. During outages, customers still contact the utility regardless of supplier choice.",
      "Understanding your market structure helps you compare offers correctly, avoid confusion about bill components, and make better long-term energy decisions.",
    ],
    relatedStates: ["texas", "new-york", "massachusetts"],
  },
];

export const GUIDE_BY_SLUG: Record<string, Guide> = Object.fromEntries(
  GUIDES.map((guide) => [guide.slug, guide]),
);
