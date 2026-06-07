import { GUIDES } from "@/data/guides";
import { STATES } from "@/data/states";
import { TOPICS } from "@/data/topics";
import { UTILITIES } from "@/data/utilities";
import { getQuestionSlugs, parseQuestionSlug } from "@/lib/questions";

export type SearchResult = {
  title: string;
  href: string;
  type: "state" | "utility" | "guide" | "question" | "topic" | "tool";
  /** Extra searchable text (e.g. description, alternate names) — not displayed. */
  keywords?: string;
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/**
 * Synonym groups. When the user types one term, the search will match titles
 * that contain any other term in the same group. Keep groups small and
 * unambiguous to avoid false positives.
 */
const SYNONYM_GROUPS: string[][] = [
  ["price", "prices", "rate", "rates", "cost", "costs", "pricing"],
  ["bill", "bills", "billing", "invoice"],
  ["kwh", "kilowatt", "kilowatts", "kilowatthour", "kilowatthours"],
  ["ev", "evs"],
  ["ac", "airconditioner", "airconditioning"],
  ["hvac", "heating", "cooling"],
  ["fridge", "refrigerator"],
  ["solar", "photovoltaic", "pv"],
];

const SYNONYM_MAP: Map<string, string[]> = (() => {
  const map = new Map<string, string[]>();
  for (const group of SYNONYM_GROUPS) {
    for (const term of group) {
      map.set(term, group);
    }
  }
  return map;
})();

/** Returns the token plus any synonyms (deduped). */
function expandToken(token: string): string[] {
  const synonyms = SYNONYM_MAP.get(token);
  return synonyms ? synonyms : [token];
}

function tokenize(value: string): string[] {
  const normalized = normalize(value);
  if (!normalized) return [];
  return normalized.split(/\s+/).filter(Boolean);
}

export function buildSearchIndex(): SearchResult[] {
  const stateResults: SearchResult[] = Object.values(STATES).map((state) => ({
    title: `${state.name} Electricity Rates`,
    href: `/${state.slug}`,
    type: "state",
    keywords: `${state.name} electricity prices rates cost bill kwh`,
  }));

  const utilityResults: SearchResult[] = UTILITIES.map((utility) => {
    const stateName = STATES[utility.stateSlug]?.name ?? utility.stateSlug;
    return {
      title: `${utility.name} (${stateName})`,
      href: `/${utility.stateSlug}/utility/${utility.slug}`,
      type: "utility",
      keywords: `${utility.name} ${stateName} utility provider`,
    };
  });

  const guideResults: SearchResult[] = GUIDES.map((guide) => ({
    title: guide.title,
    href: `/guides/${guide.slug}`,
    type: "guide",
    keywords: guide.description,
  }));

  const topicResults: SearchResult[] = TOPICS.map((topic) => ({
    title: topic.name,
    href: `/topics/${topic.slug}`,
    type: "topic",
    keywords: topic.description,
  }));

  const questionResults: SearchResult[] = getQuestionSlugs(STATES).flatMap((slug) => {
    const parsed = parseQuestionSlug(slug);
    if (!parsed) {
      return [];
    }
    const state = STATES[parsed.stateSlug];
    if (!state) {
      return [];
    }
    return [
      {
        title: parsed.template.titleTemplate(state.name),
        href: `/questions/${slug}`,
        type: "question" as const,
      },
    ];
  });

  const toolResults: SearchResult[] = [
    {
      title: "Compare Electricity Prices by State",
      href: "/electricity-cost-comparison",
      type: "tool",
      keywords: "compare electricity prices rates cost state to state",
    },
    {
      title: "Electricity Bill Calculator",
      href: "/electricity-cost-calculator",
      type: "tool",
      keywords: "calculator estimate monthly bill cost kwh",
    },
    {
      title: "Electricity Bill Estimator",
      href: "/electricity-bill-estimator",
      type: "tool",
      keywords: "estimator monthly bill cost",
    },
    {
      title: "Electricity Affordability by State",
      href: "/electricity-affordability",
      type: "tool",
      keywords: "affordability income share monthly bill",
    },
    {
      title: "Electricity Price Trends",
      href: "/electricity-trends",
      type: "tool",
      keywords: "trends inflation history price change",
    },
  ];

  return [
    ...stateResults,
    ...utilityResults,
    ...guideResults,
    ...topicResults,
    ...questionResults,
    ...toolResults,
  ];
}

const SEARCH_INDEX = buildSearchIndex();

/**
 * Returns true if `haystack` (already normalized) contains `token` or any of
 * its synonyms as a whole word or word fragment. Whole-word matching is
 * approximated by checking word boundaries via the haystack containing
 * either the bare term, a leading-space variant, or a trailing-space variant.
 */
function haystackMatchesToken(haystack: string, token: string): boolean {
  const candidates = expandToken(token);
  for (const candidate of candidates) {
    if (haystack.includes(candidate)) return true;
  }
  return false;
}

/** Combined searchable text for a result: title + keywords (normalized). */
function searchableText(result: SearchResult): string {
  return normalize(`${result.title} ${result.keywords ?? ""}`);
}

export function search(query: string): SearchResult[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return [];
  }

  const normalizedQuery = tokens.join(" ");

  const scored = SEARCH_INDEX.map((result) => {
    const text = searchableText(result);
    const titleNormalized = normalize(result.title);

    const matchesAll = tokens.every((token) => haystackMatchesToken(text, token));
    if (!matchesAll) return null;

    let score = 0;
    if (titleNormalized === normalizedQuery) score += 1000;
    if (titleNormalized.includes(normalizedQuery)) score += 500;
    if (tokens.every((token) => haystackMatchesToken(titleNormalized, token))) {
      score += 200;
    }
    if (result.type === "tool" || result.type === "topic") score += 50;
    if (result.type === "state") score += 30;
    score -= titleNormalized.length;
    return { result, score };
  }).filter((entry): entry is { result: SearchResult; score: number } => entry !== null);

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 30).map((entry) => entry.result);
}
