# Monetization Optimization

Date: 2026-03-12  
Scope: Commercial module clarity, consistency, and marketplace pathway reinforcement  
Status: Implemented

## 1) Monetization Architecture Snapshot

Primary monetization surfaces remain:

- `CommercialPlacement` placement layer (family + pilot + rollout constrained)
- `CommercialModule` rendering layer (informational provider comparison + marketplace pathway modules)
- provider marketplace pages (`/electricity-providers`, `/electricity-providers/[state]`)
- state electricity, bill estimator, and comparison/hub discovery families

All rendering remains deterministic and static-first with no runtime APIs.

## 2) Commercial Module Placement Rules

Placement rules remain centralized and unchanged in policy:

- family configuration in `src/lib/monetization/placementConfig.ts`
- provider family/module guard in placement config
- pilot activation in `src/lib/providers/providerPilot.ts`
- rollout plan validation in `src/lib/providers/providerRolloutPlan.ts`

Optimization change:

- `CommercialPlacement` now computes a single deterministic `eligibleRules` set and short-circuits when no modules qualify.

## 3) Commercial Module Clarity Improvements

`CommercialModule` improvements:

- standardized headings (`Provider marketplace comparison`, `Marketplace pathways`)
- explicit comparison summary of offer-type mix
- richer informational context in marketplace CTA (coverage + plan context)
- preserved non-transactional framing and compliance note behavior

## 4) Provider Monetization Surfaces

Provider marketplace pages now include clearer commercial pathway visibility:

- `/electricity-providers` links to:
  - `/offers`
  - `/compare-electricity-plans/by-state`
  - `/electricity-shopping/by-state`
  - `/energy-comparison`
- `/electricity-providers/[state]` links to:
  - `/offers/[state]`
  - `/{state}/plans`
  - `/electricity-cost-calculator/[state]`
  - `/energy-comparison`

These remain informational discovery/revenue pathways, not transactional checkout flows.

## 5) Structured Data Reinforcement

Provider marketplace surfaces now include additional ItemList signals for commercial pathway visibility:

- provider index: `Commercial marketplace pathways` ItemList
- provider state pages: `{State} commercial provider pathways` ItemList

Schema remains deterministic and additive.

## 6) Discovery Graph and Revenue Pathway Design

Discovery graph reinforcement adds a commercial discovery cluster:

- node: `commercial-surfaces` (`/offers`)
- edges:
  - `commercial_surface_to_provider_marketplace`
  - `provider_to_commercial_discovery`
  - existing provider-to-comparison/provider-info/provider-marketplace paths retained

This models marketplace monetization visibility while preserving canonical ownership elsewhere.

## 7) Verification Coverage

Verification now explicitly guards monetization optimization signals:

- provider comparison clarity checks include commercial pathway visibility signals
- discovery graph checks include new commercial discovery node/edges
- indexing/readiness checks validate provider page links to `/offers` and `/offers/[state]`

## 8) Guardrail Status

- no new route families
- no canonical ownership changes
- no rollout guardrails removed
- no runtime APIs introduced
- no uncontrolled generation behavior
