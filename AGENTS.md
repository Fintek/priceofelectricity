# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

PriceOfElectricity.com is a Next.js 16 (App Router) static-content-heavy website providing US electricity pricing data, state comparisons, calculators, and energy insights. It uses file-based data (no database), Tailwind CSS 4, and deploys to Vercel.

### Development commands

Standard commands are in `package.json`:

- `npm run dev` — Start dev server on localhost:3000
- `npm run lint` — ESLint (warnings expected for unused vars in some route files)
- `npm run typecheck` — TypeScript type checking
- `npm run build` — Full build (includes `release:gen`, `knowledge:build`, `knowledge:verify`, then `next build`)
- `npm run data:validate` — Validate all 50 state data files
- `npm run knowledge:build` — Build knowledge artifacts to `public/knowledge/`
- `npm run knowledge:verify` — Verify knowledge artifact integrity

### Key gotchas

- **Node.js 20 required.** The project uses `@types/node: ^20` and Next.js 16.1.6. Use nvm to ensure correct version.
- **No external services needed for dev.** All data is committed to the repo as TypeScript/JSON/CSV files. No database, no Docker.
- **The `electricity-cost-calculator` page** may show a 500 error in dev mode due to dynamic route params — this is a known pre-existing issue and not a blocker.
- **Knowledge artifacts must be built before a production build.** Run `npm run knowledge:build && npm run knowledge:verify` if you get missing file errors during `next build`.
- **Lint has 4 persistent warnings** (unused vars in route files) — these are not errors and do not block CI.
- **EIA API key** (`EIA_API_KEY`) is only required for the monthly data refresh scripts (`data:update:eia:res`). Not needed for normal development.
- **Environment variables** are optional for local dev. The app falls back to `http://localhost:3000` defaults.

### Routes

The app uses `[state]` as a top-level dynamic route (e.g., `/texas`, `/california`). State electricity pages are at `/<state-slug>`, not `/electricity-prices/<state>`.
