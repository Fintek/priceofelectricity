# Smoke Tests

This project includes lightweight Node-based smoke tests to catch high-impact regressions early without browser automation frameworks.

## What Smoke Tests Cover

The smoke runner starts the production app with `next start` on a free port, then performs HTTP checks for:

- Core pages returning `200`
- Known invalid routes returning `404`
- JSON endpoints returning `200` and valid parseable JSON
- CSV endpoints returning `200` and plausible CSV content
- Invalid sort metadata behavior (`/compare?sort=invalid` must include robots `noindex`)

## How To Run

Run production build first, then smoke tests:

```bash
npm run build
npm run smoke
```

Run the full quality gate (used in CI):

```bash
npm run verify
```

`verify` runs data validation, lint, typecheck, build, and smoke tests in sequence.

## Notes

- Smoke tests intentionally do **not** run `build`; they expect a built app.
- The runner always attempts to stop the server process, even if checks fail.
- The script is designed to work on Windows and Linux CI environments.

## Adding New Checks

Edit `scripts/smoke-test.ts` and update the route lists:

- `mustBe200` for required pages
- `mustBe404` for invalid pages
- `jsonEndpoints` for JSON checks
- `csvEndpoints` for CSV checks

Keep checks fast and deterministic so CI remains reliable.
