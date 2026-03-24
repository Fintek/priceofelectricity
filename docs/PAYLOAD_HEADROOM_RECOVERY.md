# Payload Headroom Recovery

**Status:** Active  
**Scope:** Reclaim deployment artifact headroom before further inventory expansion  
**Last updated:** 2026-03-16

## 1) Purpose

Keep expansion velocity safe by recovering and preserving deploy-artifact margin under payload guardrails, especially `.next/server/app`.

## 2) Phase 1 (Implemented)

### Baseline

- `.next/server/app`: 40.00 MiB
- `.next/standalone`: 74.27 MiB

### Change applied

- Converted `src/app/electricity-bill-estimator/[slug]/page.tsx` from full static pre-generation to on-demand ISR-friendly rendering:
  - `dynamic = "force-static"` -> `dynamic = "auto"`
  - `dynamicParams = false` -> `dynamicParams = true`
  - removed state-level `generateStaticParams()` fan-out

### Result

- `.next/server/app`: 30.43 MiB (**-9.57 MiB reclaimed**)
- `.next/standalone`: 64.66 MiB (**-9.61 MiB reclaimed**)

Canonical ownership, sitemap structure, and deferred-route protections remain unchanged.

## 3) Operating guidance

- Treat payload headroom recovery as a gating phase before additional fan-out expansions.
- Avoid new full-static fan-out by default on large route families unless there is clear headroom.
- Prefer rollout-gated inventory and on-demand ISR rendering for large deterministic families.
- Require `npm run payload:audit` deltas in expansion PRs.

## 4) Deferred for later recovery phases

- Additional family-level rendering strategy review beyond estimator state pages.
- Deeper per-family payload attribution automation (if needed).
- Standalone tracing refinements beyond current excludes.

## 5) Post-recovery usage discipline

Recovered headroom can be used only for tightly bounded rollout increments.

- Example controlled use: Estimator Phase 3 activated 8 allowlisted profile keys with a modest payload increase.
- Follow-on controlled use: Estimator Phase 4 expanded to 12 allowlisted profile keys (3 states) with bounded payload impact.
- Expansion phases should continue to report before/after payload deltas and remaining headroom.
- If `.next/server/app` re-enters caution zone (>= 90%), run another headroom-recovery pass before additional fan-out.

