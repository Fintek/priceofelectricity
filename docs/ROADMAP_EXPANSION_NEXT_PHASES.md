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
- Keep calculator **interactive/scenario intent** canonical in `electricity-cost-calculator/*`.
- Keep bill **benchmark intent** canonical in `average-electricity-bill/*`.

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
- Appliance x city (future, if approved):
  - `/cost-to-run/[appliance]/[state]/[city]`
  - `/electricity-cost-calculator/[state]/[city]/[appliance]` (only if intent remains calculator-specific)

### Estimated Page Families

- Family A: appliance x state (`N_appliances * 51`) — primary near-term.
- Family B: appliance x city (`N_appliances * N_cities`) — large-scale, gated rollout required.

### Data Requirements / Assumptions

- Appliance assumptions reused from `applianceConfig`.
- City-level rate inputs likely modeled initially.
- Rollout controls required to cap page volume and avoid thin inventory.

### SEO Rationale

- Captures granular local appliance-intent searches.
- Builds strong contextual bridges across usage, bill, and calculator clusters.

### Implementation Priority

- **Priority: Medium-High** (state first, city later)

### Dependencies On Current Systems

- Rollout config (`src/lib/longtail/rollout.ts`) for volume gating
- Existing appliance cost/calc templates
- Internal linking + sitemap safeguards

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

