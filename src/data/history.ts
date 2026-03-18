import { readFileSync } from "node:fs";
import path from "node:path";

export type MonthlyRate = { ym: string; avgRateCentsPerKwh: number };

export type StateHistory = {
  stateSlug: string;
  series: MonthlyRate[];
  updated: string;
  sourceName?: string;
  sourceUrl?: string;
};

let cachedHistory: StateHistory[] | null = null;
let cachedHistoryByState: Record<string, StateHistory> | null = null;

function loadHistoryFromGeneratedJson(): StateHistory[] {
  if (cachedHistory) return cachedHistory;

  const sourcePath = path.join(process.cwd(), "src", "data", "history.generated.json");
  const raw = readFileSync(sourcePath, "utf8");
  const parsed = JSON.parse(raw) as StateHistory[];
  cachedHistory = parsed;
  return parsed;
}

export const HISTORY: StateHistory[] = loadHistoryFromGeneratedJson();

export const HISTORY_BY_STATE: Record<string, StateHistory> = (() => {
  if (cachedHistoryByState) return cachedHistoryByState;
  const byState = Object.fromEntries(HISTORY.map((entry) => [entry.stateSlug, entry])) as Record<string, StateHistory>;
  cachedHistoryByState = byState;
  return byState;
})();
