# Deployment on Vercel

This project uses an engineering-first deployment flow with deterministic checks.

## Deployment flow

1. Configure required environment variables in Vercel.
2. Trigger deployment (push or manual deploy).
3. Vercel runs:
   - `npm ci`
   - `npm run verify` (via `vercel.json` build command)
4. Deployment succeeds only if all quality gates pass.

## Required environment variables

Set these in the Vercel project settings:

- `NEXT_PUBLIC_SITE_URL` = `https://priceofelectricity.com`
- `EMAIL_SINK` = `log` (recommended for production unless external storage is configured)
- `ALERT_EXPORT_TOKEN` = strong secret value (not `change-me`)

Optional platform variable:

- `VERCEL_ENV` is automatically set by Vercel (`production`, `preview`, `development`)

## Domain and canonical setup

- Use non-www canonical: `https://priceofelectricity.com`
- Configure `www.priceofelectricity.com` to redirect to the canonical non-www domain
- Keep `NEXT_PUBLIC_SITE_URL` aligned with canonical domain

## Indexing and preview safety

- `robots.ts` is environment-aware:
  - `VERCEL_ENV=production` -> allow indexing
  - any other `VERCEL_ENV` (preview/development) -> disallow indexing
- Sitemap always points to canonical site URL.

## Predeploy checks

Run locally before production deploy:

```bash
npm run predeploy
```

This checks:

- `NEXT_PUBLIC_SITE_URL` exists and is not localhost
- `EMAIL_SINK` is not `file` in production
- `ALERT_EXPORT_TOKEN` is not placeholder in production
- `public/release.json` exists (or generates it)
- full `npm run verify`

## Post-deploy checks

After deployment, verify:

- `/robots.txt` behavior is correct for the environment
- `/sitemap.xml` is reachable
- `/health` returns status with release metadata
- `/status` shows release metadata and data version
