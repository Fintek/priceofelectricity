# Vercel Environment Variables — Dashboard Handoff

**Purpose:** Exact variables to enter in Vercel before or during first deployment.

---

## Variable Summary

| Variable | Required for first deploy | Scope | Notes |
|----------|---------------------------|-------|-------|
| `NEXT_PUBLIC_SITE_URL` | Recommended | Production, Preview | Canonical URL; fallback exists but set for correctness |
| `EMAIL_SINK` | No | Production, Preview | Defaults to `log`; safe to omit |
| `ALERT_EXPORT_TOKEN` | Yes (production) | Production only | Alert export API; must not be `change-me` |
| `INDEXNOW_KEY` | No | — | Add later if using IndexNow |
| `INDEXNOW_ENABLED` | No | — | Set `true` only if using IndexNow |

---

## Minimum Set Before First Deploy

**Production deployment:** Add these before first deploy:

1. **NEXT_PUBLIC_SITE_URL** = `https://priceofelectricity.com`  
   - Use your canonical domain. For first deploy before DNS, this is fine.

2. **ALERT_EXPORT_TOKEN** = *(generate a strong random secret)*  
   - Do not use `change-me`. Use a password manager or `openssl rand -hex 32`.

**Optional but recommended:**

3. **EMAIL_SINK** = `log`  
   - Omit if you want the default. Use `log` to make it explicit.

---

## Variables You Can Add Later

- `INDEXNOW_KEY` — only if you enable IndexNow (Bing/IndexNow)
- `INDEXNOW_ENABLED` — set `true` only with `INDEXNOW_KEY`
- `LOG_LEVEL` — optional (`debug`, `info`, `warn`, `error`)
- `LAUNCH_MODE` — optional feature flag (`true`/`false`)

---

## Vercel Dashboard Steps

1. Go to [vercel.com](https://vercel.com) → your project (or create from GitHub import).
2. **Settings** → **Environment Variables**.
3. Add variables in this order:

   | Key | Value | Environment |
   |-----|-------|-------------|
   | `NEXT_PUBLIC_SITE_URL` | `https://priceofelectricity.com` | Production, Preview |
   | `ALERT_EXPORT_TOKEN` | *(your secret)* | Production |
   | `EMAIL_SINK` | `log` | Production, Preview |

4. For each variable, choose:
   - **Production** — live site
   - **Preview** — PR/preview deployments (optional for `ALERT_EXPORT_TOKEN`)
   - **Development** — usually leave unchecked (use `.env.local` locally)

5. **Save** and redeploy if the project already exists.

---

## Where Values Come From

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_SITE_URL` | Your canonical domain (e.g. `https://priceofelectricity.com`) |
| `EMAIL_SINK` | Use `log` unless you have another sink configured |
| `ALERT_EXPORT_TOKEN` | Generate: `openssl rand -hex 32` or a password manager |

---

## Warnings

- `EMAIL_SINK=file` is **not allowed** in production (predeploy-check fails).
- `ALERT_EXPORT_TOKEN=change-me` is **not allowed** in production.
- `NEXT_PUBLIC_*` variables are baked into the client bundle at build time; changing them requires a rebuild.
