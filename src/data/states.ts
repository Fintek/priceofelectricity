import type { StateRecord } from "@/data/types";
import { RAW_STATES } from "@/data/raw/states.raw";

// Compatibility export for existing app routes/components.
export const STATES: Record<string, StateRecord> = RAW_STATES;

export const STATE_LIST: StateRecord[] = Object.values(STATES).sort((a, b) =>
  a.name.localeCompare(b.name)
);