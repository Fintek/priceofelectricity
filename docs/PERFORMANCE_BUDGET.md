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

## Deployment payload budgets

Runtime route latency and frontend quality are now complemented by a lightweight deployment payload gate.

`npm run payload:audit` enforces these output-size ceilings after build:

- `.next/standalone` <= `85 MiB`
- `.next/server/app` <= `40 MiB`
- `public/knowledge` <= `6 MiB`

The script also prints top subfolders for `.next/server/app` and `public/knowledge` to make growth concentration visible during reviews.
It now also prints explicit per-target headroom.

### Operating margin policy

Passing the ceiling is necessary but not sufficient for expansion safety.

- Treat `.next/server/app` operating margin as a gating signal before further fan-out.
- **Preferred operating zone:** <= 90% budget utilization.
- **Caution zone:** 90-97% (require explicit payload rationale and mitigation plan).
- **Blocker zone:** >= 97% (run headroom recovery before additional inventory expansion).
- Large route families should avoid full static fan-out by default unless payload headroom is clearly sufficient.

## How to run locally

1. Build production assets:
   - `npm run build`
2. Run payload governance audit:
   - `npm run payload:audit`
3. Run Lighthouse CI:
   - `npm run lhci`

`lhci autorun` will start a production server and run audits with one run per URL.

## CI behavior

- `npm run verify` includes LHCI at the end of the pipeline.
- `npm run verify` and `npm run verify:vercel` include `npm run payload:audit` immediately after `npm run build`.
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

### Payload threshold update policy

For deployment payload thresholds (`.next/standalone`, `.next/server/app`, `public/knowledge`):

- Raise a payload budget only after at least 2 repeated runs show a stable overage from intentional changes.
- Include measured evidence in the PR (before/after MiB from `npm run payload:audit` output).
- Update `scripts/payload-audit.ts` and this document in the same PR.
- Keep `verify` and `verify:vercel` wiring intact so enforcement remains automatic.
