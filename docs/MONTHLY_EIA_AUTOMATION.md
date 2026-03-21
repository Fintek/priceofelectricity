# Monthly EIA Price Automation

## Overview

A GitHub Actions workflow automatically fetches the latest EIA residential electricity prices once per month, regenerates snapshot/history artifacts, commits any changes, and pushes to `main`. Vercel then auto-deploys from the updated branch.

## Components

| Component | Path |
|---|---|
| Monthly updater script | `scripts/eia/update_residential_monthly.ts` |
| Snapshot generator | `scripts/eia/generate_snapshots_from_eia_csv.ts` |
| GitHub Actions workflow | `.github/workflows/monthly-eia-refresh.yml` |
| npm script | `npm run data:update:eia:res` |

## Schedule

The workflow runs on the **28th of each month at 10:00 UTC** (06:00 ET). This provides a buffer after EIA's typical mid-month publication date.

## Required GitHub Secret

| Secret | Description |
|---|---|
| `EIA_API_KEY` | API key from [EIA Open Data](https://www.eia.gov/opendata/) |

Add this in the repo's **Settings → Secrets and variables → Actions**.

## Manual Trigger

Go to **Actions → Monthly EIA Price Refresh → Run workflow** in the GitHub UI, or:

```bash
gh workflow run monthly-eia-refresh.yml
```

## What Changes When New Data Is Published

When EIA publishes a new month of data, the workflow updates:

- `data/raw/eia/retail_res_monthly_latest_refresh.json` — raw API response for the most recent refresh window
- `data/normalized/eia/retail_res_monthly_2000_present.csv` — merged canonical CSV
- `src/data/history.generated.ts` — TypeScript history module
- `src/data/history.generated.json` — JSON history
- `src/data/snapshots/v1.json` — second-to-latest complete snapshot
- `src/data/snapshots/v2.json` — latest complete snapshot

If no new data is available, the workflow exits cleanly without committing.

## Deployment

After the workflow pushes a commit to `main`, Vercel automatically detects the push and triggers a production deployment. No additional deploy step is needed.

## Related Scripts

- `npm run data:backfill:eia:res` — full historical backfill (2000–present); use only for initial setup or recovery
- `npm run data:build:snapshots:eia` — regenerate snapshots/history from existing CSV without fetching
