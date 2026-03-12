# Canonical Architecture Policy

**Status:** Active policy document  
**Audience:** Engineering, SEO, build systems, future repair prompts  
**Effective:** 2026-03-11  
**Last reviewed:** 2026-03-11

This document defines the canonical ownership, canonical origin, compare-route, and deterministic protection rules for the PriceOfElectricity.com repository. All future repair prompts, expansion work, and route changes must comply with these rules.

---

## A. Canonical Ownership Rules

### 1. Primary canonical route families

Each search intent has exactly one canonical route family that owns indexable status:

| Intent | Canonical route family | Sitemap inclusion |
|---|---|---|
| State electricity overview | `/{state}` | Yes |
| State electricity cost | `/electricity-cost/{state}` | Yes |
| City electricity cost context | `/electricity-cost/{state}/{city}` | Yes (rollout-gated) |
| Average electricity bill | `/average-electricity-bill/{state}` | Yes |
| Electricity bill estimator | `/electricity-bill-estimator/{state}` and `/electricity-bill-estimator/{state}/{profile}` | Yes |
| Electricity cost calculator | `/electricity-cost-calculator/{state}` | Yes |
| Appliance calculator | `/electricity-cost-calculator/{state}/{appliance}` | Yes |
| Fixed-kWh cost | `/electricity-usage-cost/{kwh}/{state}` | Yes |
| Appliance cost | `/cost-to-run/{appliance}/{state}` | Yes |
| Appliance cost (city-qualified, pilot-gated) | `/cost-to-run/{appliance}/{state}/{city}` | Yes (rollout-gated pilot only) |
| Electricity usage | `/electricity-usage/{state}` | Yes |
| State price per kWh | `/electricity-price-per-kwh/{state}` | Yes (rollout-gated) |
| State price trend | `/electricity-price-trend/{state}` | Yes (rollout-gated) |
| Industry cost | `/industry-electricity-cost/{industry}/{state}` | Yes (rollout-gated) |
| State-to-state comparison | `/electricity-cost-comparison/{pair}` | Yes |
| Knowledge state page | `/knowledge/state/{state}` | Yes |

### 2. Support, redirect, and legacy route families

These route families exist for backward compatibility or redirect purposes. They must NOT be independently indexable and must NOT appear in the sitemap as canonical destinations.

| Route family | Behavior | Canonical target |
|---|---|---|
| `/compare/{pair}` | 308 permanent redirect | `/electricity-cost-comparison/{pair}` |
| `/calculator` | 308 permanent redirect | `/electricity-cost-calculator` |
| `/{state}/city/{citySlug}` | 308 permanent redirect | `/electricity-cost/{state}/{city}` |
| `/{state}/{city}` | 308 permanent redirect | `/electricity-cost/{state}/{city}` |
| `/how-much-does-{kwh}-kwh-cost` | 308 permanent redirect | `/electricity-hubs/usage/{kwh}` |
| `/how-much-does-{kwh}-kwh-cost/{state}` | 308 permanent redirect | `/electricity-usage-cost/{kwh}/{state}` |

### 3. Canonical tag behavior

- Every canonical route family page must emit a self-referencing canonical tag pointing to its own production URL.
- Every legacy/redirect route must either redirect before rendering (preferred) or emit a canonical tag pointing to the canonical target.
- No two route families may emit the same canonical URL.
- The `buildMetadata()` utility in `src/lib/seo/metadata.ts` is the single canonical tag generation surface for page-level metadata.

### 4. Sitemap alignment

- The sitemap (`src/app/sitemap.ts`) must include only canonical route family URLs.
- Redirect-only routes must NOT appear in the sitemap.
- Sitemap inclusion must be gated by rollout configuration for rollout-controlled families.
- Every URL in the sitemap must resolve to a 200 status code or a valid redirect chain ending at a 200.

### 5. Appliance x City canonical policy

- **Primary intent:** appliance cost intent with city-qualified locality context.
- **Canonical owner (pilot):** `/cost-to-run/{appliance}/{state}/{city}`.
- **Required scope controls:** this family must be rollout-gated by explicit appliance-city keys and hard caps.
- **Overlap handling:** calculator-intent routes remain canonical in `/electricity-cost-calculator/*`; no appliance x city calculator canonical family is allowed during pilot phase.
- **Supporting behavior:** parent state appliance route `/cost-to-run/{appliance}/{state}` remains canonical for broad state appliance intent and should cross-link to pilot city pages only when rollout-enabled.

---

## B. Canonical Origin Rules

### 1. Production origin source of truth

The production canonical origin is:

```
https://priceofelectricity.com
```

This value is defined in `src/lib/site.ts` via `resolveSiteUrl()`.

### 2. Generated artifact origin policy

All machine-readable generated artifacts that contain absolute URLs must use the production origin. This applies to:

- `public/knowledge/search-index.json`
- `public/knowledge/entity-index.json`
- `public/knowledge/index.json`
- `public/knowledge/**/*.json` (any `canonicalUrl` or `jsonUrl` field)
- `public/discovery-graph.json`
- `public/graph.json`

**Rule:** The `ensureAbsoluteUrl()` function in `scripts/knowledge-build.ts` must always resolve to the production origin, regardless of the build environment.

### 3. Forbidden values in generated artifacts

The following patterns are forbidden in any `canonicalUrl`, `jsonUrl`, or `url` field of generated public artifacts:

- `http://localhost`
- `http://127.0.0.1`
- Any non-HTTPS origin
- Any preview/staging domain unless explicitly gated

### 4. Fallback behavior

- `src/lib/site.ts` may continue to resolve to `localhost` for local development runtime (dev server, page rendering).
- `scripts/knowledge-build.ts` must override the origin to production when generating artifacts, independent of `NODE_ENV` or `NEXT_PUBLIC_SITE_URL`.
- The `knowledge:verify` script must assert that no generated artifact contains a localhost canonical URL.

---

## C. Compare Route Policy

### 1. Authoritative compare route family

The canonical compare route family is:

```
/electricity-cost-comparison/{pair}
```

This family:
- Uses knowledge-backed pair data from `public/knowledge/compare/{pair}.json`
- Generates static params from `loadComparePairs()`
- Appears in the sitemap
- Emits self-referencing canonical tags

### 2. Legacy compare route family

The legacy compare route family is:

```
/compare/{pair}
```

This family:
- Issues a 308 permanent redirect to `/electricity-cost-comparison/{pair}`
- Generates static params from a top-10-high × top-10-low state pair set
- Does NOT appear in the sitemap as a canonical destination
- Emits canonical tags pointing to the canonical compare family

### 3. Compare-pair eligibility: single source of truth

The legacy compare route's `generateStaticParams()` and the sitemap's compare-pair eligibility logic currently duplicate the same top-high × top-low derivation algorithm. This duplication is the root cause of E-004 and E-005.

**Policy:** A single shared helper must define the legacy compare static pair set. Both the legacy compare route and the sitemap must import from this shared helper. The helper must live in `src/lib/compare/legacyComparePairs.ts`.

### 4. Sitemap compare inclusion rule

The sitemap must include `/compare/{pair}` URLs only when:
1. The pair is in the legacy static pair set (from the shared helper), AND
2. A backing `public/knowledge/compare/{pair}.json` file exists

The sitemap must include `/electricity-cost-comparison/{pair}` URLs for all pairs in `public/knowledge/compare/pairs.json`.

---

## D. Deterministic Protection Rules

### 1. Systems that must remain centralized

| System | Location | Rule |
|---|---|---|
| Canonical tag generation | `src/lib/seo/metadata.ts` | Single surface; no page may construct canonical tags independently |
| Sitemap generation | `src/app/sitemap.ts` | Single surface; no secondary sitemap generators |
| Robots policy | `src/app/robots.ts` | Single surface |
| Knowledge artifact generation | `scripts/knowledge-build.ts` | Single build script; no secondary generators |
| Knowledge verification | `scripts/verify-knowledge.js` | Single verification surface |
| Rollout configuration | `src/lib/longtail/rollout.ts` | Single rollout config |
| Compare-pair eligibility | `src/lib/compare/legacyComparePairs.ts` | Single source of truth (new) |

### 2. Forbidden actions in future repair prompts

Future repair prompts must NOT:

- Duplicate canonical tag logic outside `buildMetadata()`
- Add secondary sitemap generation surfaces
- Create route families that emit the same canonical URL as an existing family
- Change the production origin without updating all downstream consumers
- Remove redirect behavior from legacy routes without explicit policy update
- Introduce non-deterministic content generation (runtime AI, external API calls during build)

### 3. Required verification before any route family change

Before adding, removing, or modifying any route family:

1. Verify canonical ownership table above is updated
2. Verify sitemap inclusion is correct
3. Run `npm run knowledge:verify`
4. Run `npm run build`
5. Run `npm run verify:vercel`

---

## E. Architecture Decisions for Audit Items

### E-001: Generated search-index canonical URLs resolve to localhost

- **Current risk:** High. Generated artifacts shipped with localhost URLs are incorrect for production crawlers and LLM consumers.
- **Decision:** Targeted hardening change now.
- **Reasoning:** The `ensureAbsoluteUrl()` function in `knowledge-build.ts` inherits `SITE_URL` which falls back to localhost in non-production environments. Generated artifacts must always use the production origin regardless of build environment.
- **Action now:** Override `ensureAbsoluteUrl()` to use a hardcoded production origin constant for generated artifact URLs. Add a verification check in `verify-knowledge.js` to assert no localhost URLs exist in generated artifacts.
- **Deferred:** None. This is fully resolvable now.

### E-006: Canonical strategy depends on legacy + canonical family interplay

- **Current risk:** High for future regressions, but currently stable.
- **Decision:** Documentation only (this document). No code change needed now.
- **Reasoning:** The redirect behavior is correct and tested. The risk is future drift, which is addressed by the policy rules above and the deterministic protection rules. No code change reduces current risk without introducing new risk.
- **Action now:** None beyond this policy document.
- **Deferred:** Monitor during future expansion. If legacy compare routes are no longer needed (no inbound links), they may be removed in a future policy update.

### E-004: Legacy compare pair universe synchronization remains brittle

- **Current risk:** Medium. Two identical algorithms exist in separate files.
- **Decision:** Targeted hardening change now.
- **Reasoning:** Extracting the shared helper is a safe, non-architectural change that eliminates duplication without changing any route behavior or URL structure.
- **Action now:** Create `src/lib/compare/legacyComparePairs.ts` with the shared helper. Update both consumers to import from it.
- **Deferred:** None. This is fully resolvable now.

### E-005: Compare sitemap eligibility depends on duplicated logic

- **Current risk:** Medium. Same root cause as E-004.
- **Decision:** Resolved by E-004 fix.
- **Reasoning:** Once the shared helper exists, the sitemap imports from it, eliminating the duplication.
- **Action now:** Included in E-004 fix.
- **Deferred:** None.
