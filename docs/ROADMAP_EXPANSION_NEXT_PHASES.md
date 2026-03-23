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
- **Reference rate upgrade (Phase 1):** 10 cities upgraded from `modeled-from-state` to `city-config-reference` with explicit `avgRateCentsPerKwh` values: Phoenix (14.6), Seattle (11.5), Boston (28.6), Denver (16.5), Detroit (21.3), Nashville (12.8), Baltimore (20.4), Indianapolis (16.9), Las Vegas (13.8), Milwaukee (18.8). Total configured-reference cities: 20 of 38 active. Disclosure copy on city and appliance×city pages updated to be basis-aware.

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

- **Pilot complete:** 16/16 appliance × city keys active (see `ACTIVE_APPLIANCE_CITY_PAGE_KEYS` in `rollout.ts`).
- **Hard caps enforced:** maxAppliances=8, maxCities=16, maxKeys=16 (runtime assertion). All caps fully utilized.
- **Sitemap:** pilot pages included at priority 0.52 via `getActiveApplianceCityPages()`.
- **Cross-linking:** parent appliance-state pages conditionally link to pilot city pages.
- **Phase 2 expansion:** Added 6 new keys using configured-reference cities across 6 new states (AZ, MA, CO, WA, NV, MD). maxCities cap raised from 8 to 16.
- **Pilot finalization:** Added final 2 keys (hot-tub/michigan/detroit, refrigerator/wisconsin/milwaukee). All 16 pilot keys use configured reference rates. Each of the 8 pilot appliance types has exactly 2 geographically diverse keys across 15 cities in 13 states. Pilot is quality-complete and ready for production monitoring.

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
- `/energy-comparison/states/[pair]`
- `/energy-comparison/usage/[tier]`
- `/energy-comparison/appliances/[appliance]`

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

### Dependencies On Current Systems

- `electricity-cost-comparison` pair system
- traffic hub components
- internal linking and rollout controls

---

## Future Implementation Sequence (Concise)

1. Appliance Cost Engine expansion
2. City Electricity Pages
3. Appliance × State pages
4. Appliance × City pages
5. Energy Comparison Hub

---

## Build Sequencing Recommendations

- Start each phase behind configuration gates before full sitemap exposure.
- Require a canonical map review before any new route family is enabled.
- Use staged rollout by page family and geography to control crawl and indexing volatility.
- Gate large fan-out families (especially appliance x city) with hard caps and QA thresholds.
- Require pre-launch checks: build, sitemap diff, redirect integrity, and 404 sampling.

