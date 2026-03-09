import Sparkline from "./Sparkline";

type GlossaryField = {
  id: string;
  label: string;
  description: string;
};

export type MetricCardProps = {
  label: string;
  value: string | number;
  unit?: string;
  description?: string;
  trend?: "up" | "down" | "flat" | null;
  trendLabel?: string;
  glossaryMap?: Record<string, GlossaryField>;
  fieldId?: string;
  /** Optional sparkline values (build-time trend array). */
  sparklineValues?: number[];
};

function MetricLabel({
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

export default function MetricCard({
  label,
  value,
  unit,
  description,
  trend,
  trendLabel,
  glossaryMap,
  fieldId,
  sparklineValues,
}: MetricCardProps) {
  const trendSymbol = trend === "up" ? "↑" : trend === "down" ? "↓" : trend === "flat" ? "→" : null;
  const trendColor =
    trend === "up"
      ? "var(--color-error, #b91c1c)"
      : trend === "down"
        ? "var(--color-success, #15803d)"
        : trend === "flat"
          ? "var(--color-muted)"
          : undefined;

  return (
    <div
      style={{
        padding: 16,
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        backgroundColor: "var(--color-surface-alt)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div className="muted" style={{ fontSize: 13, margin: 0, fontWeight: 500 }}>
        <MetricLabel label={label} fieldId={fieldId} glossaryMap={glossaryMap} />
      </div>
      <div style={{ margin: 0, fontSize: 22, fontWeight: 600, display: "flex", alignItems: "baseline", gap: 6 }}>
        {value != null && value !== "" ? (
          <>
            {typeof value === "number" ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(value)}
            {unit && (
              <span className="muted" style={{ fontSize: 14, fontWeight: 500 }}>
                {unit}
              </span>
            )}
            {trendSymbol && (
              <span
                style={{
                  fontSize: 14,
                  color: trendColor,
                  marginLeft: 4,
                }}
                title={trendLabel}
                aria-label={trendLabel ?? `Trend: ${trend}`}
              >
                {trendSymbol}
              </span>
            )}
          </>
        ) : (
          "—"
        )}
      </div>
      {sparklineValues && sparklineValues.length >= 2 && (
        <div style={{ marginTop: 6 }}>
          <Sparkline values={sparklineValues} width={120} height={30} />
        </div>
      )}
      {description && (
        <p className="muted" style={{ fontSize: 12, margin: "4px 0 0 0" }}>
          {description}
        </p>
      )}
    </div>
  );
}
