import { STATE_SLUGS } from "../src/data/stateSlugs";

const STATE_SLUG_SET = new Set<string>(STATE_SLUGS);

/**
 * Only these second segments under `/[state]/...` are real indexable surfaces.
 * Any other two-segment `/[state]/[x]` URL is handled by `src/app/[state]/[city]/page.tsx`
 * as a legacy redirect to `/electricity-cost/{state}/{city}` (see CANONICAL_ARCHITECTURE_POLICY §A.2).
 */
const RESERVED_TWO_SEGMENT_STATE_CHILD = new Set([
  "utilities",
  "plans",
  "plan-types",
  "history",
]);

const LEGACY_CITY_SLASH_SEGMENT = /^\/[a-z0-9-]+\/city\/[a-z0-9-]+\/?$/;

/**
 * Pathnames that must not appear in the sitemap: legacy city redirect shapes
 * (`/{state}/city/{city}` or two-segment `/{state}/{city}` aliases), per canonical policy.
 */
export function findLegacyCityRedirectShapesInSitemaps(pathnames: string[]): string[] {
  const leaked: string[] = [];
  for (const raw of pathnames) {
    const pathname = raw.replace(/\/+$/, "") || "/";
    if (LEGACY_CITY_SLASH_SEGMENT.test(pathname)) {
      leaked.push(pathname);
      continue;
    }
    const m = pathname.match(/^\/([a-z0-9-]+)\/([a-z0-9-]+)$/);
    if (!m) continue;
    const [, state, child] = m;
    if (!STATE_SLUG_SET.has(state)) continue;
    if (RESERVED_TWO_SEGMENT_STATE_CHILD.has(child)) continue;
    leaked.push(pathname);
  }
  return leaked;
}
