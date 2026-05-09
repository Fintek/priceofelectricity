import Link from "next/link";

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
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
        <Link href="/knowledge/release.json">release.json</Link>
        <span>·</span>
        <Link href="/knowledge/public-endpoints.json">public-endpoints.json</Link>
      </div>
    </div>
  );
}
