# Deployment Readiness

**Status:** Ready for GitHub commit and Vercel deployment (after manual commit and deploy steps).

## Current Repo Status

- All validation commands pass: `knowledge:build`, `knowledge:verify`, `build`, `lint`, `verify`
- No known blockers for commit or deployment
- See `docs/PRELAUNCH_COMPLETION_AUDIT.md` for detailed audit

## Commands Before Deployment

Run in this order:

```bash
npm run knowledge:build
npm run knowledge:verify
npm run build
npm run lint
npm run verify
```

All must pass before committing to GitHub or deploying to Vercel.

## Environment Variables

**For Vercel production deployment**, configure in project settings:

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SITE_URL` | Yes | e.g. `https://priceofelectricity.com` |
| `EMAIL_SINK` | Yes (production) | Use `log` unless external storage configured |
| `ALERT_EXPORT_TOKEN` | Yes (production) | Strong secret, not `change-me` |

**For local development:** None required. The app falls back to `http://localhost:3000` and default values.

See `docs/DEPLOYMENT_VERCEL.md` for full deployment flow.

## vercel.json

**Status:** Present and correct.

- `buildCommand`: `npm run verify:vercel`
- Runs full validation (excluding LHCI, which requires Chrome and is skipped on Vercel)
- LHCI should be run in GitHub Actions instead

## GitHub Readiness

- `.gitignore` excludes: `node_modules`, `.next`, `.env*` (except `.env.example`), `.vercel`, `.lighthouseci/`, `.data/`
- If `.data/` was previously committed, run `git rm -r --cached .data/` before commit to stop tracking it
- No secrets in repo
- Generated knowledge files (`public/knowledge/`, `public/datasets/`) are produced by `npm run build` and should be committed (or rebuilt on Vercel via build command)

## Vercel Readiness

- Build uses `npm run verify:vercel` (data:validate → lint → typecheck → build → canonical:check → smoke → integrity → api:contract → indexing:check → readiness:audit → seo:check)
- Next.js 16 with App Router
- Sitemap, robots, discovery assets generated at build time
- `robots.ts` is environment-aware (production allows indexing; preview/development disallows)

## Remaining Non-Blocking Cautions

- Run `npm run predeploy` before production deploy to validate env vars
- Ensure `NEXT_PUBLIC_SITE_URL` matches your canonical domain
- Configure `www` → non-www redirect at DNS/Vercel if using non-www canonical
