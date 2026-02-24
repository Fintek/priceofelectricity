# Analytics Events

This project uses a lightweight, provider-agnostic event emitter at `src/lib/events.ts`.
No new analytics provider was added.

## Event names

- `alert_submit`
- `offer_click`
- `data_download_click`
- `knowledge_view`

## Payload schema

### `alert_submit`

```ts
{
  area: "regulatory" | "ai-energy" | "state";
  state?: string;
  frequency?: string;
  topics?: string[];
}
```

### `offer_click`

```ts
{
  offerId: string;
  state?: string;
  category?: string;
}
```

### `data_download_click`

```ts
{
  dataset: string;
}
```

### `knowledge_view`

```ts
{
  format: "page" | "json";
}
```

## Where events are fired

- `alert_submit`
  - `src/app/alerts/confirm/AlertSubmitEmit.tsx`
  - Fired once on mount using query params from `/alerts/confirm`.

- `offer_click`
  - `src/app/offers/page.tsx`
  - `src/app/offers/[state]/page.tsx`
  - Fired via `TrackLink` before navigation to `/out/[offerId]`.

- `data_download_click`
  - `src/app/datasets/page.tsx`
  - Fired via `TrackLink` on dataset download links.

- `knowledge_view`
  - `src/app/knowledge/KnowledgeViewEmitter.tsx`
  - Fires once on mount for `/knowledge` page views.

## Emitter behavior

`emitEvent(name, payload)` is intentionally safe:

- SSR-safe: no-op when `window` is unavailable
- No-throw: catches runtime errors
- Provider order:
  1. `window.gtag("event", name, payload)` if available
  2. `window.posthog.capture(name, payload)` if available
  3. no-op otherwise
