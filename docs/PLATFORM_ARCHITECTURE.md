# Platform Architecture

Date: 2026-03-12  
Status: Active reference  
Scope: Platform completion and long-term stability baseline

## Platform architecture overview

PriceOfElectricity.com is a static-first, deterministic Next.js platform organized around canonical intent families, rollout-gated longtail surfaces, and generated knowledge assets. Core systems are centralized in a small set of architecture files:

- canonical + metadata policy and ownership controls
- sitemap and robots generation
- longtail rollout and internal-link helpers
- provider marketplace and monetization placement controls
- knowledge and discovery graph generation with verification checks

The platform intentionally avoids runtime external APIs and transactional flows in canonical content systems.

## Canonical cluster structure

Canonical intent ownership remains separated by cluster:

- state authority and electricity cost context
- average bill, bill estimator, calculator, and fixed-kWh usage cost
- appliance cost intent and pilot-gated appliance x city intent
- comparison intent in canonical comparison families
- provider marketplace discovery/support surfaces

Support and legacy routes are redirect-oriented and excluded from canonical sitemap ownership. Rollout-gated families remain centrally controlled and deterministic.

## Provider marketplace architecture

Provider marketplace architecture is configuration-driven and rollout-governed:

- provider records are centralized in `providerCatalog.ts`
- resolver logic in `providerResolver.ts` applies deterministic ranking/diversity rules
- placement eligibility is governed by:
  - `placementConfig.ts`
  - `providerPilot.ts`
  - `providerRolloutPlan.ts`
- discovery messaging and schema entry generation are centralized in `providerDiscovery.ts`

Marketplace surfaces remain informational and non-transactional while linking users into canonical cost/comparison/estimator clusters.

## Monetization architecture

Monetization architecture is centralized and static-safe:

- `CommercialPlacement` resolves family-eligible modules deterministically
- `CommercialModule` renders informational provider comparison and marketplace pathway modules
- all modules are optional and degrade gracefully when no eligible providers exist
- coverage, plan context, and feature highlights are deterministic provider attributes

No intrusive or runtime transactional behavior is introduced by this architecture layer.

## Discovery graph system

Discovery graph generation in `scripts/knowledge-build.ts` models canonical and discovery pathways:

- canonical cluster nodes (state, bill, calculator, usage, appliance, comparison)
- hub discovery nodes (`electricity-hubs`, `energy-comparison`)
- provider marketplace and provider information nodes
- commercial discovery node (`commercial-surfaces`)

Deterministic relationship sets connect:

- provider marketplace to state/comparison/estimator clusters
- commercial surfaces to provider marketplace discovery
- provider entities to marketplace, hubs, and canonical research pathways

The generation step includes lightweight integrity assertions to guard required node and relationship presence.

## Verification infrastructure

Verification is layered and lightweight:

- `knowledge:build` generates deterministic assets
- `knowledge:verify` validates structural guardrails, canonical safety, and discovery graph integrity
- `indexing-readiness.ts` and `readiness-audit.ts` verify crawl/index pathways and canonical-cluster links
- `build` and `verify:vercel` enforce end-to-end production readiness

This verification surface is designed to catch drift early while keeping architecture behavior stable and additive.

## Stability guardrails

- deterministic generation only
- static-first rendering and indexing-safe pathways
- no canonical ownership changes outside explicit policy updates
- no rollout guardrail removals without explicit architecture decisions
- no runtime provider APIs or uncontrolled page generation
