# Content Integrity Check

The integrity check is a lightweight guardrail for programmatic content at scale.

It validates the content graph structure first, then validates real HTTP routes from both the content registry and sitemap.

## What It Checks

`npm run integrity` performs the following:

1. **Registry structure checks** (no server required)
   - No duplicate `node.id`
   - No duplicate `node.url`
   - URL format sanity (`/path` or `https://...`)
   - `parent` references must point to existing node IDs
   - `related` references must point to existing node IDs

2. **Registry URL HTTP checks** (with local production server)
   - Starts `next start` on a random free port
   - Fetches each internal registry URL
   - Requires final HTTP `200` after redirects
   - Fails on `404` and `5xx`

3. **Sitemap URL HTTP checks**
   - Fetches `/sitemap.xml`
   - Extracts `<loc>` URLs
   - Rewrites `https://priceofelectricity.com` URLs to local server URLs
   - Requires final HTTP `200` after redirects

4. **Optional hub-link sanity checks**
   - Scans a few key hubs for `href="/..."` links
   - Verifies those links resolve locally

## Why It Matters

As routes scale programmatically, regressions can come from:

- Slug mismatches
- Missing generated routes
- Broken parent/related references
- Sitemap drift from real routes
- Internal links pointing to removed pages

This check catches those issues before deployment.

## How To Run

Run build first, then integrity:

```bash
npm run build
npm run integrity
```

Or run the full pipeline:

```bash
npm run verify
```

## Common Failure Fixes

- **Missing route (404)**  
  Ensure the route exists and is generated (check `generateStaticParams`, slug guards, and data source entries).

- **Registry parent/related reference error**  
  Fix invalid IDs in `buildContentRegistry()` (typos, removed nodes, stale references).

- **Sitemap URL fails**  
  Ensure `src/app/sitemap.ts` matches real routes and generated pages.

- **Wrong slug format**  
  Normalize slug generation across data sources and route params.

## Runtime Notes

- Designed for CI and local runs on Windows/Linux.
- Uses Node + `fetch`; no browser automation dependencies.
- Always attempts to stop the local server process, even on failure.
