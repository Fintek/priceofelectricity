# Indexing & Search Engine Submission

## Readiness check

Run the automated readiness check to verify that robots.txt, sitemap, and canonical tags are correct before submitting to search engines:

```bash
npm run indexing:check
```

This starts a production server on port 3005, fetches `/robots.txt`, `/sitemap.xml`, `/`, and `/texas`, and validates:

- `/robots.txt` includes a `Sitemap:` directive pointing to the production sitemap.
- `/sitemap.xml` returns 200 and contains at least one known state (`/texas`).
- Home and `/texas` HTML contain a `<link rel="canonical">` starting with `SITE_URL`.

The script exits non-zero if any check fails. It runs as part of `npm run verify`.

## Google Search Console (manual ops)

These steps are human-operated and not automated by this project:

1. Go to [Google Search Console](https://search.google.com/search-console) and add the property `https://priceofelectricity.com`.
2. Verify ownership via DNS TXT record, HTML file upload, or meta tag.
3. Submit the sitemap: `https://priceofelectricity.com/sitemap.xml`.
4. Monitor indexing status in the "Coverage" or "Pages" report.

## Bing IndexNow (optional, engineering-ready)

[IndexNow](https://www.indexnow.org/) lets you proactively notify Bing (and other participating engines) when URLs change.

### How it works

After a deploy, you POST a list of changed URLs to `/api/indexnow`. The server validates the request, then forwards the URL list to Bing's IndexNow endpoint.

### Configuration

IndexNow is **off by default**. To enable:

```env
INDEXNOW_ENABLED=true
INDEXNOW_KEY=<your-indexnow-key>
```

Generate a key at [indexnow.org/getStarted](https://www.indexnow.org/getstarted) or use any UUID-like string.

### Key verification file

Bing verifies key ownership by fetching `<keyLocation>`. This project serves the key at:

```
https://priceofelectricity.com/api/indexnow/key.txt
```

The route returns the key as plain text only when `INDEXNOW_KEY` is set.

### Submitting URLs

```bash
curl -X POST https://priceofelectricity.com/api/indexnow \
  -H "Content-Type: application/json" \
  -H "x-indexnow-key: YOUR_KEY_HERE" \
  -d '{"urls": ["https://priceofelectricity.com/texas", "https://priceofelectricity.com/california"]}'
```

Responses:

| Status | Meaning |
|--------|---------|
| 200    | URLs submitted to Bing |
| 400    | Invalid body or URLs don't start with SITE_URL |
| 401    | Missing or wrong `x-indexnow-key` header, or `INDEXNOW_KEY` not set |
| 409    | `INDEXNOW_ENABLED` is not `"true"` |
| 502    | Outbound fetch to Bing failed (hosting may block outbound requests) |

### Security

- The API key is never committed to the repository.
- The route requires the key in the `x-indexnow-key` header to prevent unauthorized submissions.
- When `INDEXNOW_ENABLED` is not `"true"`, the endpoint returns 409 regardless of the key.

### Bing Webmaster Tools (manual ops)

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters).
2. Add the site and verify ownership.
3. Submit the sitemap: `https://priceofelectricity.com/sitemap.xml`.
4. IndexNow submissions will appear in the "URL Submission" section.
