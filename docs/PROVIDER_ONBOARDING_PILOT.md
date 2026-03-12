# Provider Onboarding Pilot

Date: 2026-03-11  
Scope: First real provider onboarding pilot (controlled activation)  
Status: Pilot plus controlled Tier-2 wave 1 activation

## 1) Readiness Summary

Current system readiness before pilot activation:

- Provider catalog model existed and supported static offer metadata.
- Provider resolver existed and returned deterministic provider lists with no runtime API calls.
- Commercial module integration already supported provider and marketplace module types.
- Placement config already controlled module eligibility by page family.

Pre-pilot tightening added in this pass:

- explicit pilot activation policy by family + state (`providerPilot.ts`)
- provider module gating in `CommercialPlacement`
- consistent reusable compliance note in provider module render paths
- narrowed provider exposure to approved pilot contexts only

## 2) Pilot Inventory (Static Catalog)

Catalog source: `src/lib/providers/providerCatalog.ts`

Pilot entries:

1. `pilot-choice-marketplace-sample`
   - name: `Pilot Choice Marketplace (Sample)`
   - states: `texas`, `pennsylvania`
   - type: `marketplace`
   - modules: `provider-comparison`, `marketplace-cta`
   - families: state pages, bill estimator pages, energy comparison hub

2. `pilot-regional-supplier-sample`
   - name: `Pilot Regional Supplier (Sample)`
   - states: `illinois`, `ohio`, `pennsylvania`, `texas`
   - type: `affiliate` (supplier-style referral)
   - modules: `provider-comparison`
   - families: state pages, bill estimator pages, appliance pages, energy comparison hub

3. `pilot-efficiency-affiliate-sample`
   - name: `Pilot Efficiency Affiliate (Sample)`
   - states: `ohio`, `pennsylvania`, `texas`
   - type: `affiliate`
   - modules: `provider-comparison`, `marketplace-cta`
   - families: state pages, bill estimator pages, energy comparison hub

Note: These are clearly labeled pilot/sample listings to avoid implying production commercial relationships.

## 3) Pilot Activation Rules

Activation source: `src/lib/providers/providerPilot.ts`

- Pilot flag: `PROVIDER_ONBOARDING_PILOT.enabled`
- Allowed families:
  - `state-electricity-pages`
  - `bill-estimator-pages`
  - `energy-comparison-hub-pages`
- Allowed module types:
  - `provider-comparison`
  - `marketplace-cta`
- State-scoped activation:
  - state pages: `texas`, `pennsylvania`, `ohio`, `illinois`, `new-jersey`, `new-york`
  - bill estimator state pages: `texas`, `pennsylvania`, `ohio`, `illinois`, `new-jersey`, `new-york`
  - energy comparison hub: national (not state-scoped)

## 4) Where Modules Are Live vs Blocked

### Live (pilot-on contexts)

- `src/app/[state]/page.tsx` for `texas`, `pennsylvania`, `ohio`, `illinois`, `new-jersey`, and `new-york`
- `src/app/electricity-bill-estimator/[slug]/page.tsx` for `texas`, `pennsylvania`, `ohio`, `illinois`, `new-jersey`, and `new-york`
- `src/app/energy-comparison/page.tsx`

### Blocked in this pilot

- calculator page family
- city electricity page family
- appliance page family (provider modules blocked for this pilot pass)

## 5) Disclosure and Compliance Rules

Reusable compliance component:

- `src/components/monetization/CommercialComplianceNote.tsx`

Rules:

- clearly label commercial context
- clarify non-affiliation (no utility/government endorsement implied)
- include affiliate disclosure behavior when affiliate-type offers are present
- link to site disclosures via existing disclosure patterns

## 6) Pre-Broader-Rollout Requirements

Before expanding beyond pilot:

1. Commercial QA on pilot pages (manual copy/compliance review).
2. Confirm partner/legal approval for any non-sample provider naming.
3. Expand state allowlist incrementally with per-batch QA.
4. Keep calculator/city families blocked until explicit policy decision.
5. Re-run full verification suite and inspect sitemap/canonical stability.

## 7) Recommended Next Step

Run **commercial QA + legal/compliance review** on the expanded state batch, then move to the next controlled Tier-2 batch (2-3 states max per pass).

## 8) QA Guidance for This Expansion Stage

Review checklist for expanded states:

1. Validate provider module visibility on `/{state}` and `/electricity-bill-estimator/{state}`.
2. Confirm commercial blocks render below primary informational sections.
3. Confirm disclosure/non-affiliation language appears consistently.
4. Confirm blocked families (calculator/city/appliance) remain inactive.
5. Re-run full verification before any additional state activation.
