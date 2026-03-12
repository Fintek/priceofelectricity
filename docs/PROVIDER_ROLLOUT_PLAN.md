# Provider Rollout Plan

Date: 2026-03-11  
Scope: Broader provider rollout planning framework (guardrail-only)  
Status: Active planning policy + controlled Tier-2 wave 1 live

## 1) Rollout Expansion Inventory (Current)

Current live pilot states:

- `texas`
- `pennsylvania`
- `ohio`
- `illinois`
- `new-jersey`
- `new-york`

Current live provider page families:

- `state-electricity-pages`
- `bill-estimator-pages`
- `energy-comparison-hub-pages`

Current blocked provider families:

- `calculator-pages`
- `city-electricity-pages`
- `appliance-cost-pages` (future review, currently inactive)

Current provider types in catalog:

- `marketplace`
- `affiliate` (supplier-style + efficiency affiliate samples)

Current provider module types enabled in pilot contexts:

- `provider-comparison`
- `marketplace-cta`

## 2) State Rollout Tier Structure

Source of truth: `src/lib/providers/providerRolloutPlan.ts`

Tiers:

- **Tier 1 — Pilot states**
  - states: `texas`, `pennsylvania`, `ohio`
  - provider modules: allowed
  - marketplace modules: allowed
- **Tier 2 — Deregulated expansion states**
  - states: `illinois`, `new-jersey`, `new-york`, `maryland`, `connecticut`, `massachusetts`, `rhode-island`, `delaware`
  - provider modules: allowed
  - marketplace modules: allowed
- **Tier 3 — Limited marketplace states**
  - states: `maine`, `new-hampshire`
  - provider modules: allowed
  - marketplace modules: blocked
- **Tier 4 — Informational-only states**
  - states: all remaining states not included above
  - provider modules: blocked
  - marketplace modules: blocked

## 3) Page Family Rollout Policy

Policy source: `PROVIDER_PAGE_FAMILY_ROLLOUT_POLICY`

- `state-electricity-pages`: **allowed**
- `bill-estimator-pages`: **allowed**
- `energy-comparison-hub-pages`: **allowed**
- `appliance-cost-pages`: **future-review**
- `city-electricity-pages`: **permanently-blocked**
- `calculator-pages`: **permanently-blocked**

## 4) Guardrail Behavior

The rollout plan is a **validation guard**, not an activation trigger.

- Pilot activation still controls live exposure (`providerPilot.ts`).
- Resolver consults rollout plan to block invalid state/family contexts.
- Resolver cannot expand exposure outside pilot by itself.

## 5) Compliance and Expansion Safety Rules

1. Keep commercial placement after primary informational content.
2. Preserve non-affiliation and disclosure behavior (`CommercialComplianceNote`).
3. Expand states in small, auditable batches.
4. Keep blocked families blocked unless policy is explicitly revised.
5. Re-run full verification after any rollout plan or pilot scope change.

## 6) Safe Onboarding + Expansion Workflow

1. Add or update provider catalog entry with deterministic metadata.
2. Confirm state/family/module fit against rollout plan tiers and family policy.
3. Keep provider disabled until compliance review complete.
4. Expand pilot activation centrally in `providerPilot.ts` only after sign-off.
5. Run:
   - `npm run knowledge:build`
   - `npm run knowledge:verify`
   - `npm run build`
   - `npm run verify:vercel`

## 7) Current Rollout Stage and QA Guidance

Current stage: **Controlled multi-state expansion (Tier-2 wave 1)**.

Wave-1 active states:

- `texas`, `pennsylvania`, `ohio` (Tier 1)
- `illinois`, `new-jersey`, `new-york` (Tier 2 subset)

QA guidance for each additional batch:

1. Limit each expansion to 2-4 states.
2. Confirm catalog coverage exists for both `provider-comparison` and `marketplace-cta` where intended.
3. Validate state and bill-estimator render behavior before broader activation.
4. Keep calculator/city/appliance families blocked until explicit policy update.

## 8) Provider Scaling Strategy

Scaling approach for active rollout states:

1. Expand in small state batches (2-4 states) with deterministic activation in `providerPilot.ts`.
2. Ensure each active state has at least one marketplace-capable entry and one comparison-capable entry where practical.
3. Prefer additive catalog growth over broad rewrites; keep provider entries reviewable and policy-auditable.
4. Keep catalog naming and claims conservative (sample/informational, no speculative savings guarantees).

## 9) Provider Diversity Guidance

For active states and allowed page families:

- avoid single-type dominance in provider-comparison modules
- include a balanced mix of `marketplace`, `supplier`, and `affiliate` entries when available
- keep `marketplace-cta` pathways focused on marketplace-aligned offers
- maintain clear regulatory/compliance notes per entry

## 10) Resolver Ranking Rules

Current resolver ranking policy (deterministic):

1. enforce placement policy + pilot activation + rollout-plan guardrails
2. rank by provider priority plus module-aware offer-type weighting
3. apply stable tie-break with `providerName` lexical ordering
4. apply deterministic diversity pass for provider-comparison results to reduce duplicate-type clustering
5. slice by `maxResults` after ranking/diversity resolution

