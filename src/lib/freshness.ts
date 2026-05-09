import { EIA_RESIDENTIAL_RETAIL_PRICE_DATA_META } from "@/data/raw/states.raw";

export type FreshnessStatus = "fresh" | "aging" | "stale";

function toUtcDate(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Public-site freshness is anchored to the ingest sync time when available
 * (`pipelineSynchronizedAtIso` from the canonical EIA CSV ingest), not the EIA
 * reporting month label (`RAW_STATES.updated`) which can lag calendar time.
 */
export function computeFreshness(
  eiaReportingMonthLabel: string,
  pipelineSynchronizedAtIso?: string,
): {
  daysOld: number;
  status: FreshnessStatus;
  label: string;
} {
  const fromMeta = EIA_RESIDENTIAL_RETAIL_PRICE_DATA_META.pipelineSynchronizedAtIso;
  const syncIso =
    (typeof pipelineSynchronizedAtIso === "string" &&
    Number.isFinite(Date.parse(pipelineSynchronizedAtIso)))
      ? pipelineSynchronizedAtIso
      : typeof fromMeta === "string" && Number.isFinite(Date.parse(fromMeta))
        ? fromMeta
        : undefined;

  const referenceParsed =
    typeof syncIso === "string"
      ? Date.parse(syncIso)
      : Date.parse(eiaReportingMonthLabel);

  if (Number.isNaN(referenceParsed)) {
    return {
      daysOld: 9999,
      status: "stale",
      label: "Dataset sync time unavailable (data may be outdated)",
    };
  }

  const referenceDate = toUtcDate(new Date(referenceParsed));
  const nowDate = toUtcDate(new Date());
  const msPerDay = 1000 * 60 * 60 * 24;
  const rawDays = Math.floor((nowDate.getTime() - referenceDate.getTime()) / msPerDay);
  const daysOld = Math.max(0, rawDays);

  const verbPrefix = typeof syncIso === "string" ? "Dataset synchronized" : "Updated";

  if (daysOld < 45) {
    return {
      daysOld,
      status: "fresh",
      label: `${verbPrefix} ${daysOld} days ago`,
    };
  }

  if (daysOld <= 90) {
    return {
      daysOld,
      status: "aging",
      label: `${verbPrefix} ${daysOld} days ago`,
    };
  }

  return {
    daysOld,
    status: "stale",
    label: `${verbPrefix} ${daysOld} days ago (check EIA release schedule)`,
  };
}
