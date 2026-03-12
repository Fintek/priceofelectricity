import { STATES } from "@/data/states";

/**
 * Single source of truth for the legacy /compare/{pair} static pair set.
 *
 * Algorithm: top-10 most expensive states × top-10 least expensive states,
 * alphabetically sorted pair slugs, deduplicated.
 *
 * Consumed by:
 *   - src/app/compare/[pair]/page.tsx  (generateStaticParams)
 *   - src/app/sitemap.ts              (compare sitemap eligibility)
 *
 * Policy ref: docs/CANONICAL_ARCHITECTURE_POLICY.md § C.3
 */
export function getLegacyCompareStaticPairs(): string[] {
  const entries = Object.entries(STATES);
  const topHigh = [...entries]
    .sort((a, b) => b[1].avgRateCentsPerKwh - a[1].avgRateCentsPerKwh)
    .slice(0, 10)
    .map(([slug]) => slug);
  const topLow = [...entries]
    .sort((a, b) => a[1].avgRateCentsPerKwh - b[1].avgRateCentsPerKwh)
    .slice(0, 10)
    .map(([slug]) => slug);

  const pairSet = new Set<string>();
  for (const highSlug of topHigh) {
    for (const lowSlug of topLow) {
      if (highSlug === lowSlug) continue;
      const [a, b] = [highSlug, lowSlug].sort((x, y) => x.localeCompare(y));
      pairSet.add(`${a}-vs-${b}`);
    }
  }

  return [...pairSet].sort((a, b) => a.localeCompare(b));
}
