export type QueueItemKind = "rate-case" | "timeline-event";
export type QueueItemStatus = "new" | "reviewed" | "published" | "rejected";

export type QueueItem = {
  id: string;
  state: string;
  kind: QueueItemKind;
  discoveredDate: string;
  title: string;
  summary: string;
  sourceHint?: string;
  status: QueueItemStatus;
  notes?: string;
};

export const REGULATORY_QUEUE: QueueItem[] = [
  {
    id: "q-001",
    state: "texas",
    kind: "rate-case",
    discoveredDate: "2026-02-10",
    title: "Placeholder: Oncor rate case filing — example",
    summary:
      "Placeholder entry. A hypothetical Oncor rate case to demonstrate the queue workflow. Replace with actual docket data when available.",
    sourceHint: "PUC docket page",
    status: "new",
    notes: "Needs cross-referencing with PUC Texas docket search.",
  },
  {
    id: "q-002",
    state: "texas",
    kind: "timeline-event",
    discoveredDate: "2026-02-12",
    title: "Placeholder: ERCOT demand forecast update — example",
    summary:
      "Placeholder entry. Represents a hypothetical ERCOT seasonal demand forecast update that may signal future capacity-related rate changes.",
    sourceHint: "ERCOT seasonal outlook report",
    status: "reviewed",
    notes: "Content reviewed; needs state page link added before publishing.",
  },
  {
    id: "q-003",
    state: "california",
    kind: "rate-case",
    discoveredDate: "2026-01-28",
    title: "Placeholder: PG&E general rate case update — example",
    summary:
      "Placeholder entry. A hypothetical PG&E general rate case update. The CPUC reviews these periodically and decisions can affect residential rates.",
    sourceHint: "CPUC docket filings",
    status: "new",
  },
  {
    id: "q-004",
    state: "california",
    kind: "timeline-event",
    discoveredDate: "2026-02-01",
    title: "Placeholder: California resource adequacy proceeding — example",
    summary:
      "Placeholder entry. California's CPUC periodically reviews resource adequacy requirements. This entry illustrates that type of event.",
    sourceHint: "CPUC press release",
    status: "published",
    notes: "Published to regulatory/california/timeline.",
  },
  {
    id: "q-005",
    state: "new-york",
    kind: "rate-case",
    discoveredDate: "2026-01-15",
    title: "Placeholder: Con Edison rate filing — example",
    summary:
      "Placeholder entry. A hypothetical Con Edison rate filing before the New York Public Service Commission.",
    sourceHint: "NY PSC case filing system",
    status: "reviewed",
  },
  {
    id: "q-006",
    state: "new-york",
    kind: "timeline-event",
    discoveredDate: "2026-02-05",
    title: "Placeholder: NY Clean Energy Standard update — example",
    summary:
      "Placeholder entry. Illustrates a policy event (clean energy standard revision) that can indirectly affect electricity rates over time.",
    sourceHint: "NY DPS policy filing",
    status: "rejected",
    notes:
      "Outside scope for now — too policy-level; not directly tied to rate changes.",
  },
  {
    id: "q-007",
    state: "virginia",
    kind: "rate-case",
    discoveredDate: "2026-02-08",
    title: "Placeholder: Dominion Energy rate filing — example",
    summary:
      "Placeholder entry. Represents a hypothetical Dominion Energy rate case before the Virginia State Corporation Commission.",
    sourceHint: "SCC Virginia docket",
    status: "new",
    notes: "Virginia is a priority state given data center load growth signals.",
  },
  {
    id: "q-008",
    state: "virginia",
    kind: "timeline-event",
    discoveredDate: "2026-01-20",
    title: "Placeholder: Virginia data center demand growth discussion — example",
    summary:
      "Placeholder entry. Represents a hypothetical SCC proceeding related to large-load interconnection requests, which may be associated with data center growth. No specific claims are made.",
    sourceHint: "SCC Virginia integrated resource plan filing",
    status: "new",
    notes:
      "Tie to /v/ai-energy/where-prices-rise if published. Confidence should remain low.",
  },
  {
    id: "q-009",
    state: "illinois",
    kind: "rate-case",
    discoveredDate: "2026-02-14",
    title: "Placeholder: ComEd rate adjustment — example",
    summary:
      "Placeholder entry. A hypothetical ComEd rate adjustment filing. Illinois ICC reviews utility filings.",
    sourceHint: "Illinois ICC docket search",
    status: "new",
  },
  {
    id: "q-010",
    state: "florida",
    kind: "timeline-event",
    discoveredDate: "2026-01-30",
    title: "Placeholder: FPL fuel adjustment proceeding — example",
    summary:
      "Placeholder entry. Florida Public Service Commission fuel adjustment proceedings can affect pass-through rates to consumers.",
    sourceHint: "Florida PSC fuel docket",
    status: "reviewed",
    notes: "Verify current fuel clause filing date before publishing.",
  },
  {
    id: "q-011",
    state: "ohio",
    kind: "rate-case",
    discoveredDate: "2026-02-03",
    title: "Placeholder: AEP Ohio distribution rate case — example",
    summary:
      "Placeholder entry. Illustrates a distribution rate case filing. Ohio PUCO reviews these filings.",
    sourceHint: "PUCO Ohio docket",
    status: "rejected",
    notes: "Duplicate of an already-tracked entry; rejected to avoid overlap.",
  },
  {
    id: "q-012",
    state: "pennsylvania",
    kind: "rate-case",
    discoveredDate: "2026-02-16",
    title: "Placeholder: PECO rate case filing — example",
    summary:
      "Placeholder entry. A hypothetical PECO rate case before the Pennsylvania PUC.",
    sourceHint: "PA PUC filing search",
    status: "new",
  },
];

export const QUEUE_STATUS_LABELS: Record<QueueItemStatus, string> = {
  new: "New",
  reviewed: "Reviewed",
  published: "Published",
  rejected: "Rejected",
};

export const QUEUE_KIND_LABELS: Record<QueueItemKind, string> = {
  "rate-case": "Rate Case",
  "timeline-event": "Timeline Event",
};

export function getQueueByStatus(status: QueueItemStatus): QueueItem[] {
  return REGULATORY_QUEUE.filter((item) => item.status === status).sort((a, b) =>
    b.discoveredDate.localeCompare(a.discoveredDate)
  );
}

export function getQueueCounts(): Record<QueueItemStatus, number> {
  const counts: Record<QueueItemStatus, number> = {
    new: 0,
    reviewed: 0,
    published: 0,
    rejected: 0,
  };
  for (const item of REGULATORY_QUEUE) {
    counts[item.status]++;
  }
  return counts;
}
