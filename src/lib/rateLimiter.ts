export type RateLimitOptions = {
  windowMs: number;
  max: number;
};

type Entry = {
  count: number;
  expires: number;
};

const store = new Map<string, Entry>();

const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.expires <= now) store.delete(key);
  }
}

export function rateLimit(
  key: string,
  options: RateLimitOptions,
): { allowed: boolean; remaining: number } {
  try {
    cleanup();

    const now = Date.now();
    const existing = store.get(key);

    if (!existing || existing.expires <= now) {
      store.set(key, { count: 1, expires: now + options.windowMs });
      return { allowed: true, remaining: options.max - 1 };
    }

    existing.count++;

    if (existing.count > options.max) {
      return { allowed: false, remaining: 0 };
    }

    return { allowed: true, remaining: options.max - existing.count };
  } catch {
    return { allowed: true, remaining: options.max };
  }
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
