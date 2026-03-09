# Launch Readiness

This document describes what "ready to launch" means for PriceOfElectricity.com and how to verify it.

## Before Launch

Run the launch check:

```bash
npm run launch:check
```

This runs the full build pipeline, including:

1. `release:gen` — generates release metadata
2. `knowledge:build` — builds knowledge pages and datasets
3. `knowledge:verify` — runs production readiness checks
4. `next build` — builds the Next.js application

## What Must Pass

All production readiness checks must pass. The verification script prints a **LAUNCH READINESS SUMMARY** at the end:

- **Core pages** — Homepage, knowledge, electricity-trends, electricity-insights, datasets, methodology, site-map, page-index, data-registry
- **Programmatic sections** — electricity-cost, average-electricity-bill, electricity-cost-calculator, battery-recharge-cost, generator-vs-battery-cost, electricity-price-history, moving-to-electricity-cost, electricity-cost-comparison, ai-energy-demand
- **Data assets** — national.json, search-index.json, rankings, state JSON files
- **Dataset exports** — electricity-prices-by-state.json/csv, electricity-rankings.json/csv
- **Sitemap/robots** — sitemap.ts, robots.ts, coverage and production indexing
- **Discovery pages** — site-map, page-index, data-registry
- **Navigation components** — ExploreMore, SectionNav
- **Schema layer** — JSON-LD in layout.tsx

If any check fails, the script prints **LAUNCH BLOCKER** and exits non-zero.

## Examples of Launch Blockers

- Missing core page (e.g. `src/app/knowledge/page.tsx`)
- Missing dataset export (e.g. `public/datasets/electricity-prices-by-state.csv`)
- Sitemap or robots.ts missing or misconfigured
- Search index or knowledge JSON files missing
- Broken internal route references

## Note

**BUILD STATUS: SUCCESS** alone is not enough. Ensure the repository was actually modified as expected and that `npm run launch:check` completes successfully before deploying.
