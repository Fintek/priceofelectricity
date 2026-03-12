# Provider Expansion Infrastructure

Date: 2026-03-11  
Scope: Deterministic infrastructure hardening for large-scale provider onboarding  
Status: Implemented

## 1) Provider Infrastructure Audit

Audited systems:

- `src/lib/providers/providerResolver.ts`
- `src/lib/providers/providerPilot.ts`
- `src/lib/providers/providerRolloutPlan.ts`
- `src/components/monetization/CommercialPlacement.tsx`
- provider discovery sections on state, estimator, hub, and comparison surfaces

Audit conclusions:

- Rollout guardrails remain enforced through placement policy + pilot activation + rollout-plan validation.
- Provider discovery surfaces are deterministic and static-rendered.
- Resolver ranking and filtering are centralized and scalable for additional provider entries.
- Discovery copy and section structure were previously uneven across pages and needed standardization.

## 2) Provider Placement Logic Standardization

Standardized provider placement coverage for high-signal families by ensuring `CommercialPlacement` is consistently present on:

- state electricity pages
- bill estimator state pages
- energy comparison hub pages
- comparison hub discovery pages
- comparison index page
- electricity hubs index page

No rollout rule changes were made. Placement still resolves to empty output when pilot/rollout constraints are not met.

## 3) Provider Discovery Consistency Layer

Added shared deterministic provider discovery helpers:

- `src/lib/providers/providerDiscovery.ts`
  - shared section title/intro copy
  - shared link inventory generation
  - shared ItemList entry generation
- `src/components/providers/ProviderDiscoverySection.tsx`
  - standardized provider discovery section rendering

This keeps headings, explanatory framing, and link patterns consistent across estimator and comparison/hub surfaces while preserving canonical separation.

## 4) Marketplace Scalability Hardening

Scalability improvements:

- Added provider marketplace nodes to `contentRegistry` (`provider:hub`, `provider:{state}`) for clearer cross-cluster discoverability at scale.
- Kept resolver deterministic sort/diversity path unchanged and guardrail-enforced.
- Provider discovery rendering now uses reusable helper/component patterns rather than page-specific one-offs.

## 5) Structured Data Reinforcement

Reinforced provider marketplace schema on provider surfaces:

- `WebPage` + provider discovery `ItemList` on `/electricity-providers`
- `WebPage` + provider discovery `ItemList` on `/electricity-providers/[state]`
- shared provider `ItemList` entry generation reused by hubs/comparison surfaces

All schema remains deterministic and additive.

## 6) Discovery Graph Reinforcement

Extended provider graph pathways with explicit provider-to-hub discovery edges:

- `provider_to_hub_discovery` from `provider-marketplace` to:
  - `electricity-hubs`
  - `energy-comparison`

Existing provider edges to state, comparison, and estimator clusters remain in place.

## 7) Verification Hardening

Extended verification to guard provider expansion infrastructure:

- `scripts/indexing-readiness.ts`
  - added provider-link checks for `/electricity-hubs/comparisons` and `/electricity-cost-comparison`
- `scripts/readiness-audit.ts`
  - mirrored provider-link checks for the same comparison surfaces
- `scripts/verify-knowledge.js`
  - expanded provider discovery link checks to comparison surfaces
  - added placement-standardization check for required pages
  - added discovery-graph edge check for `provider_to_hub_discovery`

## 8) Canonical and Rollout Safety

- No new route families.
- No canonical ownership changes.
- No provider pilot/rollout guardrail changes.
- No runtime API dependencies introduced.
- All changes remain static-first and deterministic.
