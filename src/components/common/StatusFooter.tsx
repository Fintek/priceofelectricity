import Link from "next/link";
import CopyButton from "./CopyButton";
import BuildStamp from "./BuildStamp";

type Release = {
  releaseId?: string;
  sourceVersion?: string;
  contractVersion?: string;
  generatedAt?: string;
  integrity?: { manifestHash?: string | null };
} | null;

type StatusFooterProps = {
  release: Release;
  capabilities?: { schemaVersion?: string } | null;
};

export default function StatusFooter({ release }: StatusFooterProps) {
  if (!release?.releaseId) return null;

  const manifestHash = release.integrity?.manifestHash;
  const hashPreview = manifestHash ? `${manifestHash.slice(0, 12)}…` : null;

  return (
    <footer
      role="contentinfo"
      aria-label="Release status"
      className="muted"
      style={{
        marginTop: 32,
        paddingTop: 16,
        borderTop: "1px solid var(--color-border, #e5e7eb)",
        fontSize: 12,
        lineHeight: 1.6,
      }}
    >
      <BuildStamp release={release} />
      {hashPreview && (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 8 }}>
          <span>Manifest: {hashPreview}</span>
          <CopyButton value={manifestHash ?? ""} label="Copy full manifest hash" />
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
        <Link href="/knowledge/release.json">View release.json</Link>
        <span>·</span>
        <Link href="/knowledge/capabilities.json">View capabilities.json</Link>
      </div>
    </footer>
  );
}
