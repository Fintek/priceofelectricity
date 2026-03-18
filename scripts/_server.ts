import { createServer } from "node:net";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { freePort } from "./_ports";

export const STARTUP_TIMEOUT_MS = 30_000;
export const REQUEST_TIMEOUT_MS = 10_000;
export const PREFERRED_TEST_PORT = 3005;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to determine free port"));
        return;
      }
      const port = address.port;
      server.close((err) => {
        if (err) reject(err);
        else resolve(port);
      });
    });
  });
}

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolve(true));
    });
  });
}

export async function resolveTestPort(
  preferredPort: number = PREFERRED_TEST_PORT
): Promise<number> {
  await freePort(preferredPort);
  if (await isPortAvailable(preferredPort)) {
    return preferredPort;
  }

  const fallbackPort = await getFreePort();
  console.warn(
    `[server] Preferred port ${preferredPort} unavailable; using fallback ${fallbackPort}`
  );
  return fallbackPort;
}

function getNpmCommand(): string {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

export function startNextServer(port: number): ChildProcess {
  const npmCmd = getNpmCommand();
  console.log(`[server] Starting production server at http://127.0.0.1:${port}`);
  if (process.platform === "win32") {
    return spawn("cmd.exe", ["/d", "/s", "/c", `${npmCmd} run start -- -p ${port}`], {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "production" },
    });
  }
  return spawn(npmCmd, ["run", "start", "--", "-p", String(port)], {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NODE_ENV: "production" },
  });
}

export async function stopServer(proc: ChildProcess): Promise<void> {
  if (!proc.pid) return;

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(proc.pid), "/T", "/F"], {
      stdio: "ignore",
    });
    return;
  }

  proc.kill("SIGTERM");
  await Promise.race([
    new Promise<void>((resolve) => {
      proc.once("exit", () => resolve());
    }),
    sleep(2_000),
  ]);
  if (!proc.killed) {
    proc.kill("SIGKILL");
  }
}

export async function fetchWithTimeout(
  url: string,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal, redirect: "follow" });
  } finally {
    clearTimeout(timeout);
  }
}

export async function waitForServerReady(baseUrl: string): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < STARTUP_TIMEOUT_MS) {
    try {
      const res = await fetchWithTimeout(`${baseUrl}/`);
      if (res.ok) return;
    } catch {
      // Keep polling until timeout.
    }
    await sleep(500);
  }
  throw new Error("Timed out waiting for server to be ready");
}
