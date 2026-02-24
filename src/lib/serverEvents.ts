import { log } from "@/lib/logger";
import type { EventName, EventPayloads } from "@/lib/events";

/**
 * Server-safe event emission. Logs via structured logger.
 * Must only be imported from server components or API routes.
 */
export function emitServerEvent<N extends EventName>(
  name: N,
  payload: EventPayloads[N],
): void {
  try {
    log("info", "event", { name, ...(payload as Record<string, unknown>) });
  } catch {
    // Never throw from event logging.
  }
}
