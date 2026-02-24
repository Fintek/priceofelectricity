# CI and Quality Gates

This project uses a single verification command as the deployment gate.

## Verify Command

Run all checks locally:

```bash
npm run verify
```

`verify` runs the following in order:

1. `npm run data:validate` - validates all raw state inputs
2. `npm run lint` - runs ESLint with Next.js rules
3. `npm run typecheck` - runs TypeScript compile checks (`tsc --noEmit`)
4. `npm run build` - confirms the production Next.js build succeeds

If any step fails, `verify` stops immediately and exits non-zero.

## CI Workflow

GitHub Actions workflow file:

- `.github/workflows/ci.yml`

It runs on:

- `push`
- `pull_request`

Workflow steps:

1. Checkout repository
2. Setup Node.js 20 with npm cache
3. Install with `npm ci`
4. Run `npm run verify`

## Interpreting Failures

- **data:validate failure**: raw data format/value issue in `src/data/raw/states.raw.ts`
- **lint failure**: style or rules issue in source files
- **typecheck failure**: TypeScript type error
- **build failure**: runtime/build-time incompatibility in app code

Fix the first failing step, then re-run:

```bash
npm run verify
```

## Adding More Checks Later

To add more quality gates:

1. Add a new script in `package.json`
2. Append it to `verify` in the right order
3. Keep fast-fail behavior (`&&`) so CI stops on first error

## Pre-Push Recommendation

No pre-commit tooling is required. As a lightweight practice, run this before pushing:

```bash
npm run verify
```
