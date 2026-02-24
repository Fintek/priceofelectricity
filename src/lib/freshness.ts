export type FreshnessStatus = "fresh" | "aging" | "stale";

function toUtcDate(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function computeFreshness(updated: string): {
  daysOld: number;
  status: FreshnessStatus;
  label: string;
} {
  const parsed = Date.parse(updated);
  if (Number.isNaN(parsed)) {
    return {
      daysOld: 9999,
      status: "stale",
      label: "Updated date unavailable (data may be outdated)",
    };
  }

  const updatedDate = toUtcDate(new Date(parsed));
  const nowDate = toUtcDate(new Date());
  const msPerDay = 1000 * 60 * 60 * 24;
  const rawDays = Math.floor((nowDate.getTime() - updatedDate.getTime()) / msPerDay);
  const daysOld = Math.max(0, rawDays);

  if (daysOld < 45) {
    return {
      daysOld,
      status: "fresh",
      label: `Updated ${daysOld} days ago`,
    };
  }

  if (daysOld <= 90) {
    return {
      daysOld,
      status: "aging",
      label: `Updated ${daysOld} days ago`,
    };
  }

  return {
    daysOld,
    status: "stale",
    label: `Updated ${daysOld} days ago (data may be outdated)`,
  };
}
