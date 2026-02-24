# Observability

Lightweight structured logging and request tracing for production diagnostics. No external services required.

## Log levels

| Level   | Severity | Description                                |
|---------|----------|--------------------------------------------|
| `debug` | 0        | Verbose details for local development      |
| `info`  | 1        | Normal operations (requests, signups)      |
| `warn`  | 2        | Validation failures, bad input             |
| `error` | 3        | Unexpected errors, outbound fetch failures |

The logger (`src/lib/logger.ts`) outputs single-line JSON to stdout (info/debug) or stderr (warn/error).

Each entry includes:

```json
{
  "level": "info",
  "message": "api/v1/states success",
  "timestamp": "2026-02-24T12:00:00.000Z",
  "commit": "7a2917a",
  "requestId": "abc-123",
  "route": "/api/v1/states"
}
```

## Controlling verbosity

Set the `LOG_LEVEL` environment variable:

```bash
# Only show warnings and errors
LOG_LEVEL=error npm run start

# Full debug output (default in dev)
LOG_LEVEL=debug npm run dev
```

Defaults:
- **Development**: `debug`
- **Production**: `info`

## Request ID tracing

Every `/api/*` request receives an `x-request-id` header:

1. Middleware checks for an existing `x-request-id` on the incoming request (e.g. from a load balancer).
2. If none exists, it generates one via `crypto.randomUUID()`.
3. The ID is forwarded to the API route handler and included in the response headers.
4. All log entries from that request include `requestId`.

This lets you correlate logs for a single request across multiple log lines.

## Where logs appear

Logs go to **stdout/stderr** and are picked up by your hosting provider's log viewer:

- **Vercel**: Functions tab → select function → view logs
- **Docker/self-hosted**: `docker logs <container>`
- **Local development**: directly in your terminal

## Email masking

Alert signup logs never contain raw email addresses. Emails are masked as:

```
jo***@example.com
```

The `maskEmail()` helper is available from `src/lib/logger.ts`.

## Error boundary

`src/app/error.tsx` catches unhandled React render errors and:

1. Shows a clean, generic error page to the user (no stack traces or internals).
2. Posts a minimal error report to `/api/_error-report`, which logs it server-side with level `error`.

## Logged routes

| Route                      | Success | Validation failure | Exception |
|----------------------------|---------|-------------------|-----------|
| `/api/v1/states`           | info    | —                 | —         |
| `/api/v1/state/[slug]`     | info    | warn (404)        | —         |
| `/api/alerts/signup`       | info    | warn (400)        | —         |
| `/api/indexnow`            | info    | warn (400/401)    | error     |
| `/health`                  | debug   | —                 | —         |
| Error boundary             | —       | —                 | error     |

## Why no external provider (yet)

Structured JSON to stdout is the universal starting point:

- Zero dependencies and zero cost.
- Compatible with any log aggregator (Datadog, Loki, CloudWatch) via stdout ingestion.
- When the project outgrows stdout-only, add a transport layer in `logger.ts` without changing call sites.
