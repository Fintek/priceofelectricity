export type MonthlyRate = { ym: string; avgRateCentsPerKwh: number };

export type StateHistory = {
  stateSlug: string;
  series: MonthlyRate[];
  updated: string;
  sourceName?: string;
  sourceUrl?: string;
};

export const HISTORY: StateHistory[] = [
  {
    stateSlug: "texas",
    series: [
      { ym: "2025-03", avgRateCentsPerKwh: 15.1 },
      { ym: "2025-04", avgRateCentsPerKwh: 15.0 },
      { ym: "2025-05", avgRateCentsPerKwh: 15.2 },
      { ym: "2025-06", avgRateCentsPerKwh: 15.3 },
      { ym: "2025-07", avgRateCentsPerKwh: 15.5 },
      { ym: "2025-08", avgRateCentsPerKwh: 15.6 },
      { ym: "2025-09", avgRateCentsPerKwh: 15.4 },
      { ym: "2025-10", avgRateCentsPerKwh: 15.5 },
      { ym: "2025-11", avgRateCentsPerKwh: 15.6 },
      { ym: "2025-12", avgRateCentsPerKwh: 15.7 },
      { ym: "2026-01", avgRateCentsPerKwh: 15.8 },
      { ym: "2026-02", avgRateCentsPerKwh: 15.83 },
    ],
    updated: "February 2026",
    sourceName: "History TBD (manual MVP)",
    sourceUrl: "/about",
  },
  {
    stateSlug: "california",
    series: [
      { ym: "2025-03", avgRateCentsPerKwh: 29.7 },
      { ym: "2025-04", avgRateCentsPerKwh: 29.9 },
      { ym: "2025-05", avgRateCentsPerKwh: 30.1 },
      { ym: "2025-06", avgRateCentsPerKwh: 30.3 },
      { ym: "2025-07", avgRateCentsPerKwh: 30.6 },
      { ym: "2025-08", avgRateCentsPerKwh: 30.7 },
      { ym: "2025-09", avgRateCentsPerKwh: 30.8 },
      { ym: "2025-10", avgRateCentsPerKwh: 30.9 },
      { ym: "2025-11", avgRateCentsPerKwh: 31.0 },
      { ym: "2025-12", avgRateCentsPerKwh: 31.05 },
      { ym: "2026-01", avgRateCentsPerKwh: 31.1 },
      { ym: "2026-02", avgRateCentsPerKwh: 31.14 },
    ],
    updated: "February 2026",
    sourceName: "History TBD (manual MVP)",
    sourceUrl: "/about",
  },
  {
    stateSlug: "florida",
    series: [
      { ym: "2025-03", avgRateCentsPerKwh: 14.8 },
      { ym: "2025-04", avgRateCentsPerKwh: 14.9 },
      { ym: "2025-05", avgRateCentsPerKwh: 15.0 },
      { ym: "2025-06", avgRateCentsPerKwh: 15.1 },
      { ym: "2025-07", avgRateCentsPerKwh: 15.2 },
      { ym: "2025-08", avgRateCentsPerKwh: 15.25 },
      { ym: "2025-09", avgRateCentsPerKwh: 15.3 },
      { ym: "2025-10", avgRateCentsPerKwh: 15.2 },
      { ym: "2025-11", avgRateCentsPerKwh: 15.22 },
      { ym: "2025-12", avgRateCentsPerKwh: 15.24 },
      { ym: "2026-01", avgRateCentsPerKwh: 15.26 },
      { ym: "2026-02", avgRateCentsPerKwh: 15.27 },
    ],
    updated: "February 2026",
    sourceName: "History TBD (manual MVP)",
    sourceUrl: "/about",
  },
  {
    stateSlug: "new-york",
    series: [
      { ym: "2025-03", avgRateCentsPerKwh: 22.9 },
      { ym: "2025-04", avgRateCentsPerKwh: 23.0 },
      { ym: "2025-05", avgRateCentsPerKwh: 23.1 },
      { ym: "2025-06", avgRateCentsPerKwh: 23.2 },
      { ym: "2025-07", avgRateCentsPerKwh: 23.4 },
      { ym: "2025-08", avgRateCentsPerKwh: 23.5 },
      { ym: "2025-09", avgRateCentsPerKwh: 23.6 },
      { ym: "2025-10", avgRateCentsPerKwh: 23.7 },
      { ym: "2025-11", avgRateCentsPerKwh: 23.75 },
      { ym: "2025-12", avgRateCentsPerKwh: 23.8 },
      { ym: "2026-01", avgRateCentsPerKwh: 23.84 },
      { ym: "2026-02", avgRateCentsPerKwh: 23.87 },
    ],
    updated: "February 2026",
    sourceName: "History TBD (manual MVP)",
    sourceUrl: "/about",
  },
  {
    stateSlug: "massachusetts",
    series: [
      { ym: "2025-03", avgRateCentsPerKwh: 25.0 },
      { ym: "2025-04", avgRateCentsPerKwh: 25.1 },
      { ym: "2025-05", avgRateCentsPerKwh: 25.2 },
      { ym: "2025-06", avgRateCentsPerKwh: 25.3 },
      { ym: "2025-07", avgRateCentsPerKwh: 25.4 },
      { ym: "2025-08", avgRateCentsPerKwh: 25.55 },
      { ym: "2025-09", avgRateCentsPerKwh: 25.7 },
      { ym: "2025-10", avgRateCentsPerKwh: 25.8 },
      { ym: "2025-11", avgRateCentsPerKwh: 25.85 },
      { ym: "2025-12", avgRateCentsPerKwh: 25.9 },
      { ym: "2026-01", avgRateCentsPerKwh: 25.95 },
      { ym: "2026-02", avgRateCentsPerKwh: 26.01 },
    ],
    updated: "February 2026",
    sourceName: "History TBD (manual MVP)",
    sourceUrl: "/about",
  },
  {
    stateSlug: "illinois",
    series: [
      { ym: "2025-03", avgRateCentsPerKwh: 16.5 },
      { ym: "2025-04", avgRateCentsPerKwh: 16.45 },
      { ym: "2025-05", avgRateCentsPerKwh: 16.4 },
      { ym: "2025-06", avgRateCentsPerKwh: 16.5 },
      { ym: "2025-07", avgRateCentsPerKwh: 16.6 },
      { ym: "2025-08", avgRateCentsPerKwh: 16.7 },
      { ym: "2025-09", avgRateCentsPerKwh: 16.75 },
      { ym: "2025-10", avgRateCentsPerKwh: 16.8 },
      { ym: "2025-11", avgRateCentsPerKwh: 16.85 },
      { ym: "2025-12", avgRateCentsPerKwh: 16.9 },
      { ym: "2026-01", avgRateCentsPerKwh: 16.93 },
      { ym: "2026-02", avgRateCentsPerKwh: 16.96 },
    ],
    updated: "February 2026",
    sourceName: "History TBD (manual MVP)",
    sourceUrl: "/about",
  },
];

export const HISTORY_BY_STATE: Record<string, StateHistory> = Object.fromEntries(
  HISTORY.map((entry) => [entry.stateSlug, entry])
) as Record<string, StateHistory>;
