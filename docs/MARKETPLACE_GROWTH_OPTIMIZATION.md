# Marketplace Growth Optimization

Date: 2026-03-11  
Scope: Provider marketplace visibility and discovery reinforcement  
Status: Implemented (cluster-safe, rollout-safe)

## 1) Provider Discovery Audit Summary

Audited marketplace visibility across:

- state electricity pages (`/[state]`)
- comparison hubs (`/electricity-hubs`, `/energy-comparison`)
- estimator state pages (`/electricity-bill-estimator/[state]`)

Findings:

- Provider modules are rollout-gated and deterministic via `providerPilot`, `placementConfig`, and `providerResolver`.
- Commercial placements already render in approved families only:
  - `state-electricity-pages`
  - `bill-estimator-pages`
  - `energy-comparison-hub-pages`
- Canonical ownership remained intact; provider surfaces did not override canonical owners for state cost, usage, bill, appliance, or comparison intent.
- Discovery pathways to provider pages were present but unevenly reinforced across hub and estimator content sections.

## 2) Marketplace Reinforcement Strategy

This phase strengthens provider discoverability without architecture changes:

1. Add explicit provider discovery sections on high-signal hubs and estimator state pages.
2. Keep provider links informational and supplemental to canonical clusters.
3. Preserve rollout and placement controls (no provider rollout expansion in this phase).
4. Reinforce provider discovery from existing canonical clusters, not through new route families.

## 3) Structured Data Improvements

Added deterministic `ItemList` reinforcement for provider discovery pathways on:

- `/electricity-hubs`
- `/energy-comparison`
- `/electricity-bill-estimator/[state]`

Purpose:

- improve crawl understanding of provider discovery pathways
- keep schema additive and non-conflicting with canonical intent schemas

## 4) Discovery Graph Reinforcement

Added provider discovery graph node and deterministic edges:

- node: `provider-marketplace` -> `/electricity-providers`
- edges:
  - `provider_to_comparison_cluster`
  - `provider_to_state_cluster`
  - `provider_to_estimator_discovery`
  - `comparison_to_provider_discovery`
  - `hub_to_provider_discovery`

These edges model discovery pathways only; they do not alter canonical ownership.

## 5) Verification Hardening

Extended existing verification surfaces to cover marketplace growth signals:

- `scripts/indexing-readiness.ts`
  - asserts provider discovery links on `/electricity-hubs` and `/energy-comparison`
- `scripts/readiness-audit.ts`
  - mirrors provider discovery link checks for production-readiness audit
- `scripts/verify-knowledge.js`
  - checks provider discovery link signals on hub and estimator templates
  - checks provider marketplace node/edge signals in `public/discovery-graph.json`

## 6) Canonical and Rollout Safety

- No new route families introduced.
- No canonical ownership changes.
- No provider rollout behavior changes (state/family activation unchanged).
- No runtime APIs introduced.
- All changes remain static-first and deterministic.
