# Launch Log

## Deployment Details

| Field | Value |
|---|---|
| Date/Time | ____-__-__ __:__ UTC |
| Domain | https://priceofelectricity.com |
| Commit | `7a2917a` |
| Data Version | v20260222 |
| App Version | 0.1.0 |
| Node | v24.6.0 |
| Platform | Vercel |
| LAUNCH_MODE | true |
| EMAIL_SINK | log |

## Pre-Deploy

- [ ] `npm run verify` passes locally (all gates green)
- [ ] Environment variables locked in Vercel Production
- [ ] `NEXT_PUBLIC_SITE_URL` = `https://priceofelectricity.com`
- [ ] `LAUNCH_MODE` = `true`
- [ ] `LOG_LEVEL` = `info`
- [ ] `EMAIL_SINK` = `log`
- [ ] `ALERT_EXPORT_TOKEN` set to strong value
- [ ] Domain attached in Vercel
- [ ] HTTPS enforced
- [ ] www → non-www redirect configured

## Post-Deploy Validation

### A) Availability (all must return 200)

- [ ] GET /
- [ ] GET /texas
- [ ] GET /national
- [ ] GET /drivers
- [ ] GET /regulatory
- [ ] GET /offers
- [ ] GET /alerts
- [ ] GET /knowledge

### B) SEO

- [ ] /robots.txt allows indexing (`Allow: /`)
- [ ] /robots.txt references sitemap
- [ ] /sitemap.xml returns 200 and contains `/texas`
- [ ] Home page canonical = `https://priceofelectricity.com/`
- [ ] /texas canonical = `https://priceofelectricity.com/texas`
- [ ] No noindex meta on core pages
- [ ] JSON-LD structured data present on home page

### C) Monitoring

- [ ] /health returns `{"status":"ok"}` with commit and dataVersion
- [ ] /status renders release metadata
- [ ] /readiness shows all checks passed

### D) Monetization Plumbing

- [ ] /offers/texas loads
- [ ] /out/nat-plans-compare redirects (307)
- [ ] /disclosures loads

### E) Alerts Capture

- [ ] Alert signup form submits successfully
- [ ] /alerts/success page renders
- [ ] Server logs show masked email (no raw PII)

## Issues Encountered

_None / describe any issues here._

## Rollback Plan

If any critical check fails:

1. **Immediate**: Redeploy previous production deployment via Vercel dashboard (Deployments → previous → Promote to Production)
2. **Soft fallback**: Set `LAUNCH_MODE=false` in Vercel env vars and redeploy — site still serves but pre-launch banner returns
3. **DNS**: If domain issues, revert DNS changes in registrar

## Sign-Off

| Role | Name | Date |
|---|---|---|
| Deployer | | |
