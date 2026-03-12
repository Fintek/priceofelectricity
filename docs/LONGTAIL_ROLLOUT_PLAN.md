# Longtail Expansion — Rollout Plan

**Created:** 2026-02-25
**Config file:** `src/lib/longtail/rollout.ts`

## Overview

The longtail page expansion introduces four route families. Rather than
launching all pages simultaneously, they are introduced in three phases
controlled by a single configuration file. This reduces build risk,
indexing volatility, and crawl inefficiency.

No route files are added or removed between phases — only the config
values change.

---

## Phase Definitions

### Phase 1 — Core price + common usage tiers (current)

| Family | Route | Pages |
|--------|-------|------:|
| State price per kWh | `/electricity-price-per-kwh/{state}` | 51 |
| Usage cost (3 tiers: 500, 1000, 2000 kWh) | `/electricity-usage-cost/{kwh}/{state}` | 153 |

**Total new pages: 204**

**Rationale:**
- Highest search volume keywords ("electricity price per kwh in [state]",
  "how much does 1000 kwh cost in [state]").
- Lowest build risk — small page count, simple data dependency.
- Establishes internal linking anchors for later phases.
- The three usage tiers (500, 1000, 2000) cover the most common
  residential search patterns.

**Sitemap:** Only these two families appear. Trend and industry URLs are
excluded from sitemap.xml.

**Deployment:** Deploy and submit sitemap to Google Search Console.
Monitor indexing for 1–2 weeks before advancing.

---

### Phase 2 — Trends + expanded usage tiers

| Family | Route | Pages |
|--------|-------|------:|
| State price per kWh | `/electricity-price-per-kwh/{state}` | 51 |
| State price trend | `/electricity-price-trend/{state}` | 51 |
| Usage cost (6 tiers: 500, 750, 1000, 1500, 2000, 3000 kWh) | `/electricity-usage-cost/{kwh}/{state}` | 306 |

**Total new pages: 408** (+204 from Phase 1)

**Rationale:**
- Trend pages add differentiated content (charts, historical data) that
  strengthens topical authority.
- Expanding from 3 to 6 usage tiers captures mid-range and high-usage
  search queries.
- Internal linking engine already connects price → trend → usage pages.

**Config change:**
```typescript
export const ACTIVE_LONGTAIL_FAMILIES: ReadonlySet<LongtailFamily> = new Set([
  "state-price-per-kwh",
  "state-price-trend",   // ← add
  "usage-cost",
]);

export const ACTIVE_USAGE_KWH_TIERS: readonly number[] = [500, 750, 1000, 1500, 2000, 3000]; // ← expand
```

**Deployment:** Deploy, resubmit sitemap. Monitor crawl stats and
indexing coverage for 1–2 weeks.

---

### Phase 3 — Full rollout including industry pages

| Family | Route | Pages |
|--------|-------|------:|
| State price per kWh | `/electricity-price-per-kwh/{state}` | 51 |
| State price trend | `/electricity-price-trend/{state}` | 51 |
| Usage cost (6 tiers) | `/electricity-usage-cost/{kwh}/{state}` | 306 |
| Industry cost (4 industries) | `/industry-electricity-cost/{industry}/{state}` | 204 |

**Total new pages: 612** (+204 from Phase 2)

**Rationale:**
- Industry pages (EV charging, Bitcoin mining, AI data centers, data
  centers) target high-value commercial keywords.
- By this point, the core state pages are indexed and provide strong
  internal linking context for the industry pages.

**Config change:**
```typescript
export const ACTIVE_LONGTAIL_FAMILIES: ReadonlySet<LongtailFamily> = new Set([
  "state-price-per-kwh",
  "state-price-trend",
  "usage-cost",
  "industry-cost",       // ← add
]);

export const ACTIVE_INDUSTRY_SLUGS: readonly string[] = [
  "ev-charging",
  "bitcoin-mining",
  "ai-data-centers",
  "data-centers",        // ← populate
];
```

**Deployment:** Deploy, resubmit sitemap. Full longtail system is live.

---

## Page Count Summary

| Phase | Families active | New pages | Cumulative |
|-------|----------------|----------:|-----------:|
| 1 | 2 (price, usage×3) | 204 | 204 |
| 2 | 3 (+ trend, usage×6) | 204 | 408 |
| 3 | 4 (+ industry×4) | 204 | 612 |

---

## How the Rollout System Works

### Config file: `src/lib/longtail/rollout.ts`

Three exported constants control everything:

| Constant | Purpose |
|----------|---------|
| `ACTIVE_LONGTAIL_FAMILIES` | Set of family IDs that are active |
| `ACTIVE_USAGE_KWH_TIERS` | Which kWh values generate usage-cost pages |
| `ACTIVE_INDUSTRY_SLUGS` | Which industry slugs generate industry pages |

### Integration points

1. **`generateStaticParams()`** in each route file checks
   `isLongtailFamilyActive()` before returning params. If inactive,
   returns `[]` — Next.js generates zero pages for that route.

2. **`src/app/sitemap.ts`** uses the same helpers to include/exclude
   longtail URLs from the sitemap.

3. **Route files remain in place** at all times. Inactive families
   simply produce no static pages and no sitemap entries. Direct URL
   hits return 404 via existing `notFound()` guards.

### Advancing a phase

1. Edit `ACTIVE_LONGTAIL_FAMILIES`, `ACTIVE_USAGE_KWH_TIERS`, and/or
   `ACTIVE_INDUSTRY_SLUGS` in `src/lib/longtail/rollout.ts`.
2. Run `npm run build` to verify.
3. Deploy to Vercel.
4. Resubmit sitemap in Google Search Console.

No other files need to change.

---

## Files Created or Modified

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/longtail/rollout.ts` | **Created** | Central rollout config and helpers |
| `src/app/electricity-price-per-kwh/[state]/page.tsx` | Modified | `generateStaticParams` gated by rollout |
| `src/app/electricity-price-trend/[state]/page.tsx` | Modified | `generateStaticParams` gated by rollout |
| `src/app/electricity-usage-cost/[kwh]/[state]/page.tsx` | Modified | `generateStaticParams` gated by rollout |
| `src/app/industry-electricity-cost/[industry]/[state]/page.tsx` | Modified | `generateStaticParams` gated by rollout |
| `src/app/sitemap.ts` | Modified | Longtail sitemap entries gated by rollout |

---

## Deployment Recommendation

1. **Merge Phase 1 config as-is** — the current `rollout.ts` defaults
   are set to Phase 1.
2. **Deploy to Vercel** and confirm build succeeds (verified locally).
3. **Submit sitemap** to Google Search Console.
4. **Wait 1–2 weeks**, monitoring:
   - Google Search Console indexing coverage
   - Crawl stats (pages crawled per day)
   - Any crawl errors on longtail URLs
5. **Advance to Phase 2** by editing `rollout.ts` (see config change
   above), deploy, resubmit sitemap.
6. **Repeat monitoring**, then advance to Phase 3.

---

## Safety Properties

- **No route files are deleted** between phases.
- **Existing non-longtail routes are untouched** — the rollout system
  only affects the four longtail families.
- **Build always succeeds** regardless of which phase is active
  (verified with Phase 1).
- **Configuration-only changes** — advancing phases requires editing
  one file with no structural code changes.
- **Fully compatible with static generation** — `force-static` and
  `generateStaticParams` work correctly with empty return arrays.
