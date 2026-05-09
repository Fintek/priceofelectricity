import Link from "next/link";
import {
  getCanonicalDatasetSynchronizedMediumDateUtc,
  getCanonicalResidentialDataThroughMonthLabel,
} from "@/lib/eiaReportingTrust";

type Release = {
  releaseId?: string;
  sourceVersion?: string;
  contractVersion?: string;
  generatedAt?: string;
} | null;

type BuildStampProps = {
  release: Release;
};

export default function BuildStamp({ release }: BuildStampProps) {
  if (!release?.releaseId) return null;

  const reportingMonth = getCanonicalResidentialDataThroughMonthLabel();
  const syncLabel = getCanonicalDatasetSynchronizedMediumDateUtc();

  const generatedAt = release.generatedAt
    ? new Date(release.generatedAt).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
      })
    : "—";

  return (
    <div
      className="muted"
      role="contentinfo"
      aria-label="Build stamp"
      style={{
        fontSize: 12,
        lineHeight: 1.6,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 16px", marginBottom: 4 }}>
        <span>Build: {release.releaseId}</span>
        <span>Data: {release.sourceVersion ?? "—"}</span>
        <span>Contract: {release.contractVersion ?? "—"}</span>
        <span>Knowledge build (dataset ingest, UTC): {generatedAt}</span>
      </div>
      <div style={{ marginTop: 6, marginBottom: 4, maxWidth: "72ch", fontSize: 11, lineHeight: 1.55 }}>
        Latest EIA residential reporting month: {reportingMonth}.
        {syncLabel !== null ? (
          <> Dataset synchronized from canonical source {syncLabel} (UTC).</>
        ) : null}{" "}
        EIA monthly state data ships on a reporting lag; ingest stamps track when this site pulled the published
        series, not unpublished future EIA months.
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
        <Link href="/knowledge/release.json">release.json</Link>
        <span>·</span>
        <Link href="/knowledge/public-endpoints.json">public-endpoints.json</Link>
      </div>
    </div>
  );
}
