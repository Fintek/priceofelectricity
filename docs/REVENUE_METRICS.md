# Revenue Metrics

## What is tracked

Three server-side revenue funnel events:

| Event | Trigger | Location |
|---|---|---|
| `offer_impression` | Offer rendered on page | `/offers`, `/offers/[state]` |
| `offer_click` | User hits `/out/[offerId]` redirect | `/out/[offerId]` route |
| `alert_submit` | User lands on success page | `/alerts/success` |

Each event records a timestamp, event type, and optional `state` and `offerId` metadata.

## Where events are stored

Events are appended to `.data/revenue-events.jsonl` as newline-delimited JSON.

Example entry:

```json
{"ts":"2026-02-24T12:00:00.000Z","type":"offer_click","state":"texas","offerId":"nat-plans-compare"}
```

Events are also emitted to structured logs via `logger.log("info", "revenue_event", ...)`.

## API

`GET /api/revenue/summary` returns aggregated metrics:

```json
{
  "impressions": 150,
  "clicks": 12,
  "signups": 3,
  "ctr": 0.08,
  "signupRate": 0.02,
  "topStates": [
    { "state": "texas", "impressions": 40, "clicks": 5 }
  ]
}
```

Rate limited to 30 requests per minute per IP. `Cache-Control: no-store`.

## Dashboard

`/revenue` renders the summary as an internal dashboard page (noindexed).

## Limitations

- **File-based storage**: `.data/revenue-events.jsonl` is a local file. On serverless platforms (Vercel, etc.), this file is ephemeral and will be lost on redeployment or cold start.
- **No deduplication**: Impressions are recorded per render. Static builds record impressions at build time, not per user visit.
- **No user-level attribution**: Events are anonymous. No cookies, sessions, or user IDs.
- **Build-time impressions**: For statically generated pages, `offer_impression` events fire during `next build`, not per page view. Only the `/out/[offerId]` click route (dynamic) records real-time clicks.

## Future upgrade path

1. **Database sink**: Replace JSONL file with a database (Postgres, SQLite, Turso) for durable storage.
2. **Real-time impressions**: Move impression tracking to a client-side beacon or API route to capture per-visit data.
3. **Analytics integration**: Forward events to Plausible custom events, PostHog, or a data warehouse.
4. **Attribution**: Add session or visitor IDs to correlate impressions → clicks → signups.
5. **Alerting**: Trigger alerts when CTR drops below threshold or click volume spikes.
