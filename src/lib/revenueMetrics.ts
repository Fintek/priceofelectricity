import { appendFile, mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { log } from "@/lib/logger";

export type RevenueEventType =
  | "offer_impression"
  | "offer_click"
  | "alert_submit";

type RevenueEventMeta = {
  state?: string;
  offerId?: string;
};

type RevenueEntry = {
  ts: string;
  type: RevenueEventType;
  state?: string;
  offerId?: string;
};

const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(STORE_DIR, "revenue-events.jsonl");

export function recordRevenueEvent(
  type: RevenueEventType,
  meta: RevenueEventMeta,
): void {
  try {
    const entry: RevenueEntry = {
      ts: new Date().toISOString(),
      type,
      ...(meta.state ? { state: meta.state } : {}),
      ...(meta.offerId ? { offerId: meta.offerId } : {}),
    };

    log("info", "revenue_event", { name: type, ...meta });

    const line = JSON.stringify(entry) + "\n";
    mkdir(STORE_DIR, { recursive: true })
      .then(() => appendFile(STORE_PATH, line, "utf8"))
      .catch(() => {});
  } catch {
    // Never throw from instrumentation.
  }
}

export type RevenueSummary = {
  impressions: number;
  clicks: number;
  signups: number;
  ctr: number;
  signupRate: number;
  topStates: { state: string; impressions: number; clicks: number }[];
};

const EMPTY_SUMMARY: RevenueSummary = {
  impressions: 0,
  clicks: 0,
  signups: 0,
  ctr: 0,
  signupRate: 0,
  topStates: [],
};

export async function getRevenueSummary(): Promise<RevenueSummary> {
  try {
    const info = await stat(STORE_PATH);
    if (info.size === 0) return EMPTY_SUMMARY;

    const raw = await readFile(STORE_PATH, "utf8");
    const lines = raw.trim().split("\n").filter(Boolean);

    let impressions = 0;
    let clicks = 0;
    let signups = 0;
    const stateMap = new Map<
      string,
      { impressions: number; clicks: number }
    >();

    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as RevenueEntry;
        if (entry.type === "offer_impression") {
          impressions++;
          if (entry.state) {
            const s = stateMap.get(entry.state) ?? { impressions: 0, clicks: 0 };
            s.impressions++;
            stateMap.set(entry.state, s);
          }
        } else if (entry.type === "offer_click") {
          clicks++;
          if (entry.state) {
            const s = stateMap.get(entry.state) ?? { impressions: 0, clicks: 0 };
            s.clicks++;
            stateMap.set(entry.state, s);
          }
        } else if (entry.type === "alert_submit") {
          signups++;
        }
      } catch {
        // Skip malformed lines.
      }
    }

    const ctr = impressions > 0 ? clicks / impressions : 0;
    const signupRate = impressions > 0 ? signups / impressions : 0;

    const topStates = [...stateMap.entries()]
      .map(([state, counts]) => ({ state, ...counts }))
      .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)
      .slice(0, 10);

    return { impressions, clicks, signups, ctr, signupRate, topStates };
  } catch {
    return EMPTY_SUMMARY;
  }
}
