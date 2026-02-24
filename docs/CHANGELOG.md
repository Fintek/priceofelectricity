# Changelog

This changelog tracks user-facing and data-release changes for deploys.

## Workflow

Before deployment:

1. Add bullet points under `## Unreleased`.
2. Run `npm run release:gen` to refresh `public/release.json`.
3. Run `npm run verify`.
4. Move `## Unreleased` notes into a dated section (`## YYYY-MM-DD`) and clear `Unreleased`.

Use concise bullets focused on what changed and why it matters.

## Unreleased

- (empty)

## 2026-02-24

- Added release metadata generation (`public/release.json`) with commit, build time, data version, node version, and app version.
- Updated `/status` and `/health` to expose release and data-version traceability.
