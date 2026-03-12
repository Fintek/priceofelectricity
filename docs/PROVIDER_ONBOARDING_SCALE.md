# Provider Onboarding Scale

Date: 2026-03-11  
Scope: Deterministic provider onboarding scale hardening  
Status: Implemented

## 1) Provider Onboarding Audit

Audited systems:

- `src/lib/providers/providerResolver.ts`
- `src/lib/providers/providerPilot.ts`
- `src/lib/providers/providerCatalog.ts`
- `src/lib/providers/providerDiscovery.ts`
- `src/components/providers/ProviderDiscoverySection.tsx`
- provider discovery/placement surfaces on state, estimator, comparison, and hub families

Audit results:

- onboarding and placement remain deterministic and static-rendered
- rollout guardrails remain enforced via placement policy + pilot activation + rollout plan checks
- provider resolver ranking/diversity path remains centralized and deterministic
- provider registry supports multi-provider state expansion but needed stronger reusable coverage helpers and graph-level provider entity modeling

## 2) Provider Scalability Model

Scalability updates:

- added reusable provider catalog accessors:
  - `getEnabledProviderCatalogEntries()`
  - `getEnabledProviderCatalogEntriesForState(state)`
  - `getProviderCatalogCoverageByState()`
- enforced stable priority/name ordering for deterministic onboarding outputs
- expanded provider index/state pages with deterministic onboarding coverage summaries

This preserves current rollout exposure while making larger provider onboarding batches safer and more auditable.

## 3) Provider Discovery Architecture

Added shared multi-provider discovery support:

- `buildProviderOfferItemListEntries(...)`
- `getProviderDiscoveryStatesFromCatalog(...)`

Discovery and schema usage:

- provider marketplace pages now emit both discovery-state and configured-provider ItemList signals
- provider state pages now emit configured provider onboarding ItemList signals
- provider discovery sections remain informational and separated from canonical ownership of cost/bill/calculator clusters

## 4) Rollout Guardrails (Unchanged)

Guardrails remain unchanged:

- no new route families
- no canonical ownership changes
- no provider pilot scope widening in this phase
- no runtime API calls
- no uncontrolled page generation

## 5) Discovery Graph and Registry Reinforcement

Added scalable provider entity pathways:

- provider entity nodes generated from enabled provider catalog entries
- provider entity edges to:
  - provider marketplace hub
  - state electricity cluster
  - comparison cluster
  - estimator discovery cluster
  - appliance cluster

Also reinforced content registry linkage between state nodes and provider marketplace state nodes.

## 6) Verification Hardening

Extended verification for onboarding scale:

- catalog uniqueness + multi-provider state coverage checks
- provider discovery helper/component integrity checks
- discovery graph pathway checks for:
  - `provider_to_provider_marketplace_hub`
  - `provider_to_appliance_cluster`
- indexing/readiness checks for provider marketplace pages and provider state canonical-cluster linking

## 7) Provider Onboarding Workflow

Recommended scale workflow:

1. Add/update provider records in `providerCatalog.ts`.
2. Validate deterministic coverage using helper functions and verify checks.
3. Keep rollout activation changes isolated to `providerPilot.ts` (separate prompt).
4. Re-run:
   - `npm run knowledge:build`
   - `npm run knowledge:verify`
   - `npm run build`
   - `npm run verify:vercel`
5. Review provider discovery graph and provider marketplace surfaces before expanding activation.
