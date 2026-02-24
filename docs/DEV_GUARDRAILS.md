# Dev Guardrails

This project includes guardrails to reduce local workflow failures caused by:

- orphaned Node processes
- port conflicts
- false `ERR_CONNECTION_REFUSED` moments when no app is running
- test scripts stepping on each other

## Port strategy

- Development server: `3000` (`npm run dev`)
- Scripted production checks (`smoke`, `integrity`, `api:contract`): `3005`

All scripted checks use the shared server helper in `scripts/_server.ts`, which:

1. calls `freePort(3005)` before booting
2. starts `next start` on `http://127.0.0.1:3005`
3. waits for readiness with HTTP polling
4. always stops the server in `finally`

If `3005` cannot be reclaimed, scripts fall back to a random free port and print a warning.

## Cross-platform port cleanup

`scripts/_ports.ts` exports:

- `freePort(port: number): Promise<void>`

Behavior:

- **Windows (`win32`)**: parses `netstat -ano -p tcp` for listeners on the exact port and runs `taskkill /PID <pid> /F`
- **macOS/Linux**: uses `lsof -ti :<port>` (or `fuser -n tcp <port>` fallback) and kills matching PIDs only
- Missing tools fail gracefully with warnings

## Use `dev:reset` when local dev gets weird

Run:

```bash
npm run dev:reset
```

This command:

1. frees ports `3000` and `3005`
2. removes `.next`
3. starts `npm run dev`

## Quick `ERR_CONNECTION_REFUSED` diagnosis

1. Confirm dev server is running:
   - `npm run dev`
2. If it still fails in browser, run:
   - `npm run dev:reset`
3. If CI-like checks fail locally, run:
   - `npm run verify`
4. If a script seems stuck on startup, check for port occupancy and stale processes:
   - rerun `npm run dev:reset` first (it performs cleanup safely)

