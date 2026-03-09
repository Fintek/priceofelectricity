# Next Steps: GitHub Commit & Vercel Deploy

**Last validation:** All commands passed (knowledge:build, knowledge:verify, build, lint, verify).

---

## Git Commit & Push

Run these commands in order:

```bash
# 1. Stop tracking .data/ (local analytics; now in .gitignore)
git rm -r --cached .data/

# 2. Stage all changes
git add .

# 3. Commit
git commit -m "Deployment readiness: knowledge build, docs, .env.example, gitignore"

# 4. Push (remote origin already configured)
git push origin main
```

**Remote:** `origin` → `https://github.com/Fintek/priceofelectricity.git`

---

## Vercel Deploy

### Option A: Import from GitHub (recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the repo: `Fintek/priceofelectricity`
3. Vercel will detect **Next.js** and use `vercel.json` build command
4. Add environment variables in Project Settings → Environment Variables:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `NEXT_PUBLIC_SITE_URL` | `https://priceofelectricity.com` | Production |
   | `EMAIL_SINK` | `log` | Production |
   | `ALERT_EXPORT_TOKEN` | *(your secure token)* | Production |

5. Deploy

### Option B: Vercel CLI

```bash
vercel
```

Configure env vars in the Vercel dashboard after first deploy.

### Build Command

`vercel.json` sets `buildCommand: "npm run verify:vercel"` — no override needed. Vercel will run full validation (excluding LHCI).

---

## Non-Blocking Cautions

- Run `npm run predeploy` before production deploy to validate env vars
- Ensure `NEXT_PUBLIC_SITE_URL` matches your canonical domain
- LHCI runs locally/in CI; Vercel skips it (Chrome not available)
