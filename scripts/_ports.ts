import { spawnSync } from "node:child_process";

function commandExists(command: string): boolean {
  const checker = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(checker, [command], {
    stdio: "ignore",
  });
  return result.status === 0;
}

function parseWindowsListeningPids(port: number): number[] {
  const result = spawnSync("netstat", ["-ano", "-p", "tcp"], {
    encoding: "utf8",
  });
  if (result.status !== 0 || !result.stdout) return [];

  const lines = result.stdout.split(/\r?\n/);
  const pids = new Set<number>();
  const portPattern = new RegExp(`:${port}\\s`);

  for (const line of lines) {
    if (!line.includes("LISTENING")) continue;
    if (!portPattern.test(line)) continue;

    const tokens = line.trim().split(/\s+/);
    const pidToken = tokens[tokens.length - 1];
    const pid = Number(pidToken);
    if (Number.isInteger(pid) && pid > 0) {
      pids.add(pid);
    }
  }

  return [...pids];
}

function parseUnixPidsFromOutput(output: string): number[] {
  return output
    .split(/\r?\n/)
    .map((line) => Number(line.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
}

function getUnixListeningPids(port: number): number[] {
  if (commandExists("lsof")) {
    const lsof = spawnSync("lsof", ["-ti", `:${port}`], {
      encoding: "utf8",
    });
    if (lsof.status === 0 && lsof.stdout) {
      return parseUnixPidsFromOutput(lsof.stdout);
    }
  }

  if (commandExists("fuser")) {
    const fuser = spawnSync("fuser", ["-n", "tcp", String(port)], {
      encoding: "utf8",
    });
    if (fuser.status === 0) {
      const combined = `${fuser.stdout ?? ""} ${fuser.stderr ?? ""}`.trim();
      const pids = combined
        .split(/\s+/)
        .map((token) => Number(token.replace(/[^\d]/g, "")))
        .filter((n) => Number.isInteger(n) && n > 0);
      return pids;
    }
  }

  return [];
}

function killPid(pid: number): void {
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(pid), "/F"], {
      stdio: "ignore",
    });
    return;
  }
  spawnSync("kill", ["-9", String(pid)], { stdio: "ignore" });
}

export async function freePort(port: number): Promise<void> {
  try {
    const pids =
      process.platform === "win32"
        ? parseWindowsListeningPids(port)
        : getUnixListeningPids(port);

    if (pids.length === 0) {
      return;
    }

    console.log(`[ports] Releasing port ${port} (pid: ${pids.join(", ")})`);
    for (const pid of pids) {
      killPid(pid);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[ports] Warning: unable to free port ${port}: ${message}`);
  }
}
