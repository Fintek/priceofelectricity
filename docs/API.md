# Content API

Machine-readable JSON endpoints for states and compare data.

Base URL: `https://priceofelectricity.com`

## Caching

All endpoints return:

- `Content-Type: application/json; charset=utf-8`
- `Cache-Control: public, max-age=0, s-maxage=86400, stale-while-revalidate=604800`

## Endpoints

### `GET /api/states.json`

Returns all states sorted alphabetically by state name.

Each item includes:

- `slug`
- `name`
- `postal`
- `avgRateCentsPerKwh`
- `updated`
- `sourceName`
- `sourceUrl`

Example:

```json
[
  {
    "slug": "alabama",
    "name": "Alabama",
    "postal": "AL",
    "avgRateCentsPerKwh": 16.55,
    "updated": "February 2026",
    "sourceName": "PowerOutage.us",
    "sourceUrl": "https://poweroutage.us/electricity-rates"
  }
]
```

### `GET /api/state/{slug}.json`

Returns details for one state.

- Slug is normalized using the same rule as app pages.
- If not found, returns HTTP `404` with:

```json
{ "error": "not_found" }
```

Response fields:

- `slug`
- `name`
- `postal`
- `avgRateCentsPerKwh`
- `updated`
- `methodology`
- `disclaimer`
- `sourceName`
- `sourceUrl`
- `examples` (energy-only bill examples for 500, 1000, 1500 kWh)

Example:

```json
{
  "slug": "texas",
  "name": "Texas",
  "postal": "TX",
  "avgRateCentsPerKwh": 15.83,
  "updated": "February 2026",
  "methodology": "...",
  "disclaimer": "...",
  "sourceName": "PowerOutage.us",
  "sourceUrl": "https://poweroutage.us/electricity-rates",
  "examples": [
    { "kwh": 500, "dollars": 79.15 },
    { "kwh": 1000, "dollars": 158.3 },
    { "kwh": 1500, "dollars": 237.45 }
  ]
}
```

### `GET /api/compare.json?sort=high|low|alpha`

Returns data for compare table consumers.

Sort behavior:

- `high` (default): highest `avgRateCentsPerKwh` first
- `low`: lowest first
- `alpha`: alphabetical by state name

Each item includes:

- `slug`
- `name`
- `avgRateCentsPerKwh`
- `exampleBill1000`

Example:

```json
[
  {
    "slug": "hawaii",
    "name": "Hawaii",
    "avgRateCentsPerKwh": 41.3,
    "exampleBill1000": 413
  }
]
```
