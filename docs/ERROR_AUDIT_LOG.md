# Structural Error Audit Log (Internal)

Date: 2026-03-11  
Scope: Full-site structural audit (build, routing, sitemap, canonical, metadata, internal linking, deterministic behavior)  
Mode: Static-first, deterministic, no architecture redesign

## Architecture Summary

### Deterministic architecture (intended and protected)

- **Static-first rendering:** broad use of `dynamic = "force-static"` and `generateStaticParams()` for route families.
- **Build pipeline determinism:** `build` runs `release:gen`, `knowledge:build`, `knowledge:verify`, then Next build.
- **Knowledge/data contract:** `scripts/verify-knowledge.js` enforces schema, route-family backing, sitemap coverage, and integrity.
- **Sitemap centralization:** `src/app/sitemap.ts` is the single sitemap generation surface for sitewide URLs.
- **Robots centralization:** `src/app/robots.ts` controls crawl policy and sitemap declaration.
- **Discovery/registry system:** `/site-map`, `/page-index`, `/discovery-graph`, `/entity-registry`, `/electricity-data`, `/knowledge` act as crawl/discovery hubs.
- **Canonical routing strategy:** legacy/support routes (e.g., `/compare/*`, `/calculator`, `/how-much-does-*`) redirect or canonicalize into primary intent routes.

### Route families observed in active architecture

- Core state families: `/{state}`, `/{state}/bill/{kwh}`, `/{state}/plans`, `/{state}/utilities`, etc.
- Consumer clusters: `average-electricity-bill/*`, `electricity-cost-calculator/*`, `electricity-usage/*`, `cost-to-run/*`, `electricity-usage-cost/*`.
- Comparison families: `/compare/*` (legacy redirect), `/electricity-cost-comparison/*` (canonical).
- Knowledge families: `/knowledge/*` plus machine-readable `public/knowledge/*`.

### Existing verification/audit systems

- `knowledge:verify`
- `canonical:check`
- `smoke`
- `integrity`
- `api:contract`
- `indexing:check`
- `readiness:audit`
- `seo:check`
- aggregate `verify:vercel`

## Structural Scan Results

### Commands run

1. `npm run knowledge:build` — PASS  
2. `npm run knowledge:verify` — PASS  
3. `npm run build` — PASS  
4. `npm run verify:vercel` — PASS (with lint warnings only)  
5. Runtime sitemap compare validation:
   - `compare_urls_in_sitemap=20`
   - `invalid_compare_urls=0`

## Audit Summary By Severity

- **critical:** 0
- **high:** 2
- **medium:** 5
- **low:** 3

## Audit Summary By Category

- **build:** 1
- **routing:** 1
- **sitemap:** 1
- **canonical:** 1
- **metadata:** 1
- **internal-linking:** 1
- **data:** 1
- **content-integrity:** 1
- **deterministic-risk:** 2

## Issue Inventory (Top 10)

### E-001 — High — metadata — sitewide
- **Description:** `public/knowledge/search-index.json` emits `canonicalUrl` values pointing to `http://localhost:3000`.
- **Observed behavior:** machine-readable entities contain local canonical URLs.
- **Expected behavior:** canonical URLs should consistently use production site origin.
- **Probable root cause:** `knowledge:build` origin selection depends on env/base-url fallback.
- **Deterministic risk:** High (environment-dependent output shape).

### E-002 — Medium — deterministic-risk — sitewide
- **Description:** `src/app/sitemap.ts` sets `lastModified` for most entries using `new Date()`.
- **Observed behavior:** repeated sitemap churn across builds even without content changes.
- **Expected behavior:** stable `lastModified` where underlying data/content unchanged.
- **Probable root cause:** convenience timestamping instead of source-derived timestamps.
- **Deterministic risk:** Medium.

### E-003 — Medium — build — build-system
- **Description:** `verify:vercel` reports 5 lint warnings.
- **Observed behavior:** warnings from unused constants/values in longtail/sitemap/internal-links files.
- **Expected behavior:** warning-free baseline for CI signal clarity.
- **Probable root cause:** stale constants after rollout evolution.
- **Deterministic risk:** Low-to-medium (warning noise masks new regressions).

### E-004 — Medium — routing — route-family
- **Description:** Legacy `/compare/[pair]` route depends on strict static pair generation set and redirects to canonical pair routes.
- **Observed behavior:** legacy compare set must stay synchronized with sitemap and knowledge compare data.
- **Expected behavior:** one source of truth for pair eligibility.
- **Probable root cause:** dual-system pair derivation (legacy static + knowledge data).
- **Deterministic risk:** Medium.

### E-005 — Medium — sitemap — route-family
- **Description:** Compare sitemap eligibility currently computed in `sitemap.ts` using pair-set intersection logic.
- **Observed behavior:** correctness is achieved, but logic duplication exists with route generation.
- **Expected behavior:** shared helper/source for pair eligibility.
- **Probable root cause:** incremental fixes in sitemap layer.
- **Deterministic risk:** Medium.

### E-006 — High — canonical — sitewide
- **Description:** Canonical strategy spans both legacy and canonical families with redirects and metadata fallback behavior.
- **Observed behavior:** stable now, but sensitive to divergence between redirect families and canonical family generation.
- **Expected behavior:** enforced, centralized intent/canonical map.
- **Probable root cause:** historical layering of legacy and canonical pathways.
- **Deterministic risk:** High for future regressions.

### E-007 — Low — internal-linking — sitewide
- **Description:** Discovery pages include large manually curated link lists.
- **Observed behavior:** link integrity currently passes, but manual curation can drift from route reality.
- **Expected behavior:** either generated link registries or stricter checks for curated blocks.
- **Probable root cause:** manually maintained discovery navigation sections.
- **Deterministic risk:** Low.

### E-008 — Low — content-integrity — single-page
- **Description:** `discovery-graph` page presents graph as relationship map while `public/discovery-graph.json` is lightweight/curated.
- **Observed behavior:** perceived coverage may exceed underlying graph completeness.
- **Expected behavior:** explicit scope language for graph completeness.
- **Probable root cause:** intentional lightweight graph not clearly framed as partial.
- **Deterministic risk:** Low.

### E-009 — Medium — data — build-system
- **Description:** Machine-readable discovery assets and knowledge assets are regenerated frequently and produce large diffs.
- **Observed behavior:** very large commit churn across generated outputs.
- **Expected behavior:** predictable, reviewable generated changes tied to source/data diffs.
- **Probable root cause:** broad regeneration scope and timestamp/hash updates.
- **Deterministic risk:** Medium.

### E-010 — Low — deterministic-risk — sitewide
- **Description:** Third-party script loaded in layout head (`plausible`).
- **Observed behavior:** external dependency at runtime for all pages.
- **Expected behavior:** controlled via explicit environment or documented runtime policy.
- **Probable root cause:** global analytics include without environment gating.
- **Deterministic risk:** Low for build determinism, moderate for runtime variance.

## Remediation Strategy

### Bucket A: Safe guardrail fixes

- Remove stale unused constants to eliminate lint warning noise.
- Add explicit docs note that `discovery-graph.json` is a curated relationship subset.
- Add verification note/check to assert production canonical base URL for generated search-index entities.

### Bucket B: Deterministic patch candidates

- Replace broad `new Date()` sitemap timestamps with source-derived or stable timestamps.
- Centralize compare-pair eligibility helper used by both legacy compare route and sitemap generation.
- Add deterministic diff-oriented checks for regenerated public knowledge outputs.

### Bucket C: Architecture-sensitive issues requiring approval

- Canonical ownership consolidation across legacy support families vs canonical families.
- Search-index canonical URL origin policy (strict env requirements vs generated default behavior).
- Strategy decision: continue dual legacy compare surface or deprecate with stricter controls.

### Bucket D: Monitoring-only / not worth changing now

- Keep current discovery manual links but monitor via existing broken-link scan.
- Keep global analytics include as-is unless policy/performance requirements change.

## Recommended Repair Execution Order

1. Apply Bucket A guardrails (small, safe, low-impact).
2. Execute Bucket B deterministic patches in one controlled pass (with full verify).
3. Pause for approval on Bucket C architecture-sensitive changes.
4. Continue Bucket D as monitored baseline.

## Verification Log

- `knowledge:build`: PASS
- `knowledge:verify`: PASS
- `build`: PASS
- `verify:vercel`: PASS (lint warnings only)
- Runtime compare-sitemap validation: PASS (`invalid_compare_urls=0`)

## Deterministic Repair Pass Status (Post-Policy)

### E-002 — `resolved`

- `src/app/sitemap.ts` now preserves `lastModified` only for routes with stable, source-backed state timestamps.
- Broad build-time `new Date()`-driven timestamps are no longer emitted in sitemap output, reducing deterministic churn.
- Invalid state timestamp parsing now omits `lastModified` instead of falling back to a volatile current timestamp.

### E-003 — `resolved`

- Removed known low-risk unused symbols that created warning noise:
  - `src/app/sitemap.ts` (stale constants)
  - `src/lib/longtail/internalLinks.ts` (unused imports)
  - `src/app/electricity-usage-cost/[kwh]/[state]/page.tsx` (unused import)
- This improves lint signal quality during `verify:vercel` without changing runtime behavior.

### E-008 — `resolved`

- Updated `src/app/discovery-graph/page.tsx` copy to explicitly describe the graph as **curated/lightweight/representative**, not exhaustive.
- No route, schema, or rendering architecture changes were made.

### E-009 — `partially resolved`

- Added lightweight generated-output reporting in `scripts/knowledge-build.ts`:
  - total generated JSON write count
  - grouped output counts by path prefix
- This improves reviewability of large generated diffs and makes churn scope easier to audit.
- Added deterministic timestamp policy in `scripts/knowledge-build.ts` so knowledge `generatedAt` is snapshot-derived instead of build-time-now, reducing avoidable cross-file churn for unchanged data snapshots.
- Added verification guardrail in `scripts/verify-knowledge.js` to enforce deterministic generated timestamp policy via `knowledge/index.json`.
- Large generated artifacts are still expected when snapshot/data version changes because the pipeline intentionally regenerates full knowledge outputs.

### E-009 Root-Cause Analysis (Generated Output Churn)

Primary causes by output group:

1. **`public/knowledge/**`**
   - **Real broad scope behavior:** script writes a full knowledge set on each run (expected for current architecture).
   - **Former avoidable churn:** build-time `generatedAt` propagated across many artifacts even when data snapshot was unchanged.
   - **Current status:** deterministic snapshot-derived `generatedAt` guardrail applied; broad churn now primarily tracks actual snapshot/content changes.

2. **`public/discovery-graph.json` and `public/graph.json`**
   - Generated as part of the same broad knowledge build scope.
   - Churn mostly follows upstream knowledge graph/model regeneration.
   - Ordering appears deterministic (no unstable ordering issue identified in this pass).

3. **`public/datasets/*`**
   - Deterministic export formatting and stable ordering already in place.
   - Changes are typically source-data driven.

4. **`public/release.json`**
   - Intentionally volatile (`builtAt`, commit metadata) from `scripts/release-generate.ts`.
   - This volatility is expected and should be reviewed separately from knowledge content diffs.

Findings across suspected churn types:

- **Unstable ordering:** not observed as a major driver in reviewed generation paths.
- **Timestamp injection:** confirmed as a major historical contributor (now reduced for knowledge artifacts).
- **Build-profile metadata churn:** still expected in `public/knowledge/build-profile.json` due duration metrics.
- **Environment-sensitive output:** canonical-origin sensitivity already addressed in previous policy hardening.
- **Non-centralized write logic:** not observed for main generated knowledge outputs (centralized in `knowledge-build.ts`).
- **Overly broad generation scope:** true by design; retained for correctness and contract consistency.

