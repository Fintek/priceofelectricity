# Post-Expansion QA Audit

Date: 2026-03-11  
Scope: Post-expansion hardening and QA across newly completed roadmap families  
Mode: Static-first, deterministic, canonical-safe, rollout-safe

## A. Expansion Family Inventory

| Family | Canonical owner | Rollout status | Type | Primary intent |
|---|---|---|---|---|
| Appliance cost expansion | `/cost-to-run/{appliance}/{state}` | Active (`ACTIVE_APPLIANCE_SLUGS`) | Canonical | Appliance operating-cost intent by state |
| City electricity pages | `/electricity-cost/{state}/{city}` | Active pilot (`ACTIVE_CITY_PAGE_KEYS`) | Canonical | City authority/context electricity cost intent |
| Appliance x State enhancements | `/cost-to-run/{appliance}/{state}` and `/electricity-cost-calculator/{state}/{appliance}` | Active | Canonical + supporting bridges | Stronger state appliance economics and city-context bridges |
| Appliance x City pilot | `/cost-to-run/{appliance}/{state}/{city}` | Active pilot (`ACTIVE_APPLIANCE_CITY_PAGE_KEYS` + hard caps) | Canonical (pilot-gated) | City-qualified appliance operating-cost intent |
| Energy Comparison Hub | `/energy-comparison` + curated static slices | Active static | Supporting/discovery-only | Curated navigation to existing canonical comparison families |
| Electricity Bill Estimator | `/electricity-bill-estimator/{state}` and `/electricity-bill-estimator/{state}/{profile}` | Active (fixed profile set) | Canonical | Deterministic household-profile bill scenario intent |

## B. Canonical / Route Ownership Audit

- Canonical ownership remains aligned with `docs/CANONICAL_ARCHITECTURE_POLICY.md`.
- No conflicting canonical owners found between estimator, average-bill, calculator, fixed-kWh, city authority, and appliance families.
- Energy comparison routes are explicitly framed as discovery pages and do not claim ownership over comparison destination intents.
- Legacy city and compare routes remain redirect/supporting behavior, not independent canonical families.
- Audit hardening applied: rollout-gated dynamic families now set `dynamicParams = false` on key routes to prevent accidental on-demand fan-out outside static params.

## C. Sitemap / Rollout Audit

- Sitemap includes intended canonical additions:
  - city authority pages from `getActiveCityPages()`
  - appliance x city pilot pages from `getActiveApplianceCityPages()`
  - energy comparison curated static routes
  - estimator hub/state/profile routes
- No deferred city calculator or city estimator route families were found in sitemap generation logic.
- Hub inclusion remains proportional: only four static `energy-comparison` routes are emitted.
- Rollout controls for appliance, city, and appliance-city remain centralized in `src/lib/longtail/rollout.ts`.
- Verification hardening applied: `scripts/verify-knowledge.js` now enforces sitemap/route coverage for `electricity-bill-estimator` and `energy-comparison`.

## D. Redirect / 404 / Param Validation Audit

Representative code-path audit and route sampling basis:

- Legacy city redirects:
  - `/{state}/city/{citySlug}` -> `/electricity-cost/{state}/{city}` via permanent redirect.
  - `/{state}/{city}` -> `/electricity-cost/{state}/{city}` via permanent redirect for rollout-generated params.
- Legacy compare redirects:
  - `/compare/{pair}` canonicalized/redirected to `/electricity-cost-comparison/{pair}`.
- Invalid parameter behavior:
  - invalid state/city/appliance/profile params hit `notFound()` in canonical families.
  - non-rollout appliance x city combinations are blocked by `isActiveApplianceCityPageKey()` and never included in static params or sitemap.
- Hardening applied:
  - `dynamicParams = false` added on rollout-sensitive dynamic routes to enforce static-param boundaries.

## E. Internal Linking / Thinness / Duplication Audit

- Internal links for new families are rollout-aware and route-aware via `src/lib/longtail/internalLinks.ts` and rollout helpers.
- Appliance pages bridge to calculator/city/comparison without introducing duplicate canonical claims.
- Estimator pages clearly differentiate intent from benchmark (`average-electricity-bill`) and calculator (`electricity-cost-calculator`) families.
- City pages include explicit modeled-estimate methodology/disclosure and avoid over-precision framing.
- Appliance x city pilot pages include substantive tables, methodology, and related links; no thin placeholder pattern found in pilot implementation.
- Energy Comparison Hub pages function as curated discovery directories, not duplicate comparison data systems.

## F. Verification Coverage Summary

Existing verification stack used:

- `npm run knowledge:build`
- `npm run knowledge:verify`
- `npm run build`
- `npm run verify:vercel`

Coverage hardening added in this pass:

- `scripts/verify-knowledge.js` now checks:
  - existence of `electricity-bill-estimator` route files (index/state/profile),
  - existence of `energy-comparison` route files (hub + slices),
  - sitemap evidence for estimator and energy-comparison families,
  - inclusion of new prefixes in known route family checks.

## G. Exact Fixes Made During This Prompt

1. Enforced stricter static param boundaries:
   - Added `dynamicParams = false` to:
     - `src/app/electricity-cost/[slug]/[city]/page.tsx`
     - `src/app/electricity-bill-estimator/[slug]/page.tsx`
     - `src/app/electricity-bill-estimator/[slug]/[profile]/page.tsx`
     - `src/app/cost-to-run/[appliance]/[state]/page.tsx`
     - `src/app/electricity-cost-calculator/[slug]/[appliance]/page.tsx`
     - `src/app/electricity-usage/appliances/[appliance]/page.tsx`

2. Improved verification coverage for new expansion families:
   - Updated `scripts/verify-knowledge.js` to include estimator + energy-comparison route/sitemap checks.

## H. Remaining Risks / Deferred Items

- No blocker-level post-expansion issues found in this pass.
- Existing monitoring-only stabilization items from prior review still apply (generated-output review discipline and policy-level drift monitoring).
- Broad sitemap `new Date()` usage outside state-backed entries remains intentionally managed by volatile timestamp stripping policy; no additional change required in this pass.

## I. Go / No-Go Recommendation

**Go.** Expansion set is post-audit safe for crawl/indexing/canonical/rollout governance under current policy controls and verification surface.

Recommended next stage:

**Proceed to monetization/provider/launch-operations work** with the current canonical and rollout policies unchanged unless a new explicit policy decision is documented.
