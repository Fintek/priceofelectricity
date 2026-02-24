import { GUIDES } from "@/data/guides";
import { STATES } from "@/data/states";
import { TOPICS } from "@/data/topics";
import { UTILITIES } from "@/data/utilities";
import { getQuestionSlugs, parseQuestionSlug } from "@/lib/questions";

export type SearchResult = {
  title: string;
  href: string;
  type: "state" | "utility" | "guide" | "question" | "topic" | "tool";
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function buildSearchIndex(): SearchResult[] {
  const stateResults: SearchResult[] = Object.values(STATES).map((state) => ({
    title: `${state.name} Electricity Rates`,
    href: `/${state.slug}`,
    type: "state",
  }));

  const utilityResults: SearchResult[] = UTILITIES.map((utility) => {
    const stateName = STATES[utility.stateSlug]?.name ?? utility.stateSlug;
    return {
      title: `${utility.name} (${stateName})`,
      href: `/${utility.stateSlug}/utility/${utility.slug}`,
      type: "utility",
    };
  });

  const guideResults: SearchResult[] = GUIDES.map((guide) => ({
    title: guide.title,
    href: `/guides/${guide.slug}`,
    type: "guide",
  }));

  const topicResults: SearchResult[] = TOPICS.map((topic) => ({
    title: topic.name,
    href: `/topics/${topic.slug}`,
    type: "topic",
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
    { title: "Compare Electricity Prices by State", href: "/compare", type: "tool" },
    { title: "Electricity Bill Calculator", href: "/calculator", type: "tool" },
    { title: "Electricity Affordability by State", href: "/affordability", type: "tool" },
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

export function search(query: string): SearchResult[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return [];
  }

  return SEARCH_INDEX
    .filter((result) => normalize(result.title).includes(normalizedQuery))
    .sort((a, b) => {
      const aNorm = normalize(a.title);
      const bNorm = normalize(b.title);
      const aExact = aNorm === normalizedQuery ? 0 : 1;
      const bExact = bNorm === normalizedQuery ? 0 : 1;
      if (aExact !== bExact) {
        return aExact - bExact;
      }
      if (a.title.length !== b.title.length) {
        return a.title.length - b.title.length;
      }
      return a.title.localeCompare(b.title);
    })
    .slice(0, 20);
}
