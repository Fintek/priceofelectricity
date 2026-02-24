# Launch Engineering Checklist

This document covers production hardening checks for launching `priceofelectricity.com`.

## Required Environment Variables

- `NEXT_PUBLIC_SITE_URL`
  - Production example: `https://priceofelectricity.com`
  - This value is used as the canonical domain source of truth.

## Canonical Domain Recommendation

- Use **non-www** as canonical: `https://priceofelectricity.com`
- Ensure redirects enforce a single domain strategy (`www` -> non-www or vice versa).
- Avoid mixed canonical domains across pages, sitemap, and metadata.

## Pre-Launch Engineering Checklist

1. `npm run verify` passes locally and in CI.
2. `npm run canonical:check` passes with the intended `NEXT_PUBLIC_SITE_URL`.
3. `robots.txt` behavior is correct:
   - Preview/dev: `Disallow: /`
   - Production: `Allow: /`
4. `https://<domain>/sitemap.xml` is reachable.
5. `https://<domain>/health` returns `{ "status": "ok", ... }`.

## Robots Behavior by Environment

- Production indexing is enabled **only** when:
  - `NODE_ENV=production`
  - `NEXT_PUBLIC_SITE_URL` is set
- In all other cases, indexing is blocked (`Disallow: /`).

## Common Pitfalls

- **Mixed www/non-www canonicals**
  - Causes duplicate indexing and fragmented ranking signals.
- **Preview builds indexed**
  - Can leak non-canonical URLs into search.
- **Localhost canonicals**
  - Usually caused by missing `NEXT_PUBLIC_SITE_URL`.
  - Catch with `npm run canonical:check`.
