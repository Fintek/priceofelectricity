type GlossaryField = {
  id: string;
  label: string;
  description: string;
};

type KeyStat = {
  label: string;
  value: string | number | null | undefined | unknown;
  fieldId?: string;
};

type KeyStatsGridProps = {
  stats: KeyStat[];
  columns?: 2 | 3 | 4;
  glossaryMap?: Record<string, GlossaryField>;
};

function StatLabel({
  label,
  fieldId,
  glossaryMap,
}: {
  label: string;
  fieldId?: string;
  glossaryMap?: Record<string, GlossaryField>;
}) {
  const entry = fieldId && glossaryMap ? glossaryMap[fieldId] : undefined;
  const description = entry && typeof entry === "object" && "description" in entry ? entry.description : undefined;
  if (!description || typeof description !== "string") {
    return <>{label}</>;
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {label}
      <details style={{ display: "inline" }}>
        <summary
          style={{
            cursor: "pointer",
            fontSize: 12,
            color: "var(--color-muted)",
            listStyle: "none",
          }}
          aria-label={`Definition for ${label}`}
        >
          ?
        </summary>
        <span
          style={{
            display: "block",
            marginTop: 4,
            fontSize: 12,
            color: "var(--color-muted)",
            maxWidth: 280,
          }}
        >
          {description}
        </span>
      </details>
    </span>
  );
}

export default function KeyStatsGrid({ stats, columns = 3, glossaryMap }: KeyStatsGridProps) {
  if (stats.length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 16,
        marginBottom: 24,
      }}
    >
      {stats.map((s, i) => (
        <div
          key={i}
          style={{
            padding: 12,
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            backgroundColor: "var(--color-surface-alt)",
          }}
        >
          <dt className="muted" style={{ fontSize: 13, margin: 0 }}>
            <StatLabel label={s.label} fieldId={s.fieldId} glossaryMap={glossaryMap} />
          </dt>
          <dd style={{ margin: "4px 0 0 0", fontSize: 18, fontWeight: 600 }}>
            {s.value != null && s.value !== "" ? String(s.value as string | number) : "—"}
          </dd>
        </div>
      ))}
    </div>
  );
}
