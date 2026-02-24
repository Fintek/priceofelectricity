import { readFileSync } from "node:fs";
import { join } from "node:path";

export type LogLevel = "debug" | "info" | "warn" | "error";

const SEVERITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let cachedCommit: string | undefined;

function getCommit(): string {
  if (cachedCommit !== undefined) return cachedCommit;
  try {
    const raw = readFileSync(join(process.cwd(), "public", "release.json"), "utf8");
    const parsed = JSON.parse(raw) as { commit?: string };
    cachedCommit = typeof parsed.commit === "string" ? parsed.commit : "";
  } catch {
    cachedCommit = "";
  }
  return cachedCommit;
}

function resolveMinLevel(): LogLevel {
  const env = process.env.LOG_LEVEL?.toLowerCase();
  if (env && env in SEVERITY) return env as LogLevel;
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

export function log(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>,
): void {
  try {
    if (SEVERITY[level] < SEVERITY[resolveMinLevel()]) return;

    const entry: Record<string, unknown> = {
      level,
      message,
      timestamp: new Date().toISOString(),
    };

    const commit = getCommit();
    if (commit) entry.commit = commit;

    if (meta) {
      for (const [k, v] of Object.entries(meta)) {
        if (!(k in entry)) entry[k] = v;
      }
    }

    const line = JSON.stringify(entry);

    if (level === "error") {
      process.stderr.write(line + "\n");
    } else if (level === "warn") {
      process.stderr.write(line + "\n");
    } else {
      process.stdout.write(line + "\n");
    }
  } catch {
    // Never throw from logger.
  }
}

export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at < 0) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***${domain}`;
}

export function getRequestId(request: Request): string {
  return request.headers.get("x-request-id") ?? "";
}
