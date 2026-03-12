# Commercial QA and Selective Rollout

Date: 2026-03-11  
Scope: Provider onboarding pilot QA and selective rollout expansion  
Status: Complete

## 1) Commercial Surface Inventory

Evaluated contexts:

- State authority pages (`/[state]`)
- Bill estimator state pages (`/electricity-bill-estimator/[state]`)
- Energy comparison hub (`/energy-comparison`)
- Blocked contexts:
  - calculator family
  - city electricity family
  - appliance family

Inventory results:

| Context | Placement config allows provider modules | Pilot activation currently enables | Module types that can render | Compliance output | Placement position |
|---|---|---|---|---|---|
| State authority pages | Yes | Yes (state-scoped) | `provider-comparison`, `marketplace-cta` | Yes (`CommercialComplianceNote`) | After primary informational content |
| Bill estimator state pages | Yes | Yes (state-scoped) | `provider-comparison`, `marketplace-cta` | Yes (`CommercialComplianceNote`) | After primary informational content |
| Energy comparison hub | Yes | Yes (hub live) | `provider-comparison`, `marketplace-cta` | Yes (`CommercialComplianceNote`) | After primary informational sections |
| Calculator pages | No (provider modules blocked) | No | None | N/A | N/A |
| City electricity pages | No (provider modules blocked) | No | None | N/A | N/A |
| Appliance pages | Provider modules not active in current pilot | No | None | N/A | N/A |

## 2) Commercial QA Audit Summary

Checks completed:

- provider modules render only in approved pilot contexts via `CommercialPlacement` + `providerPilot`
- blocked families remain blocked
- placements appear below primary informational blocks in all active templates
- compliance/disclosure copy is consistent via `CommercialComplianceNote`
- non-affiliation language is explicit and stable
- module behavior degrades gracefully (`null`) when no provider applies
- state targeting remains deterministic through static config
- canonical metadata and route ownership remain unchanged

No blocker-level QA issue found.

## 3) Selective Rollout Decision

Decision: **expand conservatively by one state**.

Justification:

- Ohio is already represented by pilot supplier/affiliate entries.
- Expansion remains reviewable and low risk.
- Keeps rollout narrow while increasing sample coverage beyond TX/PA.

Change made:

- Added `ohio` to provider pilot activation for:
  - state authority pages
  - bill estimator state pages

No family expansion beyond current architecture.

## 4) Live vs Blocked Surfaces (Current)

### Live provider-module surfaces

- State authority pages for: `texas`, `pennsylvania`, `ohio`
- Bill estimator state pages for: `texas`, `pennsylvania`, `ohio`
- Energy comparison hub (national hub context)

### Blocked surfaces

- Calculator pages
- City electricity pages
- Appliance pages (for provider modules in this pilot pass)

## 5) Compliance and Disclosure Rules

Live provider modules must:

- show commercial-context labeling
- include non-affiliation language
- include affiliate/general disclosure behavior
- avoid utility/government endorsement framing

Current reusable source:

- `src/components/monetization/CommercialComplianceNote.tsx`

## 6) Preconditions Before Broader Rollout

1. Manual commercial QA pass on live states/pages.
2. Legal/compliance sign-off for any non-sample provider naming.
3. Controlled addition of 1-3 states per batch with re-verification.
4. Keep calculator/city contexts blocked until explicit policy decision.
5. Maintain deterministic resolver + placement controls.

## 7) Recommended Next Step

Proceed to **broader provider rollout planning** with a state-batch plan and compliance review gate, starting from the now-validated TX/PA/OH pilot.
