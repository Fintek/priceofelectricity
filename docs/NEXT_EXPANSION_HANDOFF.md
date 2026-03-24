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

### City Reference Rate Upgrade — Phase 2 (Implemented)

- **Active city inventory remains fixed:** 38 rollout-enabled city authority pages (`ACTIVE_CITY_PAGE_KEYS` unchanged).
- **Configured coverage:** 38 of 38 active cities now have explicit `avgRateCentsPerKwh` configured in `src/data/cities.ts`.
- **Modeled fallback inside active scope:** 0 of 38 active cities currently rely on `modeled-from-state`.
- **Appliance × city pilot integrity:** all 16 rollout-enabled pilot keys resolve through cities with configured reference rates.
- **Methodology/canonical safety:** no route-family expansion, no canonical ownership change, no sitemap architecture change.
- **Operational next step:** continue indexing/performance monitoring for the current city and appliance × city footprint before any broader city-family expansion.

### City Electricity Pages Expansion — Phase 2 (Implemented)

- **Prior live city authority count:** 38 (`ACTIVE_CITY_PAGE_KEYS`).
- **New live city authority count:** 50 (`+12` controlled activation increment).
- **Newly activated cities:** Fresno, Sacramento, Fort Worth, El Paso, St. Petersburg, Hialeah, Buffalo, Aurora, Allentown, Toledo, Augusta, Columbus (GA).
- **Configured coverage in active scope:** 50 of 50 active city pages now have configured `avgRateCentsPerKwh`.
- **Modeled fallback in active scope:** 0 active city pages rely on `modeled-from-state`.
- **Appliance × city pilot scope:** unchanged at 16 keys (16/16 still on configured city references).
- **Canonical/sitemap safety:** no route-family additions, no canonical ownership changes, no sitemap architecture changes.
- **Recommended next step:** keep appliance × city pilot scope fixed and continue post-expansion indexing/performance monitoring before any additional city or appliance × city fan-out.

### Appliance × City Pilot Expansion — Phase 3 (Implemented)

- **Prior pilot count:** 16 rollout-enabled keys.
- **New pilot count:** 24 rollout-enabled keys (`+8` controlled increment).
- **Updated caps:** `maxAppliances=8`, `maxCities=24`, `maxKeys=24`.
- **New keys added:** refrigerator/north-carolina/charlotte; space-heater/minnesota/minneapolis; window-ac/texas/dallas; electric-vehicle-charger/illinois/chicago; heat-pump/pennsylvania/pittsburgh; pool-pump/florida/jacksonville; hot-tub/new-york/buffalo; central-ac/virginia/virginia-beach.
- **Configured rate integrity:** 24 of 24 pilot keys now resolve through active cities with configured `avgRateCentsPerKwh`.
- **Canonical/sitemap safety:** no new route family, no canonical ownership change, and pilot inclusion remains rollout-helper-driven in static params and segmented sitemap generation.
- **Still deferred before broad rollout:** no full appliance × city cross-product generation and no appliance × city calculator family.

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
- Canonical pair routes (`/electricity-cost-comparison` and `/electricity-cost-comparison/[pair]`) now include explicit discovery bridges back to `/energy-comparison` and `/energy-comparison/states`.

### Phase 1 hardening notes

- Comparison-slice pages (`/energy-comparison/states`, `/energy-comparison/usage`, `/energy-comparison/appliances`) now include explicit "discovery-only" boundary copy.
- Slice pages now include cross-links to adjacent comparison slices to strengthen crawl pathways without introducing new route fan-out.

### Deferred by design

- No full dynamic `/energy-comparison/states/[pair]` family.
- No large appliance x city expansion beyond current rollout-gated pilot keys.
- No new comparison data pipeline or pair-universe generation logic.

---

## Electricity Bill Estimator Pages (Phase 2 Hardening Implemented)

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

### Profile inventory (deterministic)

- `apartment` — 650 kWh default (450-850 range)
- `small-home` — 900 kWh default (700-1,150 range)
- `medium-home` — 1,200 kWh default (950-1,500 range)
- `large-home` — 1,600 kWh default (1,300-2,100 range)

Central assumptions source: `src/lib/longtail/billEstimator.ts`.

### Rollout and fan-out safety

- Initial inventory is intentionally fixed to 4 profiles (no city estimator family).
- Static params are generated from the existing 51-state inventory for `/electricity-bill-estimator/[state]`.
- Route hardening applied on estimator dynamic segments:
  - `src/app/electricity-bill-estimator/[slug]/page.tsx` uses `generateStaticParams()` + `dynamicParams = false`.
  - `src/app/electricity-bill-estimator/[slug]/[profile]/page.tsx` now reads rollout-scoped static params from `getActiveBillEstimatorProfileStaticParams()`.
- Profile-route rollout keys are centralized in `src/lib/longtail/billEstimator.ts` as `ACTIVE_BILL_ESTIMATOR_PROFILE_PAGE_KEYS` (currently empty for controlled deferment).
- Sitemap profile inclusion is now allowlist-driven via `getActiveBillEstimatorProfilePages()`; with an empty allowlist, no profile URLs are emitted.
- City authority pages now avoid surfacing deferred estimator profile URLs by linking to state estimator routes when profile keys are not rollout-enabled.

### Deferred by design (current state)

- No broad `/electricity-bill-estimator/[state]/[profile]` live family; profile activation remains explicit-key only.
- No `/electricity-bill-estimator/[state]/[city]` family.
- No city-profile estimator family.
- No dynamic profile expansion beyond the centralized profile config.

### Recommended next step

- If payload headroom improves, activate a very small estimator profile allowlist (for example, 4-8 keys) and verify `payload:audit`, sitemap diff, and intent-separation checks before any further expansion.

---

## Indexing Acceleration Phase 1 (Payload-Safe / Zero-Growth Pass)

### Summary

This was an operational/indexing-focused pass with zero route growth. No new route files, families, inventories, or dependencies were introduced.

### Changes implemented

1. **Sitemap policy alignment:** removed `/compare/{pair}` redirect-only URLs from `sitemap.ts`. Per `CANONICAL_ARCHITECTURE_POLICY.md` §A.2, redirect-only routes must not appear in the sitemap. The canonical `/electricity-cost-comparison/{pair}` entries remain.
2. **Runbook `www` → non-`www` fix:** corrected `SITEMAP_RESUBMISSION_RUNBOOK.md` to use the canonical non-www origin (`https://priceofelectricity.com`) instead of `https://www.priceofelectricity.com`.
3. **Verification hardening:** improved `scripts/indexing-readiness.ts` with:
   - Stricter robots.txt check: verifies sitemap directive uses exact canonical origin (no `www`).
   - Sitemap segment completeness: verifies all 5 expected segments (core, states, cities, appliances, estimators) are referenced in the sitemap index.
   - Deferred-route leakage check: verifies no `/compare/{pair}` redirect URLs and no deferred estimator profile URLs appear in any sitemap segment.

### Payload impact

- `.next/server/app`: 39.97 MiB → 39.97 MiB (flat, 99.9% of budget)
- `.next/standalone`: 74.24 MiB → 74.23 MiB (-0.01 MiB)
- Zero growth confirmed.

### Deferred-route protection status

- Estimator profile routes: empty allowlist, 0 URLs in sitemap. Safe.
- Non-pilot appliance × city routes: gated by 24-key allowlist. Safe.
- Legacy `/compare/{pair}` redirect routes: removed from sitemap. Safe.
- Energy comparison hub: 4 static discovery routes, no canonical over-claim. Safe.

### External operational follow-through (post-deploy)

1. **Google Search Console:** resubmit `sitemap-index.xml` using the non-www canonical origin per the updated runbook.
2. **Bing Webmaster Tools:** resubmit `sitemap-index.xml` using the non-www canonical origin per the updated runbook.
3. **IndexNow:** optionally trigger via `POST /api/indexnow` with updated/high-priority URLs after deploy (requires `INDEXNOW_KEY` and `INDEXNOW_ENABLED=true`).
4. **Monitor:** check GSC/Bing for sitemap acceptance, URL discovery counts, and any crawl errors over 3-7 days post-submission.

### Recommended next step

- Continue with the next roadmap expansion step only after confirming indexing health post-deploy.

---

## Traffic Optimization Phase 1 (Implemented)

### Scope summary

This was a narrow traffic-flow optimization pass focused on internal navigation quality for already-live canonical families. No new routes, inventories, or dependencies were introduced.

### Pathways strengthened

- **City authority pages** now include explicit bridges to canonical state-comparison discovery (`/energy-comparison/states`) and the canonical comparison family index (`/electricity-cost-comparison`).
- **Appliance × city pilot pages** now include stronger next-step links into:
  - state estimator routes (`/electricity-bill-estimator/{state}`),
  - appliance comparison discovery (`/energy-comparison/appliances`),
  - canonical state comparison index (`/electricity-cost-comparison`).
- **Estimator hub page** now includes a dedicated "Next-step pathways" section linking users into benchmark, calculator, comparison, energy-comparison, and appliance clusters.
- **Comparison pair pages** now include direct state-specific pathways for:
  - estimator intent (`/electricity-bill-estimator/{state}`),
  - appliance operating-cost intent (`/cost-to-run/refrigerator/{state}`).

### Safety and constraints

- Canonical ownership remains unchanged.
- Estimator profile routes remain deferred; no profile-route links were activated in this pass.
- Appliance × city pilot scope remains unchanged at the current explicit cap.
- Sitemap architecture and route-family inventory remain unchanged.
- Changes are deterministic, static-first, and payload-aware.

### Recommended next step

- Proceed with the next roadmap step after monitoring traffic-pathway and indexing behavior post-deploy.

---

## Traffic Optimization Phase 2 (Implemented)

### Scope summary

This pass focused on navigation architecture refinement (grouping and pathway clarity) on existing high-value entry surfaces. No new routes, inventories, or dependencies were introduced.

### Friction points addressed

- **State entry page (`/{state}`):** replaced a crowded flat "More for {state}" block with intent-grouped pathways (compare/benchmark, provider/shopping, utilities/history) and clarified canonical next-step labels.
- **Energy Comparison Hub (`/energy-comparison`):** added an intent chooser block that routes users directly to the correct comparison section (state, usage, appliance, city, estimator/benchmark).
- **Electricity Hubs index (`/electricity-hubs`):** added concise "pathway-by-intent" guidance under the traffic engine explainer to improve movement into state/scenario/comparison hubs and the energy-comparison discovery layer.
- **Shared related-link helper (`internalLinks.ts`):** standardized section titles toward intent-signaling labels (state cost/bill, fixed-usage/calculator, state comparison, discovery/navigation) without route fan-out changes.

### Safety and constraints

- Canonical ownership remains unchanged across all families.
- Estimator profile routes remain deferred; no profile-route activation occurred.
- Appliance × city pilot inventory remains unchanged at the existing cap.
- Sitemap architecture and segmented generation remain unchanged.
- Changes are static-first, deterministic, crawl-safe, and payload-aware.

### Deferred for future traffic pass

- No additional route-family surfaces were expanded.
- No broad content/body rewrites were performed.
- No new link-heavy blocks were added to already dense non-target templates.

### Recommended next step

- Traffic Optimization is now sufficiently hardened for this cycle; proceed to the next roadmap step.

---

## Traffic Optimization Phase 3 (Implemented)

### Scope summary

This pass strengthened controlled discovery into the live estimator profile pilot and tightened estimator-related next-step pathways on already-live canonical pages. No route families, inventory caps, or ownership boundaries changed.

### Changes implemented

- **Estimator rollout helper layer (`billEstimator.ts`):**
  - Added helper accessors for state-level active profile discovery:
    - `getActiveBillEstimatorProfilesForState()`
    - `getFirstActiveBillEstimatorProfileForState()`
- **Estimator hub (`/electricity-bill-estimator`):**
  - Added a compact "Live profile pilot pathways" section that links only to explicitly allowlisted profile pages.
- **Estimator state pages (`/electricity-bill-estimator/{state}`):**
  - Added an "Active profile pilot routes" cue above the scenario table for states with rollout-enabled profile pages.
- **Comparison pair pages (`/electricity-cost-comparison/{pair}`):**
  - Kept state-level estimator next steps and conditionally added profile-route links only when a compared state has an active allowlisted profile page.
- **State entry pages (`/{state}`):**
  - Added a direct estimator pathway link in the intent-grouped compare/benchmark navigation block.

### Safety and constraints

- No new route-family or expansion-family introduced.
- No city inventory expansion and no appliance × city inventory expansion.
- No estimator profile rollout expansion beyond the existing 8-key allowlist.
- No sitemap architecture or canonical ownership changes.
- Deferred estimator profile inventory remains deferred beyond the current explicit allowlist.
- Changes remain deterministic and lightweight (link/copy/helper-level only).

### Recommended next step

- Traffic Optimization Phase 3 complete — proceed to the next roadmap step.

---

## Authority Scaling Phase 1 (Implemented)

### Scope summary

This pass strengthened trust and authority framing for already-live canonical families without adding new routes, inventory, or dependencies.

### Authority signals strengthened

- **State electricity cost canonical pages (`/electricity-cost/{state}`):**
  - Added explicit authority-basis copy and lightweight dataset JSON-LD reinforcement tied to deterministic state-rate inputs.
- **State authority entry pages (`/{state}`):**
  - Added concise authority-basis cue linking dataset references and machine-readable state knowledge context.
- **Estimator hub (`/electricity-bill-estimator`):**
  - Added concise trust block clarifying deterministic assumptions, canonical estimator scope, and shared dataset basis.
- **Comparison index and pair pages (`/electricity-cost-comparison`, `/electricity-cost-comparison/{pair}`):**
  - Added concise canonical-authority framing and deterministic-methodology trust cues.
  - Added WebPage JSON-LD reinforcement on the comparison index page.
- **Electricity hubs discovery index (`/electricity-hubs`):**
  - Added explicit discovery-only trust boundary copy to reinforce non-ownership of canonical intent.

### Safety and constraints

- Canonical ownership remained unchanged across all families.
- No route-family expansion, no inventory growth, and no deferred-route activation.
- Energy comparison and electricity hubs remained discovery/orchestration surfaces.
- Sitemap architecture remained segmented and deterministic.

### Deferred for later authority phases

- No broad content rewrites or heavy template expansion.
- No new schema types beyond lightweight reinforcement on existing canonical pages.
- No estimator profile activation and no appliance × city pilot expansion.

### Recommended next step

- Authority Scaling Phase 1 is complete; proceed to the next roadmap step.

---

## Payload Reduction / Headroom Recovery Phase 1 (Implemented)

### Scope summary

This pass reclaimed operating margin under payload guardrails without route growth, canonical changes, or inventory expansion.

### Baseline contributor audit

- Baseline payload posture before changes:
  - `.next/server/app`: 40.00 MiB (100.0% of budget)
  - `.next/standalone`: 74.27 MiB
- Dominant contributor identified: `electricity-bill-estimator` static output fan-out (`~9.75 MiB` under `.next/server/app`).
- Root cause classification:
  - **Primary:** static fan-out/page-count artifact generation (not canonical or sitemap growth).
  - **Secondary:** duplicated per-state serialized output in pre-generated estimator pages.

### Change implemented

- Converted `/electricity-bill-estimator/[state]` from full static pre-generation to on-demand deterministic ISR behavior:
  - removed state-level `generateStaticParams()`
  - switched from `dynamic = "force-static"` to `dynamic = "auto"`
  - switched `dynamicParams` from `false` to `true`

No inventory, sitemap, or canonical routing changes were introduced.

### Final payload posture

- `.next/server/app`: 30.43 MiB (**-9.57 MiB reclaimed**)
- `.next/standalone`: 64.66 MiB (**-9.61 MiB reclaimed**)
- `public/knowledge`: unchanged in budget posture

### Safety and constraints

- Canonical ownership unchanged.
- Sitemap architecture unchanged.
- Estimator profile routes remain deferred by allowlist.
- Energy comparison and hub discovery roles unchanged.
- Verification suite remains passing.

### Recommended next step

- Payload headroom has been recovered for this cycle; proceed to the next roadmap step with payload guard discipline intact.

---

## Electricity Bill Estimator Pages Phase 3 (Implemented)

### Decision

Selected rollout option: **B — very small explicit pilot allowlist of profile routes**.

### Why this was selected

- Payload headroom recovered in the prior phase was sufficient for a small controlled increment.
- A broad profile launch remained unnecessary and riskier for inventory and overlap management.
- An explicit allowlist keeps activation reviewable and reversible.

### Scope implemented

- Activated 8 profile keys in `ACTIVE_BILL_ESTIMATOR_PROFILE_PAGE_KEYS`:
  - California: apartment, small-home, medium-home, large-home
  - Texas: apartment, small-home, medium-home, large-home
- Added hard profile rollout limits in `billEstimator.ts`:
  - `maxStates = 2`
  - `maxKeys = 8`
- Kept profile static params and sitemap inclusion allowlist-driven.
- Updated estimator state page profile table to link only rollout-enabled profile pages; deferred profiles remain visibly labeled as rollout-deferred.
- Updated indexing-readiness deferred-route leakage checks to enforce allowlisted-only profile URLs in sitemap output.

### Payload impact

- Baseline before this phase:
  - `.next/server/app`: 30.43 MiB
  - `.next/standalone`: 64.66 MiB
- Final after this phase:
  - `.next/server/app`: 31.52 MiB
  - `.next/standalone`: 65.77 MiB
- Delta consumed:
  - `.next/server/app`: +1.09 MiB
  - `.next/standalone`: +1.11 MiB

### Safety status

- No route family additions.
- Canonical ownership unchanged.
- Sitemap architecture unchanged (still segmented and deterministic).
- Deferred remains deferred beyond selected pilot keys.
- Verification suite and payload audit remained passing.

### Recommended next step

- Keep estimator profile rollout constrained at the current pilot until another payload and indexing review justifies expansion.

---

## Electricity Bill Estimator Pages Phase 4 (Implemented)

### Decision

Selected rollout option: **B — modest bounded allowlist expansion**.

### Why this was selected

- Current payload posture remained in the preferred operating zone with meaningful headroom.
- Active profile scope was still a very small share of possible inventory (8 of 204 profile pages).
- A one-state increment preserves strict control while improving live-profile discovery utility.

### Scope implemented

- Expanded active profile keys from 8 to 12 by adding Florida:
  - Florida: apartment, small-home, medium-home, large-home
- Updated hard profile rollout limits in `billEstimator.ts`:
  - `maxStates = 3`
  - `maxKeys = 12`
- Kept profile static params and sitemap inclusion allowlist-driven.
- Kept indexing-readiness allowlist leakage protections unchanged and active.

### Safety status

- No route-family additions.
- Canonical ownership unchanged.
- Sitemap architecture unchanged (segmented and deterministic).
- Deferred remains deferred beyond selected allowlist keys.
- Broad state × profile and city-estimator families remain deferred.

### Recommended next step

- Electricity Bill Estimator Pages Phase 4 complete — proceed to the next roadmap step.

---

## Authority Scaling Phase 2 (Implemented)

### Scope summary

This pass strengthened trust and authority clarity on already-live canonical surfaces, including the estimator profile pilot, without changing route inventory or ownership.

### Changes implemented

- **Estimator hub (`/electricity-bill-estimator`):**
  - Added explicit trust-boundary framing that profile routes are rollout-gated supporting surfaces while hub/state pages remain canonical estimator discovery owners.
- **Estimator state pages (`/electricity-bill-estimator/{state}`):**
  - Added a concise rollout note clarifying canonical state-page role and explicit allowlisted profile-link behavior.
- **Estimator profile pilot pages (`/electricity-bill-estimator/{state}/{profile}`):**
  - Added concise pilot-scope disclosure clarifying supporting-surface role vs state-estimator entry ownership.
- **Comparison owner pages (`/electricity-cost-comparison`, `/electricity-cost-comparison/{pair}`):**
  - Added concise deterministic-methodology/intent-separation trust cues.
- **Discovery hubs (`/electricity-hubs`, `/energy-comparison`):**
  - Added discovery-boundary language reinforcing orchestration-only role and destination-family canonical ownership.

### Safety status

- No route-family additions.
- No city/appliance inventory changes.
- No estimator rollout expansion beyond current 8 allowlisted profile keys.
- No sitemap architecture changes.
- Canonical ownership unchanged.
- Changes remain copy/schema-level and payload-aware.

### Recommended next step

- Authority Scaling Phase 2 is complete; proceed to the next roadmap step.

---

## Authority Scaling Phase 3 (Implemented)

### Scope summary

This pass reinforced estimator-family trust and owner-boundary clarity after the Phase 4 rollout expansion, without changing route inventory, rollout keys, or canonical ownership.

### Changes implemented

- **Estimator hub (`/electricity-bill-estimator`):**
  - Upgraded trust-boundary language from generic pilot wording to explicit active scope (`12` profile keys across `3` states).
- **Estimator state pages (`/electricity-bill-estimator/{state}`):**
  - Added family-level pilot-scope disclosure alongside per-state allowlist notes.
- **Estimator profile pilot pages (`/electricity-bill-estimator/{state}/{profile}`):**
  - Extended methodology disclosure with concise active pilot-scope reinforcement while preserving supporting-surface framing.
- **Comparison owner pages (`/electricity-cost-comparison`, `/electricity-cost-comparison/{pair}`):**
  - Added allowlist-count trust cues clarifying that profile pathways remain bounded and route into estimator canonical owners.
- **Discovery hubs (`/electricity-hubs`, `/energy-comparison`):**
  - Added concise estimator-pilot boundary language to preserve owner-vs-discovery clarity.
- **Rollout helper surface (`billEstimator.ts`):**
  - Added centralized active-scope summary helper for deterministic, consistent pilot-count framing across templates.

### Safety status

- No route-family additions.
- No city/appliance/estimator inventory expansion.
- No sitemap architecture changes.
- Canonical ownership unchanged.
- Deferred remains deferred beyond the active 12-key estimator profile allowlist.
- Changes remain text-level trust framing and helper-level consistency with very low payload risk.

### Recommended next step

- Authority Scaling Phase 3 complete — proceed to the next roadmap step.

---

## Page Count Impact Estimate

Current: 12 appliances × 51 states = **612 pages** per route family × 3 families = **1,836 appliance pages total**

If 10 new appliances are added: 22 appliances × 51 = **1,122 pages** per family × 3 = **3,366 total** (+1,530 new pages)

If 15 new appliances are added: 27 appliances × 51 = **1,377 pages** per family × 3 = **4,131 total** (+2,295 new pages)

Build time impact should be monitored but is expected to remain manageable given the static generation architecture.
