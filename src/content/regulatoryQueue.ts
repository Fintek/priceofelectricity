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

// The review queue is populated from discovered regulatory filings pending
// verification. It is intentionally empty until real docket data is integrated,
// so the queue view shows accurate zero counts rather than example entries.
export const REGULATORY_QUEUE: QueueItem[] = [];

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
