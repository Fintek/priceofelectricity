# Authority Scaling

**Status:** Active  
**Scope:** Authority/trust reinforcement for existing canonical families only  
**Last updated:** 2026-03-16

## 1) Goal

Improve authority and trust cues on already-live canonical pages and hubs without adding route inventory.

## 2) Phase 1 (Implemented)

Strengthened:

- state authority framing on `/{state}`
- canonical state-cost trust cues on `/electricity-cost/{state}`
- estimator-hub trust framing on `/electricity-bill-estimator`
- canonical comparison framing on `/electricity-cost-comparison` and `/electricity-cost-comparison/{pair}`
- discovery-only trust boundary on `/electricity-hubs`

Also added lightweight JSON-LD reinforcement on selected canonical surfaces.

## 3) Phase 2 (Implemented)

Strengthened:

- estimator-hub trust boundary language clarifying rollout-gated profile scope
- estimator-state trust note clarifying state-page canonical role and allowlisted profile linking
- estimator-profile pilot disclosure clarifying supporting-surface role vs state estimator ownership
- comparison index methodology consistency cue (deterministic 900 kWh baseline)
- comparison pair intent-separation cue (benchmark comparison vs calculator/estimator pathways)
- discovery-boundary language on `/electricity-hubs` and `/energy-comparison`

All changes were concise copy-level authority cues on existing live pages only.
No route-family, sitemap architecture, or inventory changes were introduced.

## 4) Phase 3 (Implemented)

Strengthened:

- estimator hub trust boundary with explicit active pilot scope (`12` keys across `3` states)
- estimator state-page rollout framing with family-wide pilot-scope disclosure
- estimator profile methodology disclosure with concise active-scope reinforcement
- comparison owner-page estimator boundary framing tied to explicit allowlist counts
- discovery-hub boundary cues (`/electricity-hubs`, `/energy-comparison`) with explicit estimator pilot limits

All changes remained concise copy-level trust hardening on already-live pages.
No route-family, inventory, sitemap, or canonical ownership changes were introduced.

## 5) Safety Rules

- No new route family.
- No canonical ownership change.
- No estimator profile activation.
- No city or appliance × city inventory expansion.
- No sitemap architecture redesign.
- Keep changes deterministic and payload-aware.

## 6) Deferred For Later Phases

- Broad copy rewrites and heavy template changes.
- New schema families beyond lightweight reinforcement.
- Any authority work that risks overlap with canonical ownership boundaries.

# Authority Scaling

**Status:** Active  
**Scope:** Topical authority reinforcement within existing canonical architecture  
**Last updated:** 2026-03-11

## 1) Canonical Cluster Audit

Primary canonical clusters reviewed:

- Electricity price by state (`/electricity-cost/*`, `/electricity-price-per-kwh/*`, `/electricity-price-trend/*`)
- City electricity cost (`/electricity-cost/[state]/[city]`)
- Appliance electricity cost (`/cost-to-run/[appliance]/[state]`, pilot city-qualified pages where rollout-enabled)
- Electricity bill estimator (`/electricity-bill-estimator/*`)
- Energy comparison (`/energy-comparison` discovery layer -> canonical comparison and cost families)
- Electricity hubs (`/electricity-hubs` discovery layer)

Findings:

- Cluster completeness remains strong and canonical-safe.
- Cross-cluster pathways are present and deterministic, with additional room for hub-level authority signaling.
- Hubs already drive major discovery, but authority signaling improves when clusters are explicitly enumerated in both content and JSON-LD.
- Requested labels like `/appliance-electricity-costs` and `/electricity-cost-by-state` are represented by existing canonical systems (`/cost-to-run/*` and `/electricity-cost/*`) per canonical policy.

## 2) Cluster Authority Reinforcement

Reinforcement goals:

- Keep hubs as crawl entry points that explicitly route to every major canonical cluster.
- Strengthen estimator <-> appliance and appliance -> comparison authority pathways.
- Preserve deterministic rollout gating and canonical ownership.

Implemented direction:

- Expanded hub-level cluster mapping on `/electricity-hubs`.
- Expanded authority-cluster mapping on `/energy-comparison`.
- Added shared-pathway reinforcement in longtail linking surfaces so state pages consistently connect cost, bill, estimator, appliance, and comparison clusters.

## 3) Authoritative Content Signals

Authority signals are reinforced by:

- clearer explanatory headings on hub pages
- explicit canonical-intent framing for discovery vs destination routes
- deterministic cluster-map sections that explain how users and crawlers should navigate topic depth

No canonical ownership changes were made.

## 4) Structured Data Reinforcement

Authority hubs now use shared JSON-LD helpers for:

- `WebPage`
- `BreadcrumbList`
- `FAQPage`
- `ItemList` (cluster map signals)

This keeps authority signaling template-level, deterministic, and schema-safe.

## 5) Discovery Graph Relationships

Discovery graph authority pathways now emphasize:

- state -> city -> appliance relationships
- state -> estimator and state -> appliance pathways
- estimator <-> appliance pathways
- appliance -> comparison and appliance -> usage pathways
- hub -> canonical cluster pathways from electricity hubs
- comparison hub pathways into bill and calculator clusters

All graph output remains deterministic and generated by `scripts/knowledge-build.ts`.

## 6) Verification Guardrails

Authority scaling verification remains lightweight and extends existing checks:

- hub pages must expose expected canonical-cluster links
- authority hubs must include structured-data reinforcement signals
- discovery graph must include authority pathway edges
- no route-family, canonical, or rollout-policy drift is introduced
