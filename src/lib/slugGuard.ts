import { STATE_SLUGS } from "@/data/stateSlugs";
import { UTILITIES } from "@/data/utilities";
import { CITIES } from "@/data/cities";
import { getQuestionSlugs } from "@/lib/questions";
import { STATES } from "@/data/states";

const STATE_SLUG_SET = new Set<string>(STATE_SLUGS);

export function isValidStateSlug(slug: string): boolean {
  return STATE_SLUG_SET.has(slug);
}

const UTILITY_KEY_SET = new Set(
  UTILITIES.map((u) => `${u.stateSlug}/${u.slug}`)
);

export function isValidUtilitySlug(
  stateSlug: string,
  utilitySlug: string
): boolean {
  return UTILITY_KEY_SET.has(`${stateSlug}/${utilitySlug}`);
}

const CITY_KEY_SET = new Set(
  CITIES.map((c) => `${c.stateSlug}/${c.slug}`)
);

export function isValidCitySlug(
  stateSlug: string,
  citySlug: string
): boolean {
  return CITY_KEY_SET.has(`${stateSlug}/${citySlug}`);
}

let _questionSlugs: Set<string> | null = null;

export function isValidQuestionSlug(slug: string): boolean {
  if (!_questionSlugs) {
    _questionSlugs = new Set(getQuestionSlugs(STATES));
  }
  return _questionSlugs.has(slug);
}
