# Alerts Email Capture Foundation

This project includes a minimal email capture foundation for alerts that does **not** require a third-party ESP.

## Storage Modes (`EMAIL_SINK`)

Set `EMAIL_SINK` to control how signups are handled:

- `log` (default)
  - Signups are accepted and logged as one-line JSON to server logs.
- `file`
  - Signups are appended to `.data/alert-signups.jsonl` in JSONL format.
  - Intended for local/dev workflows.
- `none`
  - Signups are accepted but dropped.

## Endpoints

- `POST /api/alerts/signup`
  - Accepts `application/x-www-form-urlencoded` or JSON payloads.
  - Validates `email`, `area`, optional `state` slug, optional `frequency/topics`.
  - Supports optional `redirectTo` (303 redirect after processing).

- `GET /api/alerts/export`
  - Export endpoint for file-backed signups.
  - Requires token via:
    - `x-export-token` header, or
    - `?token=<...>` query param.

## Local Testing

1. Set environment variables:
   - `EMAIL_SINK=log` or `EMAIL_SINK=file`
   - `ALERT_EXPORT_TOKEN=<strong-secret>` (for export testing)
2. Start dev server and submit any alerts form.
3. Verify behavior:
   - `log`: check server logs for JSON signup lines.
   - `file`: confirm `.data/alert-signups.jsonl` grows.

## Export Usage

With `EMAIL_SINK=file` and a valid `ALERT_EXPORT_TOKEN`:

- Header-based:
  - `curl -H "x-export-token: <token>" http://localhost:3000/api/alerts/export`
- Query-based:
  - `http://localhost:3000/api/alerts/export?token=<token>`

CSV columns:

- `createdAt,email,area,state,region,frequency,topics`

## Security Notes

- Do **not** expose `ALERT_EXPORT_TOKEN` in client-side code.
- Use server-side secret management for production.
- Do not store raw IP addresses unless you explicitly need and document that behavior.

## Production Persistence Note

File-based sinks are often unreliable on serverless/ephemeral filesystems.
For production, prefer:

- `EMAIL_SINK=log` (temporary), or
- a future managed persistence layer (database/queue/object storage).
