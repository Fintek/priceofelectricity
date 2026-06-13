# EIA Refresh Runbook: anomaly guard + corrections

This runbook covers the two safety layers added to the monthly EIA refresh:

- **Corrections override** — re-pins known-bad EIA source values over the
  freshly-fetched CSV before anything else runs.
- **Month-over-month (MoM) anomaly guard** — blocks the refresh when any
  state's residential price moves more than the threshold (default 25%) within
  the trailing 6-month window and is not allowlisted.

## Pipeline order (`.github/workflows/monthly-eia-refresh.yml`)

```
fetch -> apply corrections -> MoM guard -> snapshot-build -> knowledge-build
      -> knowledge-verify -> check-changes -> commit/push
```

The applier mutates the CSV before the guard, so a corrected state passes the
guard while every other state updates normally. If the guard fails, the
snapshot/knowledge/commit steps never run and **nothing is committed or
pushed**, so the last-good committed data is preserved. A tracking issue
(label `eia-refresh`) is opened/updated on failure.

## Components

| Component | Path | npm script |
|---|---|---|
| MoM detector (pure) | `scripts/eia/lib/mom-anomaly.ts` | — |
| MoM guard CLI | `scripts/eia/check-mom-anomaly.ts` | `data:check:mom` |
| Corrections applier (pure) | `scripts/eia/lib/corrections.ts` | — |
| Corrections applier CLI | `scripts/eia/apply-corrections.ts` | `data:apply:corrections` |
| Allowlist | `data/eia/anomaly-allowlist.json` | — |
| Corrections | `data/eia/corrections.json` | — |

The same detector also runs read-only inside `npm run data:validate` (part of
`verify` / `verify:vercel`), so a committed unexplained jump fails locally and
in CI, plus an assertion that every active correction matches the committed CSV.

## Responding to a guard flag

Maryland's 2026-03 error is handled automatically by the corrections override;
no action is needed for it. When the guard fires on some **other** state:

1. Open the failing `data:check:mom` step log. Each anomaly is printed as
   `STATE from->to  oldPrice -> newPrice  (deltaPct)`.
2. Verify the new value against EIA's published number (and any state PSC /
   source notice).
3. **If it is a genuine EIA data error:** add an entry to
   `data/eia/corrections.json`, keyed by `period|stateid`:
   ```json
   "2026-05|RI": {
     "value": 25.4,
     "reason": "EIA mis-published; corrected per <source>.",
     "source": "https://...",
     "addedAt": "YYYY-MM-DD",
     "removeWhen": "Remove once EIA serves ~25.4 for 2026-05 RI."
   }
   ```
   Commit and re-run the workflow. The applier re-pins the value and the guard
   passes. `data:validate` also requires the committed CSV to already hold the
   pinned value.
4. **If it is a real but volatile correct move:** add an entry to
   `data/eia/anomaly-allowlist.json`, keyed by destination `period|stateid`:
   ```json
   "2026-05|CA": {
     "reason": "CA seasonal spring-to-summer step; verified against EIA.",
     "addedBy": "your-handle",
     "addedAt": "YYYY-MM-DD"
   }
   ```
   Commit and re-run. The guard downgrades that one month's move to allowed.
   Allowlist keys are per-destination-period, so they expire naturally.

## Correction staleness (transparency)

The applier compares each correction's pinned `value` against the **raw fetched
value** in `data/raw/eia/retail_res_monthly_latest_refresh.json` (not the
already-pinned CSV). When EIA converges back to the pinned value (within ~2%),
it prints a non-fatal `WARN` so reviewers know to drop the entry per its
`removeWhen`. It never fails the job. Once a period ages out of the 6-month
fetch window it can no longer be re-served, so the correction is harmless and
can be removed during periodic review.

## Tuning

- Threshold: `--threshold` flag or `EIA_MOM_THRESHOLD` env (default 25).
- Window: `--window` flag (default 6 months, matching the updater's lookback).
