# Runtime Optimization Phase (Telemetry-Guided)

Date: 2026-03-16  
Scope: Runtime/server-path optimization only (no contract/SEO/routing changes)  
Status: Closed - diminishing returns reached

## Objective

Reduce sustained runtime cost (especially warm-path latency) for high-traffic server-rendered route and helper surfaces by:

- instrumenting first,
- ranking measured hotspots,
- optimizing one scoped target at a time,
- re-measuring after every change.

This phase explicitly excluded route-family expansion, behavior refactors, canonical/sitemap changes, and JSON contract changes.

## Baseline Entering This Phase

- Build/verification already stable:
  - `npm run knowledge:build`
  - `npm run knowledge:verify`
  - `npm run build`
- Runtime hotspots were unknown until telemetry was added.
- Primary runtime concern areas were:
  - knowledge route assembly (`knowledge/state/[slug]`, `knowledge/rankings/[id]`)
  - longtail helper composition fan-out (`stateLongtail`, `averageBill`, `billEstimator`)

## What Was Implemented (In Order)

### 1) Runtime telemetry baseline

Files:

- `src/lib/telemetry/runtime.ts`
- `src/lib/knowledge/loadKnowledgePage.ts`
- route-level emitters in:
  - `src/app/knowledge/state/[slug]/page.tsx`
  - `src/app/knowledge/rankings/[id]/page.tsx`
  - `src/app/api/v1/state/[slug]/route.ts`

Added telemetry surfaces:

- `route_runtime_profile`
- `knowledge_artifact_access`
- `longtail_data`

Design constraints:

- Feature-flagged (`RUNTIME_TELEMETRY=1`)
- Sampled (`RUNTIME_TELEMETRY_SAMPLE_RATE`)
- Structured logs only; no external telemetry dependency.

### 2) Composition/helper-layer optimization passes

Files:

- `src/lib/knowledge/fetch.ts`
- `src/lib/longtail/stateLongtail.ts`
- `src/lib/longtail/averageBill.ts`
- `src/lib/longtail/billEstimator.ts`

Key changes:

- Request-lifecycle memoization for shared knowledge fetchers.
- Module-scope memoization of repeated deterministic longtail operations:
  - static params derivation
  - state/national page load promises
  - normalized longtail state data
  - fan-out summaries (`averageBill`, `billEstimator`)

Measured effect:

- Warm-path helper calls moved to near-zero/very low milliseconds in repeated runs.
- High helper totals that remained were mostly cold/fan-out bursts, not sustained warm hot paths.

### 3) `stateLongtail` static params optimization

File:

- `src/lib/longtail/stateLongtail.ts`

Change:

- Memoized computed static params result for `getLongtailStateStaticParams`.

Measured effect:

- Warm-path static params collapsed to effectively negligible values.

### 4) `stateLongtail` core load-path optimization

File:

- `src/lib/longtail/stateLongtail.ts`

Change:

- Memoized normalized `loadLongtailStateData` computation per state.

Measured effect:

- Meaningful warm-path reduction in state loader and downstream single-state consumers.

### 5) `knowledge/state/[slug]` route assembly optimization

File:

- `src/app/knowledge/state/[slug]/page.tsx`

Change:

- Module-scope memoized shared secondary dataset bundle (entity index, offers/index config, glossary, release, related index, compare data) reused across renders.

Measured effect (representative):

- Warm avg dropped from ~9.47 ms to ~2.04 ms.
- Warm p50 dropped from ~8.64 ms to ~2.09 ms.

### 6) `knowledge/rankings/[id]` route assembly optimization

File:

- `src/app/knowledge/rankings/[id]/page.tsx`

Change:

- Module-scope memoized shared secondary dataset bundle (entity index, glossary, release, related index) reused across renders.

Measured effect (representative):

- Warm avg dropped from ~6.81 ms to ~1.60 ms.
- Warm p50 dropped from ~6.54 ms to ~1.35 ms.

## Final Telemetry Re-Rank (Post-Optimizations)

Latest final run highlights:

- `knowledge/state/[slug]`: warm avg ~2.46 ms
- `knowledge/rankings/[id]`: warm avg ~1.20 ms
- `api/v1/state/[slug]`: warm avg ~0.56 ms
- Helper surfaces warm path (`stateLongtail`, `averageBill`, `billEstimator`):
  - generally ~0.005 to ~0.07 ms range (very low)
- `knowledge_artifact_access` by route:
  - `knowledge/state/[slug]`: low single-digit ms totals
  - `knowledge/rankings/[id]`: sub-2 ms totals in p95
  - `unknown` bucket is mostly helper fan-out/cold activity, not sustained route warm path

## What Did NOT Change

Across all runtime optimization passes:

- No route structure changes
- No rendering mode changes
- No canonical behavior changes
- No sitemap behavior changes
- No JSON/public contract changes
- No new dependencies

This phase targeted runtime cost only and preserved output/SEO contracts.

## Diminishing-Returns Conclusion

Runtime optimization phase should stop here.

Rationale:

- Primary hotspots were reduced materially.
- Remaining warm-path costs are modest and distributed.
- Most residual high totals are cold/fan-out noise, not sustained warm bottlenecks.
- Additional optimization likely yields incremental gains with lower ROI than adjacent roadmap work.

## Recommended Next Phase

Recommended next phase: **deployment/payload governance and QA hardening**.

Why:

- Runtime path is now in a healthy state.
- Build/deploy artifact size governance, release discipline, and verification-hardening are likely higher-impact next.
- This continues recent stabilization work without reopening low-ROI micro-optimizations.

## Guardrails from This Phase

1. Instrument first; optimize second.  
2. Optimize one scoped target per pass.  
3. Preserve contracts (routing, canonical, sitemap, JSON shape).  
4. Re-rank after each pass; do not assume the next hotspot.  
5. Stop when gains become incremental and mostly cold-path/noise.

## Handoff Notes

- Runtime telemetry surfaces are in place and usable.
- Optimization chain and final stop decision are complete.
- Use `docs/source/runtime_optimization_handoff_prompt_108.md` for next-conversation context bootstrap.
