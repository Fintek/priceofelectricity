# Security Hardening

Lightweight security layer for API routes. No external dependencies or services.

## Rate Limiting

### Design

In-memory rate limiting using a global `Map` in `src/lib/rateLimiter.ts`. Enforced in `middleware.ts` so it applies uniformly to all requests, including statically-generated API routes.

### Limits

| Route                  | Window     | Max Requests |
|------------------------|------------|-------------|
| `/api/v1/states`       | 1 minute   | 60          |
| `/api/v1/state/[slug]` | 1 minute   | 60          |
| `/api/alerts/signup`   | 10 minutes | 5           |
| `/api/indexnow`        | 1 hour     | 10          |

Keys are scoped by route + client IP (`x-forwarded-for` or `x-real-ip`).

### Response when limited

```
HTTP 429 Too Many Requests
Retry-After: <seconds>

{ "ok": false, "error": "rate_limited" }
```

### Limitations

- **Memory-only**: counters reset on server restart or redeployment.
- **Single-instance**: each server process has its own counter map. If running multiple instances behind a load balancer, a client could exceed the intended limit by distributing requests across instances.
- **IP-based**: clients behind shared NATs or proxies share the same counter.
- Expired entries are cleaned up lazily (every 60 seconds).

### Production recommendation

For production at scale, consider:

- **Edge rate limiting** (e.g. Vercel Edge Middleware with KV, Cloudflare Rate Limiting)
- **Redis-backed counters** for multi-instance consistency
- **Token bucket** algorithm for smoother rate enforcement

The current implementation is intentionally simple and dependency-free.

## Signup Abuse Protection

The `/api/alerts/signup` route includes additional input validation beyond standard field checks:

| Check                          | Limit | Error code          |
|--------------------------------|-------|---------------------|
| Email length                   | 254   | `email_too_long`    |
| `+` signs in email             | > 3   | `email_suspicious`  |
| Topics array size              | > 10  | `too_many_topics`   |
| Frequency value                | must be `weekly` or `monthly` | `invalid_frequency` |

These checks run before the standard email/area/state validation. All inputs are trimmed before validation.

Emails are never logged in full; `maskEmail()` redacts to `jo***@example.com`.

## Bot Filtering

Applied in middleware for `/api/*` routes only. Conservative rules:

| Pattern                                    | Action |
|--------------------------------------------|--------|
| User-Agent contains `python-requests`      | 403    |
| User-Agent contains `scrapy`               | 403    |
| User-Agent contains `curl/` AND no `x-request-id` header | 403 |
| Missing User-Agent                         | Allowed (some legitimate clients omit it) |

Normal search engine crawlers are **not** blocked on page routes.

## Security Headers

Applied to all routes via middleware:

| Header                      | Value                                          |
|-----------------------------|-------------------------------------------------|
| `X-Content-Type-Options`    | `nosniff`                                       |
| `X-Frame-Options`           | `DENY`                                          |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`               |
| `Permissions-Policy`        | `geolocation=(), microphone=(), camera=()`      |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload`  |

HSTS is only added when `NODE_ENV === "production"` to avoid issues with local HTTP development.

Headers are set only if not already present, so they won't override values set by hosting providers or route handlers.

## Request ID Tracing

Every `/api/*` request receives an `x-request-id` header (generated via `crypto.randomUUID()` or preserved from the incoming request). This ID appears in:

- Response headers
- Structured log entries
- Rate limit warnings
