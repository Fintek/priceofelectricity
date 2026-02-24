# Performance Budget and Lighthouse CI

This project includes a lightweight Lighthouse CI (LHCI) budget to catch obvious performance and quality regressions before launch.

## Why this exists

- Keep site speed and UX stable as content grows.
- Catch regressions automatically in CI instead of discovering them late.
- Enforce practical minimum thresholds without making CI flaky.

## Routes tested

LHCI checks representative pages from core site sections:

- `/`
- `/texas`
- `/national`
- `/drivers`
- `/regulatory`
- `/offers`
- `/alerts`
- `/knowledge`

## Budget thresholds

Configured in `lighthouserc.json`:

- `categories:performance >= 0.75`
- `categories:accessibility >= 0.90`
- `categories:best-practices >= 0.90`
- `categories:seo >= 0.90`

These are intentionally realistic for CI. They should catch major regressions while avoiding unnecessary flakiness.

## How to run locally

1. Build production assets:
   - `npm run build`
2. Run Lighthouse CI:
   - `npm run lhci`

`lhci autorun` will start a production server and run audits with one run per URL.

## CI behavior

- `npm run verify` includes LHCI at the end of the pipeline.
- GitHub Actions uploads `.lighthouseci` as an artifact (`lhci-reports`) for debugging, even when verification fails.

## Interpreting failures

When LHCI fails:

1. Open the uploaded `lhci-reports` artifact.
2. Identify which route and category dropped below threshold.
3. Check for likely causes:
   - large new JS bundles,
   - layout shifts,
   - render-blocking resources,
   - metadata/accessibility regressions.
4. Fix the issue and rerun `npm run lhci` locally.

## Adjusting thresholds responsibly

If a threshold needs adjustment:

- Prefer fixing regressions first.
- Change thresholds only with evidence from repeated runs.
- Keep thresholds strict enough to detect meaningful regressions.
- Update this document and `lighthouserc.json` together.
