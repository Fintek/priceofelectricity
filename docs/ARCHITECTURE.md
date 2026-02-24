# Architecture Overview

## Data Model
- State data is defined in `src/data/states.ts`.
- Each state uses the `StateRecord` type from `src/data/types.ts`.
- `STATES` is the canonical map keyed by canonical slug.
- `STATE_LIST` is derived from `STATES` and sorted by state name.

## Slug Rules
- Canonical slugs are lowercase and hyphenated (example: `new-jersey`).
- Slug normalization lives in `src/data/slug.ts` (`normalizeSlug`).
- Use canonical slugs for links, routes, sitemap URLs, and metadata canonicals.

## Editing Electricity Rates
- Update rates only in `src/data/states.ts`.
- Keep `avgRateCentsPerKwh` numeric and `updated` consistent across entries.
- Keep the `slug` field aligned with the object key for each record.

## Routing
- Home page (`src/app/page.tsx`) renders links from `STATE_LIST`.
- State page (`src/app/[state]/page.tsx`) normalizes route params and looks up `STATES`.
- Unknown slugs should return `notFound()` (real 404).

## Extension Points
### Utilities

### Providers

### City Pages

### Editorial/Content Pages
