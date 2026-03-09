# Final Launch Checklist

## Command Before Launch

```bash
npm run launch:check
```

## Required Launch Conditions

- All production readiness checks pass
- Core pages exist (homepage, knowledge, electricity-trends, electricity-insights, datasets, methodology, site-map, page-index, data-registry)
- Programmatic sections exist (electricity-cost, average-electricity-bill, electricity-cost-calculator, battery-recharge-cost, generator-vs-battery-cost, electricity-price-history, moving-to-electricity-cost, electricity-cost-comparison, ai-energy-demand)
- Data assets exist (national.json, search-index.json, state and rankings JSON)
- Dataset exports exist (electricity-prices-by-state.json/csv, electricity-rankings.json/csv)
- Sitemap and robots are configured for production indexing
- Launch checklist page exists at /launch-checklist

## Manual Review Steps

1. Spot-check top pages (homepage, knowledge, electricity-trends, datasets)
2. Verify internal links on major hubs
3. Verify state pages and ranking pages render as expected
4. Confirm no obvious placeholder copy remains

## Launch Blocker Examples

- Missing core page or dataset export
- Sitemap or robots misconfigured
- `npm run launch:check` fails
- Broken internal route references

## Note

Passing automation is necessary but not sufficient. Manual review is required before launch.
