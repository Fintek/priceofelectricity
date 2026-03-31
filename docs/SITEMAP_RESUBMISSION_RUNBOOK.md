# Sitemap Resubmission Runbook

This runbook covers the manual sitemap resubmission step after the production sitemap segmentation fix.

## Submission target (use this exact URL)

- `https://priceofelectricity.com/sitemap-index.xml`

Do **not** submit `/sitemap.xml` for this setup. Do **not** use `www.priceofelectricity.com` — the canonical origin is non-www. The canonical entrypoint is `sitemap-index.xml`, which references:

- `/sitemap/core.xml`
- `/sitemap/states.xml`
- `/sitemap/cities.xml`
- `/sitemap/appliances.xml`
- `/sitemap/estimators.xml`

## Live readiness check (pre-submit)

Confirm before submitting:

- `https://priceofelectricity.com/sitemap-index.xml` returns 200.
- `https://priceofelectricity.com/robots.txt` returns 200 and contains `Sitemap: https://priceofelectricity.com/sitemap-index.xml`.
- All 5 segment URLs return 200.
- No cross-segment duplicates remain.
- Sample URLs are present in expected segments:
  - `/electricity-bill-estimator/texas` in `estimators`
  - `/cost-to-run/refrigerator/texas` in `appliances`

## Google Search Console manual submission

1. Open Google Search Console for the `https://priceofelectricity.com` property.
2. Go to **Indexing** -> **Sitemaps**.
3. In **Add a new sitemap**, enter: `sitemap-index.xml`.
4. Click **Submit**.
5. Open the submitted sitemap detail and confirm:
   - Status is accepted/received (or pending processing, which is normal initially).
   - Last read timestamp appears after submission.

Capture these confirmations:

- Screenshot of the submitted sitemap URL.
- Screenshot of status and last read timestamp.
- Screenshot of discovered URL count shown in GSC for the submitted sitemap.

## Bing Webmaster Tools manual submission

1. Open Bing Webmaster Tools for the same verified site.
2. Go to **Sitemaps**.
3. Add sitemap URL: `https://priceofelectricity.com/sitemap-index.xml`.
4. Submit and open sitemap details.
5. Confirm sitemap is fetched/accepted (or queued/processing).

Capture these confirmations:

- Screenshot of submitted sitemap URL.
- Screenshot of sitemap status/result.
- Screenshot of discovered/submitted URL count shown by Bing.

## Normal vs concerning post-submit messages

Normal right after submit:

- "Submitted" / "Success" / "Queued" / "Processing".
- Delay before counts update.
- Temporary zero "indexed" growth on day 0.

Concerning (investigate):

- "Couldn't fetch", "General HTTP error", or repeated fetch failures.
- "Couldn't parse" / XML parse error.
- Robots or access-block warnings against sitemap URL.
- Submitted URL not matching `sitemap-index.xml`.

## Post-submission monitoring checklist (next 3-7 days)

Check daily (or at least every 48 hours):

- Sitemap accepted status remains healthy in GSC and Bing.
- Discovered/submitted URL count trends upward or stabilizes at expected range.
- No fetch errors or parse errors appear.
- No robots/crawl-blocking warnings appear.
- Production sitemap endpoints remain stable:
  - `/sitemap-index.xml` = 200
  - all segment files = 200
  - robots still references `sitemap-index.xml`
- If edge redirects differ from the non-www canonical policy (for example, non-www -> www), keep submission URL and canonical-policy checks anchored to this runbook and treat redirect drift as an infrastructure follow-up item.
- Representative URLs start showing as discovered/indexed over time.

## When to wait vs investigate

- Wait: 24-72 hours with no hard errors and statuses show processing/accepted.
- Investigate immediately: persistent fetch/parse/robots errors, or sitemap submission URL mismatch.

## Canonical origin reminder

The canonical origin is `https://priceofelectricity.com` (non-www). Do not use `www.priceofelectricity.com` in any submission URL. The `www` subdomain redirects to the non-www canonical.

## In-repo verification

Run `npm run indexing:check` after build to verify robots/sitemap alignment, sitemap segment completeness, and deferred-route leakage protection before any manual submission.
