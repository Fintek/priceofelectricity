# Provider Marketplace Integration

Date: 2026-03-11  
Scope: Provider marketplace data layer for CommercialModule placements  
Mode: Static-first, deterministic, canonical-safe

## 1) Provider Catalog Architecture

Primary catalog file:

- `src/lib/providers/providerCatalog.ts`

The catalog is version-controlled, deterministic, and static.

Each entry includes:

- `providerId`
- `providerName`
- `serviceStates`
- `offerType` (`supplier`, `marketplace`, `affiliate`)
- `offerDescription`
- `signupUrl`
- optional `trackingParams`
- optional `regulatoryNotes`
- `enabled`
- `allowedPageFamilies`
- `allowedModuleTypes`
- `priority`

This structure supports state-specific availability, affiliate pathways, and marketplace/supplier placement logic without runtime API calls.

## 2) Resolver Logic

Resolver file:

- `src/lib/providers/providerResolver.ts`

Main resolver:

- `resolveProviderMarketplaceOffers({ state, pageFamily, moduleType, maxResults })`

Deterministic filtering rules:

1. module/family allowlist guard from monetization placement policy
2. entry must be `enabled`
3. state must match `serviceStates`
4. entry must allow the target `pageFamily`
5. entry must allow the target `moduleType`
6. deterministic sort by `priority` then `providerName`

Resolver outputs include:

- normalized offer fields
- deterministic tracked URL assembly (sorted query params)
- affiliate disclosure signal

No external APIs are called.

## 3) Commercial Module Integration Rules

Integrated modules:

- `provider-comparison`
- `marketplace-cta`

Integration path:

- `src/components/monetization/CommercialModule.tsx`
- `src/components/monetization/CommercialPlacement.tsx`

Behavior:

- modules query resolver data by `pageFamily` + `state`
- if no eligible offers exist, render `null`
- modules remain optional and config-controlled via `src/lib/monetization/placementConfig.ts`
- canonical metadata is not modified

## 4) Placement and Policy Constraints

Provider module allowlist is enforced to these families:

- `state-electricity-pages`
- `bill-estimator-pages`
- `energy-comparison-hub-pages`
- `appliance-cost-pages` (optional)

Provider modules are explicitly blocked from:

- `calculator-pages`
- `city-electricity-pages`

unless a future policy change explicitly allows them.

## 5) Compliance / Disclosure Requirements

Provider modules must:

- clarify informational vs commercial intent
- avoid implying utility affiliation or official endorsement
- include affiliate disclosure when affiliate-type offers are present
- link to `/disclosures` via existing disclosure components

Current implementation uses:

- `DisclosureNote` in provider comparison and marketplace CTA render paths
- explicit non-affiliation language in module copy

## 6) Safe Onboarding Workflow

To add a real provider:

1. Add catalog entry in `providerCatalog.ts` with `enabled: false`.
2. Configure `serviceStates`, `allowedPageFamilies`, and `allowedModuleTypes`.
3. Add regulatory notes and disclosure-safe copy.
4. Enable only after policy/compliance review.
5. Run:
   - `npm run knowledge:build`
   - `npm run knowledge:verify`
   - `npm run build`
   - `npm run verify:vercel`
6. Confirm no canonical or sitemap ownership drift.
