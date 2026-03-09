import { t } from "@/lib/knowledge/labels";

type KnowledgeBadgesProps = {
  freshnessStatus?: string;
  ageDays?: number;
  qualityScore?: number;
  sourceVersion?: string;
  semanticCluster?: string;
};

export default function KnowledgeBadges({
  freshnessStatus,
  ageDays,
  qualityScore,
  sourceVersion,
  semanticCluster,
}: KnowledgeBadgesProps) {
  const badges: Array<{ label: string; bg: string }> = [];

  if (freshnessStatus) {
    const color =
      freshnessStatus === "fresh"
        ? "rgba(34, 197, 94, 0.15)"
        : freshnessStatus === "aging"
          ? "rgba(234, 179, 8, 0.15)"
          : freshnessStatus === "stale"
            ? "rgba(239, 68, 68, 0.15)"
            : "rgba(107, 114, 128, 0.15)";
    const statusLabel = t(`status.${freshnessStatus}`);
    badges.push({
      label: ageDays !== undefined ? `${t("section.freshness")}: ${statusLabel} (${ageDays}d)` : `${t("section.freshness")}: ${statusLabel}`,
      bg: color,
    });
  }

  if (typeof qualityScore === "number") {
    const bg =
      qualityScore >= 90
        ? "rgba(34, 197, 94, 0.15)"
        : qualityScore >= 70
          ? "rgba(234, 179, 8, 0.15)"
          : "rgba(239, 68, 68, 0.15)";
    badges.push({ label: `${t("badge.quality")}: ${qualityScore}/100`, bg });
  }

  if (sourceVersion) {
    badges.push({ label: `v${sourceVersion}`, bg: "var(--color-surface-alt)" });
  }

  if (semanticCluster) {
    badges.push({ label: semanticCluster, bg: "var(--color-surface-alt)" });
  }

  if (badges.length === 0) return null;

  const badgeStyle = {
    fontSize: 13,
    padding: "4px 10px",
    borderRadius: 4,
    fontWeight: 500,
    display: "inline-block",
  };

  return (
    <div
      role="group"
      aria-label="Page metadata badges"
      style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}
    >
      {badges.map((b, i) => (
        <span key={i} style={{ ...badgeStyle, backgroundColor: b.bg }}>
          {b.label}
        </span>
      ))}
    </div>
  );
}
