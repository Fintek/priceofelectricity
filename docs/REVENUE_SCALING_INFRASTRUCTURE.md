# Revenue Scaling Infrastructure

Date: 2026-03-12  
Scope: Deterministic revenue-surface scaling and provider discovery hardening  
Status: Implemented

## 1) Revenue Surface Audit

Audited surfaces:

- `CommercialModule` and `CommercialPlacement`
- provider marketplace index/state pages
- state electricity pages
- bill estimator state pages
- comparison and hub discovery pages (`/electricity-cost-comparison`, `/energy-comparison`, `/electricity-hubs`)

Audit conclusions:

- commercial surfaces remain informational and non-transactional
- placement is deterministic and rollout/pilot constrained
- provider discovery remains canonical-safe and crawl-safe
- revenue pathways existed but marketplace pages needed the same centralized placement layer as other high-signal families

## 2) Revenue Surface Standardization

Standardization changes:

- introduced a dedicated monetization placement family: `provider-marketplace-pages`
- enabled deterministic provider modules for that family via existing pilot and rollout-plan guardrails
- integrated `CommercialPlacement` into:
  - `/electricity-providers`
  - `/electricity-providers/[state]`
- standardized commercial discovery messaging by reusing provider discovery intro text in `CommercialModule`

## 3) Commercial Pathway Expansion

Expanded deterministic revenue pathways:

- provider index now explicitly connects to:
  - `/offers`
  - `/electricity-shopping/by-state`
  - `/energy-comparison`
  - canonical state/comparison clusters
- provider state pages now explicitly connect to:
  - `/offers/[state]`
  - `/electricity-cost-calculator/[state]`
  - canonical state/estimator/comparison clusters
- state and bill-estimator families are now checked for provider + offers pathway signals in readiness scripts

## 4) Provider Offer Signals

Offer-signal reinforcement remains informational:

- provider comparison and CTA blocks consistently show:
  - coverage context
  - plan-type summary
  - deterministic ranking explanation
- no transactional quote, enrollment, or runtime offer APIs were introduced

## 5) Structured Data Reinforcement

Added shared commercial schema helper in `src/lib/seo/jsonld.ts`:

- `buildCommercialPathwayItemListJsonLd(...)`

Used for:

- provider index commercial pathways
- provider state commercial pathways
- energy comparison commercial pathways

This keeps commercial ItemList schema deterministic and standardized.

## 6) Discovery Graph Expansion

Reinforced discovery graph revenue relationships:

- existing:
  - `commercial_surface_to_provider_marketplace`
  - `provider_to_state_cluster`
  - `provider_to_comparison_cluster`
  - `provider_to_estimator_discovery`
- added explicit provider-marketplace pathway edges:
  - `provider_marketplace_to_state_cluster`
  - `provider_marketplace_to_comparison_cluster`
  - `provider_marketplace_to_estimator_cluster`

## 7) Verification Hardening

Verification updates:

- marketplace maturity page checks now require standardized commercial ItemList helper signal
- placement standardization check now includes provider marketplace pages
- discovery graph checks include explicit provider-marketplace revenue pathway edge signals
- readiness/indexing checks now validate:
  - provider index includes `/electricity-shopping/by-state`
  - provider state includes `/electricity-cost-calculator/[state]`
  - state and bill-estimator pages include provider + offers pathways

## 8) Guardrail Status

- no new public route families
- no canonical ownership changes
- no rollout guardrails removed
- no runtime APIs added
- no uncontrolled generation behavior introduced
