import { EIA_RESIDENTIAL_RETAIL_PRICE_DATA_META } from "@/data/raw/states.raw";

/** Formats EIA canonical `YYYY-MM` period (UTC month) into a readable month/year label. */
export function formatEiaYmToMonthYear(ym: string): string {
  const [ys, ms] = ym.split("-");
  const y = Number(ys);
  const m = Number(ms);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
    return ym;
  }
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Latest complete EIA reporting month in bundled residential CSV (canonical `dataThroughYm`). */
export function getCanonicalResidentialDataThroughMonthLabel(): string {
  return formatEiaYmToMonthYear(EIA_RESIDENTIAL_RETAIL_PRICE_DATA_META.dataThroughYm);
}

/** Medium date (UTC) for last canonical dataset ingest, or null if meta is missing. */
export function getCanonicalDatasetSynchronizedMediumDateUtc(): string | null {
  const iso = EIA_RESIDENTIAL_RETAIL_PRICE_DATA_META.pipelineSynchronizedAtIso;
  if (typeof iso !== "string" || !Number.isFinite(Date.parse(iso))) {
    return null;
  }
  return new Date(iso).toLocaleDateString("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  });
}
