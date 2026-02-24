export type Topic = {
  slug: string;
  name: string;
  description: string;
  matchPrefixes?: string[];
  staticRoutes?: string[];
};

export const TOPICS: Topic[] = [
  {
    slug: "electricity-prices",
    name: "Electricity Prices",
    description:
      "State-level electricity price comparisons, price drivers, and high-vs-low rate context.",
    matchPrefixes: [
      "why-electricity-expensive-in",
      "why-electricity-cheaper-in",
      "why-electricity-prices-vary-by-state",
    ],
    staticRoutes: ["/compare", "/affordability"],
  },
  {
    slug: "electricity-bills",
    name: "Electricity Bills",
    description:
      "How electric bills are structured, average bill benchmarks, and practical bill reduction guidance.",
    matchPrefixes: [
      "average-electric-bill-in",
      "how-electricity-bills-work",
      "how-to-lower-your-electric-bill",
    ],
    staticRoutes: ["/calculator"],
  },
  {
    slug: "affordability",
    name: "Affordability",
    description:
      "Relative state affordability trends and context for expensive vs cheaper electricity outcomes.",
    matchPrefixes: [
      "average-electric-bill-in",
      "why-electricity-expensive-in",
      "why-electricity-cheaper-in",
    ],
    staticRoutes: ["/affordability", "/compare"],
  },
  {
    slug: "electricity-markets",
    name: "Electricity Markets",
    description:
      "Retail market structure, regulated vs deregulated dynamics, and plan design fundamentals.",
    matchPrefixes: [
      "regulated-vs-deregulated-electricity-markets",
      "fixed-vs-variable-electricity-rates",
    ],
    staticRoutes: ["/compare", "/guides"],
  },
  {
    slug: "electricity-calculators",
    name: "Electricity Calculators",
    description:
      "Calculation-focused resources for kWh, energy-only bill estimates, and usage-based planning.",
    matchPrefixes: ["what-is-kwh", "average-electric-bill-in", "how-to-lower-your-electric-bill"],
    staticRoutes: ["/calculator", "/affordability"],
  },
];

export const TOPIC_BY_SLUG: Record<string, Topic> = Object.fromEntries(
  TOPICS.map((topic) => [topic.slug, topic]),
);

export function getTopicsByPrefixMatch(value: string): Topic[] {
  return TOPICS.filter((topic) =>
    (topic.matchPrefixes ?? []).some((prefix) => value.startsWith(prefix)),
  );
}
