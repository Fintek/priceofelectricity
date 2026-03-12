# Generated Output Policy (Internal)

**Status:** Active stabilization policy  
**Scope:** `public/knowledge/**`, `public/discovery-graph.json`, `public/graph.json`, `public/datasets/*`, `public/release.json`  
**Audience:** Engineering, reviewers, release operators

## A. Generated Artifacts and Source Scripts

- `scripts/knowledge-build.ts` generates:
  - `public/knowledge/**`
  - `public/discovery-graph.json`
  - `public/graph.json`
  - `public/datasets/electricity-prices-by-state.{json,csv}`
  - `public/datasets/electricity-rankings.{json,csv}`
  - `public/electricity-comparison-pairs.json`
- `scripts/release-generate.ts` generates:
  - `public/release.json`

## B. Commit Policy

- **Commit these generated outputs** when source/content/data changes are intentional.
- Generated artifacts are part of the repository contract and are not optional for production readiness checks.
- Do not manually edit generated files in `public/knowledge/**`.

## C. Deterministic Requirements

Generated outputs must satisfy:

- Stable JSON formatting (`JSON.stringify(..., null, 2)` and trailing newline).
- Stable ordering for arrays/maps where script logic defines deterministic order.
- Production canonical origin in absolute URLs where required by canonical policy.
- Deterministic `generatedAt` for knowledge artifacts derived from snapshot release timestamp (unless an explicit override is provided).
- No environment-specific origins (`localhost`, preview domains) in generated canonical URLs.

## D. Acceptable vs Unacceptable Churn

**Acceptable churn**

- Broad changes when snapshot/data version changes.
- Broad changes when methodology/content generation logic changes.
- Integrity/signature updates caused by real upstream data/content changes.
- `public/release.json` changing per build.

**Unacceptable churn**

- Environment-dependent URL churn.
- Unstable ordering churn (same input, different ordering).
- Build-time-now timestamp churn across broad knowledge outputs for unchanged snapshot data.
- Non-deterministic output shape changes across repeated local runs on identical inputs.

## E. Forbidden Casual Changes

Future prompts must NOT casually:

- Remove generated outputs from version control to hide diffs.
- Suppress real data changes to shrink diffs.
- Introduce ad-hoc per-file generation logic outside centralized scripts.
- Change canonical URL policy or route ownership via generated artifacts.
- Alter schema formats without explicit approval.

## F. Safe Review Workflow for Generated Diffs

Before committing generated assets:

1. Run:
   - `npm run knowledge:build`
   - `npm run knowledge:verify`
2. Confirm script output includes generated group summaries and expected scale.
3. Review diffs by artifact group:
   - `public/knowledge/**`
   - `public/datasets/*`
   - `public/discovery-graph.json`
   - `public/graph.json`
   - `public/release.json`
4. Validate that churn reason is explainable:
   - snapshot/data version changed, or
   - generation logic changed intentionally.
5. If broad churn occurs without explainable cause, stop and investigate before commit.

## G. Broad vs Narrow Regeneration Expectations

- **Broad regeneration expected** when:
  - snapshot/data version changes
  - core knowledge generation logic changes
- **Narrow regeneration expected** when:
  - copy-only page updates unrelated to data generation
  - isolated verification/script messaging changes

## H. Review Red Flags

Escalate if any of the following appears:

- Canonical URLs with localhost or non-production origins.
- Repeated large diffs with unchanged snapshot version and no script changes.
- Inconsistent generated ordering between consecutive runs.
- Unexpected schema-key or endpoint-shape changes.
- Mismatch between generated diff scope and declared source changes.
