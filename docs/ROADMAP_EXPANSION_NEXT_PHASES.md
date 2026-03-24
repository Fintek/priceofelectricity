# Roadmap Expansion — Next Phases (Internal Only)

**Status:** Internal planning document only  
**Audience:** Engineering, SEO, content systems, data pipeline  
**Do not publish:** This document must not be surfaced in `src/app`, sitemap generation, public knowledge assets, or any user-facing template.

## Scope and Guardrails

This roadmap captures candidate expansions after the current consumer clusters:

- `average-electricity-bill`
- `electricity-cost-calculator`
- `electricity-usage`
- `cost-to-run`
- `electricity-usage-cost`

All ideas below are planning inputs only. No routes, templates, or public assets are added by this document.

## Canonical Safeguards (Required For All Future Work)

Future families must preserve intent separation and avoid overlap with existing canonical systems:

- Keep appliance **cost intent** canonical in `cost-to-run/[appliance]/[state]`.
- Keep fixed-kWh **cost intent** canonical in `electricity-usage-cost/[kwh]/[state]`.
- Keep calculator **interactive/scenario intent** canonical in `electricity-cost-calculator/`*.
- Keep bill **benchmark intent** canonical in `average-electricity-bill/`*.

Before implementing any new family, document:

1. Primary search intent.
2. Canonical route owner.
3. Redirect/supporting-route behavior for overlapping URLs.

---

## 1) Appliance Cost Engine Expansion

### Purpose

Expand appliance coverage and scenario depth to capture additional consumer appliance-intent queries while reusing the current appliance cost model and calculator architecture.

### Example URL Structures

- Canonical extensions:
  - `/cost-to-run/[appliance]/[state]` (expanded appliance set)
  - `/electricity-cost-calculator/[state]/[appliance]` (expanded appliance set)
- Supporting/non-canonical options (only if needed later):
  - `/cost-to-run/[appliance]` (national summary, canonical strategy required)

### Estimated Page Families

- Family A: expanded appliance list x state (`N_appliances * 51`)
- Family B: calculator appliance pages x state (`N_appliances * 51`)

### Data Requirements / Assumptions

- Extend `src/lib/longtail/applianceConfig.ts` with deterministic assumptions.
- Maintain per-appliance wattage ranges, average wattage, runtime assumptions, and variability notes.
- No runtime AI generation; all content remains deterministic.

### SEO Rationale

- Increases long-tail coverage for "cost to run [appliance] in [state]".
- Strong internal linking between appliance usage, appliance cost, and calculator pages.

### Implementation Priority

- **Priority: High** (first expansion step)

### Rollout Status

- **Phase 1 complete:** 12 new appliances added (freezer, instant-pot, air-fryer, heat-pump, electric-blanket, pool-pump, hot-tub, iron, vacuum-cleaner, desktop-computer, electric-stove-top, garage-door-opener), bringing the total from 22 to 34. All use existing ISR route families and auto-propagate through sitemap, internal links, and discovery systems.

### Dependencies On Current Systems

- `LongtailStateTemplate`
- `calculatorCluster` helpers
- Internal link engine (`src/lib/longtail/internalLinks.ts`)
- Existing monetization/provider placement logic (optional insertion points only)

---

## 2) City Electricity Pages

### Purpose

Introduce city-level electricity cost context for high-intent local queries where state pages are too coarse.

### Example URL Structures

- `/electricity-cost/[state]/[city]`
- `/average-electricity-bill/[state]/[city]`
- `/electricity-cost-calculator/[state]/[city]` (only if distinct and non-duplicative)

### Estimated Page Families

- Family A: city authority pages (`N_cities`)
- Family B: city bill benchmarks (`N_cities`)
- Family C: city calculator context pages (optional; only if canonical-safe)

### Data Requirements / Assumptions

- City-level values may require **modeled estimates** initially unless direct city tariff/rate datasets are added later.
- Modeling inputs can begin with state baselines + utility/cost-of-living modifiers.
- Methodology and disclosure requirements must be finalized before launch.

### SEO Rationale

- Captures city-qualified searches ("electricity cost in [city]").
- Improves local relevance and internal linking depth from existing state hubs.

### Implementation Priority

- **Priority: High** (after appliance engine expansion)

### Rollout Status

- **Phase 1 complete:** expanded from 10 to 38 active city pages across 21 states. Added 18 new cities in 14 previously unrepresented states (AZ, NC, MI, WA, MA, CO, TN, MD, IN, MN, MO, NV, VA, WI) and activated 10 existing high-population cities (San Jose, San Francisco, Dallas, San Antonio, Jacksonville, Tampa, Orlando, Cleveland, Cincinnati, Pittsburgh). All use the existing `/electricity-cost/{state}/{city}` canonical family with ISR and deterministic modeling.
- **Reference rate upgrade (Phase 1):** 10 cities upgraded from `modeled-from-state` to `city-config-reference` with explicit `avgRateCentsPerKwh` values: Phoenix (14.6), Seattle (11.5), Boston (28.6), Denver (16.5), Detroit (21.3), Nashville (12.8), Baltimore (20.4), Indianapolis (16.9), Las Vegas (13.8), Milwaukee (18.8). Disclosure copy on city and appliance×city pages updated to be basis-aware.
- **Reference rate upgrade (Phase 2):** Added explicit configured city reference rates for the remaining 18 active city pages (San Jose, San Francisco, Dallas, San Antonio, Jacksonville, Tampa, Orlando, Cleveland, Cincinnati, Pittsburgh, Tucson, Charlotte, Raleigh, Memphis, Minneapolis, Kansas City, St. Louis, Virginia Beach). Active configured-reference coverage is now 38 of 38 cities, with 0 active cities on modeled fallback.
- **City authority expansion (Phase 2):** Expanded active city authority rollout from 38 to 50 pages (still across 21 states) by activating 12 additional high-population cities in existing represented states: Fresno, Sacramento, Fort Worth, El Paso, St. Petersburg, Hialeah, Buffalo, Aurora, Allentown, Toledo, Augusta, and Columbus (GA). All newly activated cities launched with configured `avgRateCentsPerKwh` values.

### Dependencies On Current Systems

- Existing `CITIES` routing surface and state/city page patterns
- Methodology/disclosure framework
- Canonical governance with state pages and bill/calculator clusters

---

## 3) Appliance × Location Pages

### Purpose

Extend appliance economics beyond state-level by combining appliance profiles with location granularity (state first, city second).

### Example URL Structures

- Appliance x state:
  - `/cost-to-run/[appliance]/[state]` (existing canonical family, expanded)
- Appliance x city (pilot-gated):
  - `/cost-to-run/[appliance]/[state]/[city]`
  - No calculator × city × appliance family during pilot phase (per canonical policy §A.5)

### Estimated Page Families

- Family A: appliance x state (`N_appliances * 51`) — live, ISR.
- Family B: appliance x city — pilot-gated, explicit allowlist only.

### Data Requirements / Assumptions

- Appliance assumptions reused from `applianceConfig`.
- City-level rate inputs use modeled estimates (population-based modifier from state baseline) or configured reference rates where available.
- Methodology disclosure is required on every appliance × city page.

### SEO Rationale

- Captures granular local appliance-intent searches.
- Builds strong contextual bridges across usage, bill, and calculator clusters.

### Implementation Priority

- **Priority: Medium-High** (state first, city later)

### Rollout Status

- **Pilot expansion (Phase 3):** 24/24 appliance × city keys active (see `ACTIVE_APPLIANCE_CITY_PAGE_KEYS` in `rollout.ts`).
- **Hard caps enforced:** maxAppliances=8, maxCities=24, maxKeys=24 (runtime assertion). Key and city caps raised in a controlled increment for the Phase 3 pass.
- **Sitemap:** pilot pages included at priority 0.52 via `getActiveApplianceCityPages()`.
- **Cross-linking:** parent appliance-state pages conditionally link to pilot city pages.
- **Phase 2 expansion:** Added 6 new keys using configured-reference cities across 6 new states (AZ, MA, CO, WA, NV, MD). maxCities cap raised from 8 to 16.
- **Pilot finalization (previous stage):** Added final 2 keys to reach 16/16 at that stage (hot-tub/michigan/detroit, refrigerator/wisconsin/milwaukee). All 16 keys used configured reference rates.
- **Phase 3 controlled expansion:** Added 8 keys (one per existing pilot appliance): refrigerator/north-carolina/charlotte, space-heater/minnesota/minneapolis, window-ac/texas/dallas, electric-vehicle-charger/illinois/chicago, heat-pump/pennsylvania/pittsburgh, pool-pump/florida/jacksonville, hot-tub/new-york/buffalo, central-ac/virginia/virginia-beach. All 24 pilot keys use configured reference rates.

### Appliance × City Expansion Policy

Before raising caps or adding keys beyond the current pilot:

1. **Build safety:** `npm run verify:vercel` must pass with no payload budget regression.
2. **Sitemap review:** diff the sitemap output before and after to confirm only intended URLs are added.
3. **Content quality:** each new key must have a city with either a configured reference rate or a population-based model that produces a meaningfully different estimate from the state baseline.
4. **Canonical safety:** no appliance × city × calculator family may be created during pilot phase. Calculator intent remains canonical at `/electricity-cost-calculator/{state}/{appliance}`.
5. **Thin content guard:** do not add keys where the city rate is identical to the state rate (no population modifier, no configured rate). These would produce duplicate content.
6. **Cap increases:** caps may only be raised in increments of 8 (keys) or 4 (appliances/cities), with full verification after each increase.

### Conditions for Full Appliance × City Launch

Full launch (removing the allowlist gate) requires:

1. City rate methodology is validated with real utility data for at least 5 cities.
2. Build payload remains within budget at projected full scale.
3. Canonical architecture policy is updated to reflect full-family status.
4. Sitemap segmentation is reviewed for the expanded URL volume.
5. Internal linking caps are reviewed to prevent link bloat.

### Dependencies On Current Systems

- Rollout config (`src/lib/longtail/rollout.ts`) for volume gating
- City electricity modeling (`src/lib/longtail/cityElectricity.ts`)
- Existing appliance cost/calc templates
- Internal linking + sitemap safeguards
- Canonical architecture policy §A.5

---

## 4) Electricity Bill Estimator Pages

### Purpose

Add estimator-style informational pages focused on monthly bill scenarios by household profile, while avoiding duplication with existing calculator and average bill systems.

### Example URL Structures

- `/electricity-bill-estimator`
- `/electricity-bill-estimator/[state]`
- `/electricity-bill-estimator/[state]/[profile]` (e.g., apartment, small-home, large-home)

### Estimated Page Families

- Family A: national estimator hub
- Family B: state estimator pages (51)
- Family C: state/profile scenarios (`51 * N_profiles`)

### Data Requirements / Assumptions

- Deterministic profile assumptions (kWh ranges and usage behavior).
- Reuse existing usage and bill helpers where possible.
- Explicit source attribution and scenario disclaimers required.

### SEO Rationale

- Targets "electric bill estimator" / "estimate my electric bill" intent not fully captured by static benchmark pages.
- Creates structured cross-linking to calculator and bill canonical pages.

### Implementation Priority

- **Priority: Medium**

### Rollout Status

- **Phase 1 implemented (safe scope A):** canonical estimator routes are live at `/electricity-bill-estimator` and `/electricity-bill-estimator/{state}`.
- **State-level deterministic rollout control:** estimator state pages use explicit `generateStaticParams()` and `dynamicParams = false`.
- **Deterministic profile assumptions retained (deferred surface):** 4 explicit profile slugs remain centralized in `src/lib/longtail/billEstimator.ts` but are not indexable route inventory in this phase.
- **Disclosure boundary enforced:** estimator pages remain scenario-based and explicitly separate from benchmark (`/average-electricity-bill/*`) and calculator (`/electricity-cost-calculator/*`) intent.
- **Phase 2 hardening (controlled deferment):** profile-route rollout is now explicit via `ACTIVE_BILL_ESTIMATOR_PROFILE_PAGE_KEYS` in `billEstimator.ts`, with profile static params and sitemap inclusion both keyed only to that allowlist.
- **Phase 2 link-safety fix:** city electricity pages now link to `/electricity-bill-estimator/{state}/{profile}` only when the profile key is rollout-enabled; otherwise they fall back to `/electricity-bill-estimator/{state}`.
- **Still deferred after Phase 2:** `/electricity-bill-estimator/{state}/{profile}` remains non-indexed by default (empty allowlist), and all city-level estimator route families remain deferred.
- **Phase 3 complete (controlled profile pilot after headroom recovery):**
  - Activated a very small explicit allowlist of 8 profile routes (all 4 profiles for California and Texas only).
  - Added hard rollout caps in `billEstimator.ts` (`maxStates=2`, `maxKeys=8`) to keep profile inventory bounded and reviewable.
  - Kept sitemap profile inclusion deterministic and allowlist-driven.
  - Updated indexing-readiness deferred-route leakage checks to enforce "allowlisted-only" profile sitemap behavior.
  - Maintained estimator state routes with payload-safe on-demand ISR behavior from headroom recovery.
- **Phase 4 complete (modest bounded allowlist step):**
  - Expanded the active allowlist from 8 to 12 profile routes by activating Florida profile pages (apartment, small-home, medium-home, large-home).
  - Increased explicit rollout caps in `billEstimator.ts` to `maxStates=3` and `maxKeys=12`.
  - Kept profile sitemap inclusion and profile static params strictly allowlist-driven.
  - Preserved existing allowlist-aware deferred-route leakage checks and discovery gating behavior.
- **Still deferred after Phase 4:** broad state × profile rollout and all city-estimator route families remain deferred.

### Dependencies On Current Systems

- `averageBill` and `usageIntelligence` helper layers
- Canonical policies to avoid duplicating calculator intent
- Existing longtail template and source attribution patterns

---

## 5) Energy Comparison Hub

### Purpose

Create a consolidated internal discovery framework for cross-system comparisons (state vs state, usage tiers, appliance scenarios, provider pathways).

### Example URL Structures

- `/energy-comparison` (hub)
- `/energy-comparison/states` (curated state-pair discovery slice)
- `/energy-comparison/usage` (curated fixed-kWh discovery slice)
- `/energy-comparison/appliances` (curated appliance discovery slice)

### Estimated Page Families

- Family A: central comparison hub
- Family B: curated comparison slices by type
- Family C: supporting routes that primarily orchestrate links to canonical pages

### Data Requirements / Assumptions

- Reuse existing comparison datasets and generated pair manifests.
- Avoid introducing duplicate data stores where existing knowledge outputs are sufficient.

### SEO Rationale

- Improves crawl pathways and discovery for existing canonical pages.
- Supports high-intent comparison queries with clearer taxonomy.

### Implementation Priority

- **Priority: Medium**

### Rollout Status

- **Phase 1 complete (discovery/orchestration):** static hub routes are live at `/energy-comparison`, `/energy-comparison/states`, `/energy-comparison/usage`, and `/energy-comparison/appliances`.
- **Canonical safety retained:** no new pair-family ownership, no dynamic comparison matrix, and no comparison dataset duplication.
- **Discovery hardening:** canonical pair pages and comparison slices explicitly cross-link to the hub while preserving canonical ownership in destination families.

### Dependencies On Current Systems

- `electricity-cost-comparison` pair system
- traffic hub components
- internal linking and rollout controls

---

## 6) Indexing Acceleration

### Purpose

Improve sitemap submission clarity, robots/sitemap alignment, indexing-readiness verification, and deferred-route leakage protection without any route growth.

### Rollout Status

- **Phase 1 complete (payload-safe / zero-growth pass):**
  - Removed `/compare/{pair}` redirect-only URLs from sitemap (canonical policy §A.2 alignment).
  - Fixed `www` → non-`www` in `SITEMAP_RESUBMISSION_RUNBOOK.md`.
  - Hardened `indexing-readiness.ts` with stricter robots check, sitemap segment completeness, and deferred-route leakage detection.
  - Payload stayed flat (39.97 MiB `.next/server/app`, 99.9% of budget).
- **External follow-through required:** GSC and Bing sitemap resubmission using non-www canonical origin.

### Current sitemap submission target

```
https://priceofelectricity.com/sitemap-index.xml
```

Segments: `core`, `states`, `cities`, `appliances`, `estimators`.

### In-repo indexing signals

- `robots.ts` → points to `/sitemap-index.xml` with canonical non-www origin
- `sitemap.ts` → segmented, rollout-gated, deduplication-guarded
- `indexing-readiness.ts` → robots/sitemap/canonical/discovery/leakage checks
- `readiness-audit.ts` → comprehensive production readiness audit
- `seo-check.ts` → HTML-level SEO validation
- `payload-audit.ts` → build size governance

### Dependencies On Current Systems

- Canonical architecture policy
- Rollout configuration
- Sitemap segmentation

---

## 7) Traffic Optimization

### Purpose

Improve internal traffic flow and cross-cluster discovery for already-live canonical families without expanding route inventory.

### Rollout Status

- **Phase 1 complete (payload-aware / near-zero-growth pass):**
  - Strengthened city authority page pathways into canonical comparison discovery.
  - Strengthened appliance × city pilot page pathways into estimator and comparison clusters.
  - Added a dedicated estimator-hub next-step pathway block into benchmark/calculator/comparison/appliance clusters.
  - Strengthened comparison pair pages with direct estimator and appliance next steps for both compared states.
- **Phase 2 complete (payload-aware navigation architecture refinement):**
  - Reorganized `/{state}` entry-page navigation into intent-grouped pathways (compare/benchmark, provider/shopping, utilities/history) with clearer next-step labels.
  - Added an intent chooser on `/energy-comparison` to reduce pathway ambiguity and route users to the right canonical comparison surface.
  - Added concise pathway-intent guidance on `/electricity-hubs` to improve broad-entry movement into state/scenario/comparison hubs.
  - Standardized shared longtail related-link section titles toward intent signaling in `internalLinks.ts`.
- **Phase 3 complete (controlled estimator-pilot pathway hardening):**
  - Added allowlist-aware helper accessors for state-level active estimator profile discovery in `billEstimator.ts`.
  - Added explicit "Live profile pilot pathways" routing on `/electricity-bill-estimator` using active profile keys only.
  - Added state-level "Active profile pilot routes" cues on `/electricity-bill-estimator/{state}` when allowlisted profile routes exist.
  - Added pair-page estimator next-step links that include profile pilot links only for states with active allowlisted profile routes.
  - Added a direct estimator entry cue in the intent-grouped `/{state}` pathway section.
- **No route growth:** no new route families, no inventory expansion, no canonical ownership changes.
- **Deferred remains deferred:** estimator profile inventory remains constrained beyond the active 8-key allowlist; appliance × city pilot cap unchanged.

### Dependencies On Current Systems

- Existing canonical families and discovery hubs
- Internal-linking surfaces on high-value entry pages
- Canonical architecture policy and rollout gating

---

## 8) Authority Scaling

### Purpose

Strengthen authority signals and trust framing for already-live canonical families (state cost, city context, estimator, comparison, and hub discovery) without route growth.

### Rollout Status

- **Phase 1 complete (payload-aware / near-zero-growth pass):**
  - Added concise authority-basis framing to state entry and state-cost canonical pages.
  - Reinforced estimator and comparison trust cues with deterministic-methodology language.
  - Added lightweight schema reinforcement on canonical comparison/state-cost surfaces.
  - Reinforced discovery-only trust boundary on electricity-hubs.
- **Phase 2 complete (controlled trust hardening on live scope):**
  - Strengthened estimator trust framing across hub/state/profile surfaces, including explicit pilot-scope boundary wording.
  - Tightened comparison-owner methodology framing on index and pair pages.
  - Reinforced discovery-boundary language on `/electricity-hubs` and `/energy-comparison`.
  - Kept rollout/inventory unchanged during this pass (completed before estimator Phase 4 expansion).
- **Phase 3 complete (explicit pilot-scope authority reinforcement):**
  - Added explicit estimator pilot-scope trust cues (`12` active profile keys across `3` active states) on estimator hub/state/profile surfaces.
  - Reinforced owner-vs-discovery boundaries on comparison and hub surfaces where estimator profile pathways are visible.
  - Preserved concise methodology framing and allowlist-only profile discovery language across canonical estimator-adjacent clusters.
- **No route growth:** no new route families, no inventory expansion, no canonical ownership changes.
- **Deferred remains deferred:** estimator profile inventory remains deferred beyond the active 12-key allowlist; appliance × city pilot cap unchanged.

### Dependencies On Current Systems

- Existing canonical families and discovery hubs
- Existing JSON-LD helper layer
- Canonical architecture policy and segmented sitemap controls

---

## 9) Payload Reduction / Headroom Recovery

### Purpose

Reclaim meaningful deployment artifact headroom before additional route-fanout or inventory growth.

### Rollout Status

- **Phase 1 complete (headroom recovery):**
  - Ran payload-contributor audit and identified `electricity-bill-estimator` static fan-out as the dominant low-risk contributor.
  - Applied a tightly scoped rendering-strategy correction on `/electricity-bill-estimator/[state]` to remove full static pre-generation fan-out while preserving deterministic ISR behavior.
  - Reclaimed substantial headroom:
    - `.next/server/app`: 40.00 MiB -> 30.43 MiB (`-9.57 MiB`)
    - `.next/standalone`: 74.27 MiB -> 64.66 MiB (`-9.61 MiB`)
- **No route growth:** no new route families, no inventory expansion, no canonical ownership changes.
- **Deferred remains deferred:** estimator profile routes remain allowlist-deferred; appliance × city pilot cap unchanged.

### Dependencies On Current Systems

- Existing payload governance script (`scripts/payload-audit.ts`)
- Existing canonical architecture and rollout gating
- Existing sitemap segmentation and verification suite

---

## Future Implementation Sequence (Concise)

1. Appliance Cost Engine expansion
2. City Electricity Pages
3. Appliance × State pages
4. Appliance × City pages
5. Energy Comparison Hub
6. Indexing Acceleration
7. Traffic Optimization
8. Authority Scaling
9. Payload Headroom Recovery (gating phase)

---

## Build Sequencing Recommendations

- Start each phase behind configuration gates before full sitemap exposure.
- Require a canonical map review before any new route family is enabled.
- Use staged rollout by page family and geography to control crawl and indexing volatility.
- Gate large fan-out families (especially appliance x city) with hard caps and QA thresholds.
- Require pre-launch checks: build, sitemap diff, redirect integrity, and 404 sampling.

