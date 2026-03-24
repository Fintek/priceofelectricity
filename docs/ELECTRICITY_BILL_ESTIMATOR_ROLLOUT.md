# Electricity Bill Estimator Rollout

**Status:** Active  
**Scope:** Controlled rollout policy for `/electricity-bill-estimator/*`  
**Last updated:** 2026-03-16

## 1) Current canonical scope

- `/electricity-bill-estimator`
- `/electricity-bill-estimator/{state}`
- `/electricity-bill-estimator/{state}/{profile}` (allowlist-gated)

Canonical intent remains household-profile estimation and remains distinct from benchmark bill and calculator intent.

## 2) Phase 4 decision

Selected scope: **modest explicit allowlist expansion**.

Active profile keys:

- `california/apartment`
- `california/small-home`
- `california/medium-home`
- `california/large-home`
- `florida/apartment`
- `florida/small-home`
- `florida/medium-home`
- `florida/large-home`
- `texas/apartment`
- `texas/small-home`
- `texas/medium-home`
- `texas/large-home`

Active rollout totals:

- Active profile key count: `12`
- Active state count: `3` (`california`, `florida`, `texas`)

All other profile keys remain deferred.

## 3) Rollout controls

Centralized in `src/lib/longtail/billEstimator.ts`:

- `ACTIVE_BILL_ESTIMATOR_PROFILE_PAGE_KEYS`
- `BILL_ESTIMATOR_PROFILE_ROLLOUT_LIMITS`
  - `maxStates: 3`
  - `maxKeys: 12`
- `getActiveBillEstimatorProfilePages()`
- `getActiveBillEstimatorProfileStaticParams()`
- `isActiveBillEstimatorProfilePage()`

Sitemap inclusion remains deterministic and keyed only to the allowlist.

## 4) Authority framing status (Phase 3)

- Hub/state/profile estimator surfaces now consistently frame profile pages as rollout-gated supporting scenarios.
- Active pilot scope is explicitly disclosed as `12` keys across `3` states on estimator and related discovery/comparison surfaces.
- Comparison and hub pages reinforce owner-vs-discovery boundaries while routing into estimator canonical owners.
- Deferred profile inventory remains deferred beyond the active allowlist.

## 5) Guardrails for future expansion

- Do not activate broad state × profile inventory by default.
- Expand in small explicit increments only after:
  1. `npm run build`
  2. `npm run verify:vercel`
  3. `npm run payload:audit`
  4. sitemap diff and canonical safety review
- Keep profile rollout reviewable through explicit key lists and hard caps.

