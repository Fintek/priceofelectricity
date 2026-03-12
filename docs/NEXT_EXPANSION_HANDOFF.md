# Expansion Handoff — Appliance Cost Engine Expansion

**Date:** 2026-02-25  
**Status:** Appliance expansion and rollout hardening complete  
**Source of truth:** `docs/ROADMAP_EXPANSION_NEXT_PHASES.md`

---

## Appliance Rollout Control (Post-Expansion)

**Where controlled:** `src/lib/longtail/rollout.ts` — `ACTIVE_APPLIANCE_SLUGS`, `getActiveApplianceSlugs()`, `isActiveApplianceSlug()`.

**Rule:** Raw appliance config (`APPLIANCE_CONFIGS` in `applianceConfig.ts`) defines the full inventory. Rollout-enabled inventory is the subset in `ACTIVE_APPLIANCE_SLUGS`. Only active appliances are generated, sitemapped, and linked.

**To enable a new appliance:** Add it to `APPLIANCE_CONFIGS`, then add its slug to `ACTIVE_APPLIANCE_SLUGS` in `rollout.ts`. To gate a new appliance, add it to config but omit from `ACTIVE_APPLIANCE_SLUGS` until rollout is ready.

**Generation surfaces** that use rollout control: `getApplianceLongtailStaticParams()`, `getCalculatorApplianceStaticParams()`, `getUsageApplianceStaticParams()`, sitemap, `buildCalculatorApplianceLinks()`, `getRelatedAppliances()`, electricity-usage hub.

---

## A. Confirmed Current Roadmap Position

The stabilization cycle (Prompts 1–5) is complete. All audit items (E-001 through E-010) have been dispositioned as resolved, intentionally deferred, or monitoring-only. The final stabilization review (`docs/FINAL_STABILIZATION_REVIEW.md`) concluded with **"Decision: ready to return to expansion roadmap."**

No expansion work has been started yet. The roadmap document is planning-only.

## B. First Incomplete Roadmap Item

**Item 1: Appliance Cost Engine Expansion**

From `docs/ROADMAP_EXPANSION_NEXT_PHASES.md`:

> Expand appliance coverage and scenario depth to capture additional consumer appliance-intent queries while reusing the current appliance cost model and calculator architecture.

Priority: **High (first expansion step)**

## C. Why This Is the Correct Next Item

1. It is explicitly listed as the first item in the "Future Implementation Sequence" section of the roadmap.
2. It has no unresolved dependencies — all required infrastructure already exists.
3. It does not require new datasets, new route families, or new canonical policy decisions.
4. It is purely additive: expanding the appliance list in `applianceConfig.ts` automatically propagates through existing `cost-to-run`, `electricity-cost-calculator`, and `electricity-usage/appliances` route families.
5. It carries the lowest risk of any roadmap item because it extends an already-proven architecture.

## D. Systems and Files Likely Involved

### Core config file (primary change surface)

- `src/lib/longtail/applianceConfig.ts` — add new `ApplianceConfig` entries to `APPLIANCE_CONFIGS`

### Route families that automatically pick up new appliances (no changes expected)

- `src/app/cost-to-run/[appliance]/[state]/page.tsx` — uses `getApplianceLongtailStaticParams()` which iterates `APPLIANCE_CONFIGS`
- `src/app/electricity-cost-calculator/[slug]/[appliance]/page.tsx` — uses `getCalculatorApplianceStaticParams()` which iterates `APPLIANCE_CONFIGS`
- `src/app/electricity-usage/appliances/[appliance]/page.tsx` — uses `APPLIANCE_CONFIGS.map()` in `generateStaticParams()`

### Sitemap (no changes expected)

- `src/app/sitemap.ts` — already iterates `SUPPORTED_APPLIANCE_SLUGS` for all three route families

### Shared helpers (no changes expected unless new categories are needed)

- `src/lib/longtail/applianceLongtail.ts`
- `src/lib/longtail/calculatorCluster.ts`
- `src/lib/longtail/usageIntelligence.ts`

### Internal linking (may need minor update)

- `src/lib/longtail/internalLinks.ts` — verify `FEATURED_APPLIANCE_SLUGS` still represents a good default set
- `src/lib/longtail/applianceConfig.ts` — may want to update `FEATURED_APPLIANCE_SLUGS` to include high-value new appliances

### Knowledge build and verification

- `scripts/knowledge-build.ts` — no changes expected (appliance pages are not knowledge-generated)
- `scripts/verify-knowledge.js` — no changes expected

## E. Dependencies Already Satisfied

| Dependency | Status |
|---|---|
| `LongtailStateTemplate` component | Exists and working |
| `calculateApplianceOperatingCost()` helper | Exists and working |
| `buildApplianceScenarioRows()` calculator helper | Exists and working |
| `getApplianceUsageReference()` usage helper | Exists and working |
| Internal link engine integration | Exists and working |
| Sitemap integration for all three appliance route families | Exists and working |
| Monetization/provider placement hooks | Exists and working |
| Canonical policy for appliance routes | Documented in `docs/CANONICAL_ARCHITECTURE_POLICY.md` |
| Generated output policy | Documented in `docs/GENERATED_OUTPUT_POLICY.md` |

## F. Small Prerequisites Still Needed Before Implementation

**None identified.** The architecture is fully ready.

The only decision the implementation prompt needs to make is **which new appliances to add**. Candidate appliances should be:

- High search volume consumer appliances not yet in the config
- Appliances with well-understood wattage ranges
- Appliances that fit existing categories or justify a new category

### Current appliance inventory (12 appliances)

| Slug | Category | Avg Wattage |
|---|---|---|
| refrigerator | kitchen | 180 W |
| space-heater | climate | 1,500 W |
| window-ac | climate | 900 W |
| portable-ac | climate | 1,100 W |
| central-ac | climate | 3,500 W |
| clothes-dryer | laundry | 3,000 W |
| washing-machine | laundry | 700 W |
| dishwasher | kitchen | 1,500 W |
| electric-oven | kitchen | 3,000 W |
| microwave | kitchen | 1,200 W |
| gaming-pc | electronics | 450 W |
| electric-vehicle-charger | transport | 7,200 W |

### Candidate new appliances (suggested, not prescriptive)

High-value candidates based on search intent and consumer relevance:

- **water-heater** (climate/water) — 4,500 W typical, very high monthly cost
- **pool-pump** (outdoor) — 1,500 W typical, seasonal
- **dehumidifier** (climate) — 500 W typical
- **chest-freezer** (kitchen) — 100 W typical
- **hair-dryer** (personal) — 1,800 W typical, short runtime
- **television** (electronics) — 150 W typical
- **laptop** (electronics) — 65 W typical
- **ceiling-fan** (climate) — 75 W typical
- **heat-pump** (climate) — 3,000 W typical
- **electric-blanket** (climate) — 200 W typical
- **coffee-maker** (kitchen) — 1,000 W typical
- **air-purifier** (climate) — 50 W typical
- **sump-pump** (outdoor) — 800 W typical, intermittent
- **hot-tub** (outdoor) — 3,000 W typical

New `ApplianceCategory` values may be needed (e.g., `"outdoor"`, `"personal"`, `"water"`).

## City Electricity Pages — Phase 1 (Implemented)

- **Canonical family implemented:** `/electricity-cost/[state]/[city]`
- **Primary intent:** city authority/context electricity-cost discovery (not calculator intent, not bill benchmark intent)
- **Rollout gate source of truth:** `src/lib/longtail/rollout.ts`
  - `ACTIVE_CITY_PAGE_KEYS`
  - `getActiveCityPages()`
  - `getActiveCitiesForState()`
- **Methodology rule:** city values are deterministic estimates and explicitly disclosed as modeled/reference context, not utility tariff quotes.
- **Legacy city route behavior:** `/{state}/city/{citySlug}` and `/{state}/{city}` redirect to `/electricity-cost/{state}/{city}` for rollout-enabled cities.

### Explicitly Deferred

- `/average-electricity-bill/[state]/[city]` (city bill benchmark family)
- `/electricity-cost-calculator/[state]/[city]` (city calculator family)

These remain deferred to avoid overlapping canonical intent with existing bill and calculator families.

## Appliance × State Gap Analysis (Pre-Implementation)

### Already implemented before this prompt

- Canonical appliance state families are active and rollout-gated:
  - `/cost-to-run/[appliance]/[state]`
  - `/electricity-cost-calculator/[state]/[appliance]`
- Expanded appliance inventory and deterministic assumptions are in place.
- Appliance static params, sitemap entries, and related appliance links already use rollout-controlled appliance slugs.
- Appliance pages already bridge to usage-cost, calculator, and average-bill/state-level clusters through existing longtail link sections.

### Remaining roadmap-level gap

- Appliance × State pages do not yet provide a strong, explicit bridge into the new rollout-enabled city authority layer with appliance-specific city-context interpretation.
- Existing city links are generic and limited; the phase can be strengthened with a deterministic appliance-cost-by-city context block that links only to rollout-enabled city pages.

### Scope for this prompt

- Add rollout-aware, deterministic city-context sections to canonical appliance state pages and appliance calculator pages.
- Keep city references supplemental only; do not create appliance × city routes.
- Preserve canonical ownership:
  - appliance cost intent remains canonical at `/cost-to-run/[appliance]/[state]`
  - calculator intent remains canonical at `/electricity-cost-calculator/[state]/[appliance]`
  - city authority intent remains canonical at `/electricity-cost/[state]/[city]`

## Appliance × State Phase Completion (Implemented)

### What already existed before this pass

- Canonical appliance state and appliance calculator families were already live and rollout-gated.
- Deterministic appliance assumptions, scenario tables, and cross-links to usage/bill/calculator clusters were already present.
- No appliance × city routes existed.

### What this pass added

- Added deterministic appliance-city context sections on:
  - `/cost-to-run/[appliance]/[state]`
  - `/electricity-cost-calculator/[state]/[appliance]`
- City references are rollout-aware and sourced from `loadActiveCityElectricitySummariesForState()`; only rollout-enabled city authority pages are linked.
- Added explicit intent-separation copy to keep city links supplemental and non-canonical for appliance intent.

### Why this closes Appliance × State

- Appliance state pages now provide stronger state economics plus local city context bridges without introducing appliance × city canonical routes.
- Internal links now connect appliance state intent with city authority intent in a controlled, rollout-safe way.
- Canonical ownership remains unchanged.

### Still deferred to Appliance × City

- No `/cost-to-run/[appliance]/[state]/[city]` family
- No `/electricity-cost-calculator/[state]/[city]/[appliance]` family
- No appliance-by-city static params, sitemap entries, or canonical ownership changes

## Appliance × City Readiness and Pilot Decision (Implemented)

### Readiness summary

- **Already satisfied indirectly:** appliance state pages and appliance calculator pages already provide city-context bridges through rollout-enabled city authority links.
- **Missing for true Appliance × City:** dedicated canonical appliance-city route ownership, separate rollout controls, and explicit hard caps on fan-out.
- **Methodology readiness:** existing city methodology/disclosure framework is sufficient for a tightly controlled pilot because city-rate estimates are deterministic and already disclosed as modeled/reference context.

### Canonical decision

- **Primary intent:** city-qualified appliance operating-cost intent.
- **Canonical owner (pilot):** `/cost-to-run/[appliance]/[state]/[city]`.
- **Deferred overlap:** no appliance-city calculator canonical family in this phase (`/electricity-cost-calculator/[state]/[city]/[appliance]` remains deferred).

### Rollout gating structure

- **Centralized config:** `src/lib/longtail/rollout.ts`
  - `ACTIVE_APPLIANCE_CITY_PAGE_KEYS`
  - `APPLIANCE_CITY_ROLLOUT_LIMITS`
  - `getActiveApplianceCityPages()`
  - `isActiveApplianceCityPageKey()`
  - `getActiveApplianceCityPagesForStateAppliance()`
- **Hard caps:** separate caps by appliance count, city count, and total key count.
- **Pilot inventory (4 keys):**
  - `refrigerator/california/los-angeles`
  - `space-heater/texas/houston`
  - `window-ac/florida/miami`
  - `electric-vehicle-charger/california/san-diego`

### What was implemented in this prompt

- Added pilot canonical route: `/cost-to-run/[appliance]/[state]/[city]`.
- Added pilot static params from rollout keys only.
- Added pilot sitemap entries from rollout keys only.
- Added selective internal links from appliance state/calculator pages to pilot pages only when key-enabled.

### Deferred before broader rollout

- No broad appliance × city expansion beyond pilot key inventory.
- No appliance × city calculator family.
- No automatic cross-product generation from all active appliances × all active cities.
- Broader rollout requires updated caps, thin-page QA sampling, and sitemap diff review.

## G. Recommended Execution Order for Next 2–3 Items

1. **City Electricity Pages phase 1** (implemented) — rollout-gated authority family only
2. **City bill or city calculator family selection prompt** — choose one next, not both at once
3. **Appliance x City pages** — only after city methodology and rollout operations prove stable

## H. Recommended Next Step Type

**Implementation prompt.**

The next prompt should:

1. Define the exact list of new appliances to add
2. Add them to `APPLIANCE_CONFIGS` with deterministic assumptions
3. Add any new `ApplianceCategory` values if needed
4. Optionally update `FEATURED_APPLIANCE_SLUGS`
5. Run full verification (`knowledge:build`, `knowledge:verify`, `build`, `verify:vercel`)
6. Confirm sitemap expansion and page count increase

No planning, architecture, or content-system prompt is needed first.

## I. Flagged Items

- `public/08DavaQAAAABRveziBtz1RbxWbmQvnjNHRVdSMzExMDAuMTA3MDMzAEVkZ2U=.txt` — appears to be a Vercel/Edge deployment artifact. Not related to expansion work. Should be reviewed separately for `.gitignore` inclusion.

---

## Energy Comparison Hub (Implemented)

### Comparison system inventory summary

- **State vs state comparisons (canonical):** `/electricity-cost-comparison` and `/electricity-cost-comparison/[pair]`.
- **Legacy support comparisons (supporting/redirect family):** `/compare/*` remains legacy/supported behavior; canonical ownership stays in electricity-cost-comparison.
- **Usage-tier comparisons (canonical fixed-kWh intent):** `/electricity-usage-cost/[kwh]/[state]`.
- **Appliance operating-cost comparisons (canonical appliance intent):** `/cost-to-run/[appliance]/[state]`.
- **Appliance x city pilot comparisons (canonical pilot intent):** `/cost-to-run/[appliance]/[state]/[city]` for rollout-enabled pilot keys only.
- **City electricity context (canonical city authority intent):** `/electricity-cost/[state]/[city]`.
- **Calculator scenario comparisons (canonical calculator intent):** `/electricity-cost-calculator/*`.

### Energy Comparison Hub architecture

- **Primary hub route:** `/energy-comparison`.
- **Curated discovery slices:** `/energy-comparison/states`, `/energy-comparison/usage`, `/energy-comparison/appliances`.
- **Purpose:** discovery/navigation only; these routes orchestrate links to existing canonical systems.
- **Fan-out control:** no new dynamic route families and no new comparison dataset generation.

### Canonical ownership rules (for this phase)

- Canonical ownership remains unchanged for all existing comparison-capable systems.
- `energy-comparison` routes are curated supporting discovery pages and do not replace canonical compare or calculator families.
- Sitemap inclusion is limited to the four static hub routes above.

### Deferred by design

- No full dynamic `/energy-comparison/states/[pair]` family.
- No large appliance x city expansion beyond current rollout-gated pilot keys.
- No new comparison data pipeline or pair-universe generation logic.

---

## Electricity Bill Estimator Pages (Phase 1 Implemented)

### Canonical-intent review summary

- **`/average-electricity-bill/*` already covers:** fixed benchmark bill intent at 900 kWh for clean state-to-state comparability.
- **`/electricity-cost-calculator/*` already covers:** calculator/scenario intent for broader usage exploration and appliance pathways.
- **`/electricity-usage-cost/*` already covers:** fixed-kWh intent at explicit tier values.
- **Distinct estimator intent implemented:** household-profile bill-estimation scenarios (apartment/small-home/medium-home/large-home) with deterministic assumptions.

### Canonical decision and overlap policy

- **Primary estimator intent:** deterministic household-profile bill scenario discovery.
- **Canonical owner:** `/electricity-bill-estimator/*`.
- **Supporting overlap behavior:**
  - benchmark overlap resolves to `/average-electricity-bill/*`,
  - calculator overlap resolves to `/electricity-cost-calculator/*`,
  - fixed-kWh overlap resolves to `/electricity-usage-cost/*`.
- **Not a duplicate of average-bill:** estimator family uses profile-specific kWh assumptions, not a single benchmark usage.
- **Not a duplicate of calculator:** estimator family uses curated static profiles, not broad calculator workflows.

### Launch scope selected

- `/electricity-bill-estimator`
- `/electricity-bill-estimator/[state]`
- `/electricity-bill-estimator/[state]/[profile]` with a small fixed profile inventory.

### Profile inventory (deterministic)

- `apartment` — 650 kWh default (450-850 range)
- `small-home` — 900 kWh default (700-1,150 range)
- `medium-home` — 1,200 kWh default (950-1,500 range)
- `large-home` — 1,600 kWh default (1,300-2,100 range)

Central assumptions source: `src/lib/longtail/billEstimator.ts`.

### Rollout and fan-out safety

- Initial inventory is intentionally fixed to 4 profiles (no city estimator family).
- Static params are generated from existing 51-state inventory x 4 profiles.
- Sitemap includes only approved estimator scope routes; no additional estimator families are emitted.

### Deferred by design

- No `/electricity-bill-estimator/[state]/[city]` family.
- No city-profile estimator family.
- No dynamic profile expansion beyond the centralized profile config.

### Recommended next step

- Evaluate **city bill benchmark vs city calculator** family selection (choose one next, not both).

---

## Page Count Impact Estimate

Current: 12 appliances × 51 states = **612 pages** per route family × 3 families = **1,836 appliance pages total**

If 10 new appliances are added: 22 appliances × 51 = **1,122 pages** per family × 3 = **3,366 total** (+1,530 new pages)

If 15 new appliances are added: 27 appliances × 51 = **1,377 pages** per family × 3 = **4,131 total** (+2,295 new pages)

Build time impact should be monitored but is expected to remain manageable given the static generation architecture.
