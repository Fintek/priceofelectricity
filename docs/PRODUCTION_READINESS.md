# Production Readiness Audit

Deterministic audit that validates the production build is ready for launch. Generates a machine-readable report (`public/readiness.json`) and powers the `/readiness` page.

## Running the audit

```bash
npm run readiness:audit
```

This starts a production server against the current build and runs all checks. The audit also runs as part of `npm run verify`.

## What it checks

### A) Core availability

Verifies that key pages return HTTP 200:

- `/`, `/texas`, `/national`, `/drivers`, `/regulatory`, `/offers`, `/alerts`
- `/api/v1/states`

### B) Canonical correctness

- Home page has a `<link rel="canonical">` tag
- Canonical URL starts with the production domain (not `localhost`)

### C) Robots correctness

- `/robots.txt` is reachable
- Allows crawling (no blanket `Disallow: /`)
- References the sitemap

### D) Sitemap correctness

- `/sitemap.xml` returns 200
- Contains at least: `/texas`, `/national`, `/offers`, `/drivers`

### E) Security headers

Response headers must include:

- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`

### F) API contract

- `/api/v1/states` returns `version: "v1"`
- `states` array is non-empty

### G) Release metadata

- `/status` page renders commit and builtAt
- `/health` endpoint returns `commit` and `dataVersion`

## Output

The audit writes `public/readiness.json`:

```json
{
  "generatedAt": "2026-02-24T12:00:00.000Z",
  "commit": "7a2917a",
  "summary": { "total": 24, "passed": 24, "failed": 0 },
  "checks": [
    { "name": "/ returns 200", "passed": true },
    ...
  ]
}
```

## The /readiness page

Visit `/readiness` to see a human-readable summary of the last audit. The page is statically generated and shows the report from the most recent `readiness:audit` run.

## What failing means

If any check fails:

- The script exits with code 1
- `npm run verify` fails
- The failure details are printed to stdout and recorded in `readiness.json`

This prevents deploying a build that has regressed on critical infrastructure.

## Why this exists

The readiness audit is the final engineering gate before launch. It consolidates checks that are otherwise spread across smoke tests, integrity checks, and manual verification into a single deterministic pass/fail report. It ensures that:

- All key pages are reachable
- SEO infrastructure (canonical, robots, sitemap) is correct
- Security headers are applied
- API contracts are honored
- Release metadata is present

The audit runs against the actual built production server, not mocked data, so it catches real deployment issues.
