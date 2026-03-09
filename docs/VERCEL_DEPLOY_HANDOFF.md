# Vercel Deployment Handoff

**Status:** Deployment not yet executed — authentication required.

---

## Pre-Deploy Summary

| Item | Value |
|------|-------|
| Framework | Next.js 16 |
| Build command | `npm run verify:vercel` (from vercel.json) |
| Output | Next.js default (.next) |
| Env vars for production | YES — see below |

---

## Deployment Method

**CLI:** Blocked — run `vercel login` first, then:

```bash
npx vercel deploy --prod
```

**Dashboard (recommended):**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select **Fintek/priceofelectricity** (or paste `https://github.com/Fintek/priceofelectricity`)
4. Vercel auto-detects Next.js and uses `vercel.json` build command — do not override
5. Before deploying, add Environment Variables (Project Settings → Environment Variables):

   | Name | Value | Environment |
   |------|-------|-------------|
   | `NEXT_PUBLIC_SITE_URL` | `https://priceofelectricity.com` | Production |
   | `EMAIL_SINK` | `log` | Production |
   | `ALERT_EXPORT_TOKEN` | *(generate a strong secret)* | Production |

6. Click **Deploy**

---

## Post-Deploy Verification

After deployment:

- Homepage: `https://<your-project>.vercel.app/`
- Representative routes: `/texas`, `/national`, `/compare`, `/knowledge`
- Run `npm run predeploy` locally (with env vars set) before production deploy to validate

---

## Next Human Step: GoDaddy DNS

After Vercel deployment succeeds:

1. In Vercel: Project Settings → Domains → Add `priceofelectricity.com` and `www.priceofelectricity.com`
2. Vercel will show the DNS records to add in GoDaddy
3. In GoDaddy DNS: Add the A record and CNAME record(s) Vercel specifies
4. Wait for propagation (up to 48 hours, often minutes)
5. Vercel will auto-provision SSL

---

## Warnings

- Do not use `ALERT_EXPORT_TOKEN=change-me` in production
- `EMAIL_SINK=file` is not allowed in production
- Ensure `NEXT_PUBLIC_SITE_URL` matches your canonical domain after DNS is connected
