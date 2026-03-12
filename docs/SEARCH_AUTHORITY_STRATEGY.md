# Search Authority Strategy

**Status:** Active  
**Scope:** Search authority growth phase (no new route families)  
**Last updated:** 2026-02-25

## 1) Structured Data Strategy

### Coverage baseline
- `state authority pages` already output `WebPage`, `FAQPage`, and `BreadcrumbList`.
- `city electricity pages` output `WebPage` and `BreadcrumbList`.
- `appliance cost pages` output `WebPage` and `BreadcrumbList`.
- `bill estimator pages` output `WebPage` and `BreadcrumbList`.
- `energy comparison hub` outputs `WebPage` and `BreadcrumbList`.

### Growth-phase enrichment
- Add deterministic `FAQPage` JSON-LD to:
  - `city electricity pages`
  - `appliance cost pages`
  - `bill estimator state/profile pages`
  - `energy comparison hub`
- Add deterministic `Dataset` JSON-LD where pages rely on state dataset inputs:
  - `city electricity pages`
  - `appliance cost pages`
  - `bill estimator state/profile pages`
- Keep schema additive and template-level; do not create route-specific one-offs.

### Guardrails
- Use shared JSON-LD helpers from `src/lib/seo/jsonld.ts`.
- No conflicting schema ownership per page intent.
- No runtime schema generation from external APIs.

## 2) Internal Linking Rules

### Authority graph priorities
- Ensure bidirectional discoverability between hubs and canonical clusters:
  - canonical clusters link to `/energy-comparison`
  - `/energy-comparison` links back to canonical families
- Maintain rollout-aware links only:
  - city links from active city rollout
  - appliance links from active appliance rollout
  - appliance-city pilot links only from active pilot inventory

### Deterministic link-density rules
- State-context internal link sections should include:
  - state authority and state cost routes
  - bill estimator route
  - at least one or two appliance canonical routes
  - usage and comparison hubs when available
- Avoid circular link spam and duplicate link lists.

## 3) Crawl Prioritization Logic

- Keep canonical, high-signal discovery hubs at higher sitemap priority values.
- Preserve rollout-gated inclusion logic in `src/app/sitemap.ts`.
- Prioritize:
  - `/energy-comparison`
  - `/electricity-hubs` and major hub children
- Do not expose deferred or blocked families in sitemap.

## 4) Sitemap Clarity Rules

- Include canonical families and rollout-enabled pages only.
- Keep discovery hubs clearly represented with weekly `changeFrequency`.
- Maintain deterministic sitemap generation and avoid non-canonical support routes.

## 5) Verification Expectations

`scripts/verify-knowledge.js` should continue to assert:
- schema presence on key authority families
- FAQ schema helper coverage on targeted templates
- hub-to-canonical cluster linking signals
- discovery-hub sitemap priority signals

## 6) Integration Rule For Future Content

When adding content inside existing route families:
1. Add or reuse `WebPage` + `BreadcrumbList`.
2. Add `FAQPage` if there is clear Q/A explanatory content.
3. Add `Dataset` schema only when page values are explicitly data-derived.
4. Wire links into existing hubs/canonical clusters via shared link helpers.
5. Keep rollout and canonical ownership unchanged.
