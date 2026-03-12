# Monetization Infrastructure

Date: 2026-03-11  
Scope: Launch operations / monetization infrastructure preparation  
Status: Architecture layer added (no canonical ownership changes, no new route families)

## 1) Commercial Placement Inventory

This inventory identifies where commercial modules can be safely inserted without changing canonical intent.

| Template category | Appropriate? | Recommended placement type | Optional/default |
|---|---|---|---|
| State electricity authority pages (`/[state]`) | Yes | Inline section after informational blocks | Optional by default |
| City electricity pages (`/electricity-cost/[state]/[city]`) | Yes | Footer-style inline section | Optional by default |
| Appliance cost pages (`/cost-to-run/[appliance]/[state]`) | Yes | Inline section after primary cost/methodology sections | Optional by default |
| Electricity bill estimator pages (`/electricity-bill-estimator/[state]`) | Yes | Inline or footer section after scenario content | Optional by default |
| Calculator pages (`/electricity-cost-calculator/*`) | Yes | Inline section after calculator/scenario blocks | Optional by default |
| Energy comparison hub (`/energy-comparison`) | Yes | Footer-style inline section | Optional by default |

Placement constraints:

- Never render above the page's primary informational content.
- Never alter canonical tags or metadata.
- Never add uncontrolled route fan-out or non-deterministic content.

## 2) Commercial Module Architecture

New composable layer:

- `src/components/monetization/CommercialModule.tsx`
- `src/components/monetization/CommercialPlacement.tsx`
- `src/lib/monetization/placementConfig.ts`

### Module types

- `provider-comparison`
- `marketplace-cta`
- `affiliate-link-block`
- `educational-offer`

### Rendering model

- Deterministic, config-driven rendering.
- No external API calls or runtime AI generation.
- Leverages existing resolver systems:
  - `resolveMonetizationBlocks(...)`
  - `resolveProvidersForContext(...)`
- If configuration disables modules (or no eligible content exists), components render `null`.

## 3) Placement Rules and Controls

### Central configuration

`src/lib/monetization/placementConfig.ts` defines:

- global enable flag (`GLOBAL_COMMERCIAL_MODULES_ENABLED`)
- page-family-level enablement
- allowed module types
- module priority ordering
- default placement slot metadata
- optional-by-default behavior

### Canonical safety constraints

- Modules may only link to existing canonical/supporting routes already in policy.
- Modules cannot create new canonical owners.
- Modules cannot inject or modify metadata/canonical tags.

### Rollout and enablement controls

- Global kill switch: disable all modules centrally.
- Family-level enable switch: enable by template category.
- Module-level enable switch: staged activation by module type.
- Initial state is conservative: optional modules are integrated but disabled by default in placement config.

## 4) Initial Template Integrations

Integrated in this phase:

- `src/app/[state]/page.tsx` (state authority pages)
- `src/app/cost-to-run/[appliance]/[state]/page.tsx` (appliance cost pages)
- `src/app/electricity-bill-estimator/[slug]/page.tsx` (bill estimator state pages)
- `src/app/energy-comparison/page.tsx` (energy comparison hub)

All integrations occur after core informational sections.

## 5) Internal Linking Safety

Commercial modules must:

- avoid generating uncontrolled link inventories
- avoid linking to deferred route families
- avoid replacing or duplicating longtail internal link sections
- remain additive to existing rollout-aware navigation

The current module layer reuses pre-existing monetization/provider resolvers and does not introduce any new crawl fan-out surfaces.

## 6) How To Add Future Provider Integrations Safely

1. Add provider data to existing provider/partner configuration layers.
2. Keep `enabled: false` until policy and QA sign-off.
3. Enable per-family in `placementConfig.ts` only where intent alignment is clear.
4. Validate output with:
   - `npm run knowledge:build`
   - `npm run knowledge:verify`
   - `npm run build`
   - `npm run verify:vercel`
5. Confirm:
   - no canonical ownership drift
   - no sitemap route-family expansion
   - no links to deferred/non-canonical families
