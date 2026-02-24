# LHCI SEO Failures — Observed 2026-02-24

## Summary

LHCI SEO category assertion (`minScore: 0.9`) fails across all 8 tested pages.

## Failing Audits

### 1. `is-crawlable` (score: 0)

**Title**: "Page is blocked from indexing"

**Affected**: All 8 pages (/, /texas, /national, /drivers, /regulatory, /offers, /alerts, /knowledge)

**Root cause**: `src/app/robots.ts` checks `process.env.VERCEL_ENV !== "production"` to decide whether to allow indexing. During local production builds and LHCI runs, `VERCEL_ENV` is undefined, so `robots.txt` emits `Disallow: /` for all user agents.

**Fix**: Also treat `NODE_ENV === "production"` as an allow-indexing signal, so local production builds and CI environments serve an open `robots.txt`.

### 2. `link-text` (score: 0)

**Title**: "Links do not have descriptive text"

**Affected**: /offers only (2 links found)

**Root cause**: `DisclosureNote` component renders `<Link href="/disclosures">Learn more</Link>`. Lighthouse flags "Learn more" as non-descriptive link text.

**Fix**: Change link text to "Read our disclosures" which describes the destination.

## Scores Before Fix

| Page | SEO Score | Failing Audits |
|---|---|---|
| / | 0.66 | is-crawlable |
| /texas | 0.66 | is-crawlable |
| /national | 0.66 | is-crawlable |
| /drivers | 0.66 | is-crawlable |
| /regulatory | 0.66 | is-crawlable |
| /offers | 0.58 | is-crawlable, link-text |
| /alerts | 0.66 | is-crawlable |
| /knowledge | 0.66 | is-crawlable |
