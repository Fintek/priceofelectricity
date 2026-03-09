import Link from "next/link";
import { t } from "@/lib/knowledge/labels";

type GlossaryField = {
  id: string;
  label: string;
  description?: string;
};

export type CompareStateCardState = {
  slug: string;
  name: string;
  postal?: string | null;
  metrics: Record<string, number | string | null>;
  canonicalUrl: string;
  jsonUrl: string;
};

export type CompareStateCardProps = {
  state: CompareStateCardState;
  fields: string[];
  glossaryMap?: Record<string, GlossaryField>;
  coveragePct?: number | null;
  onRemove?: () => void;
};

function toPath(url: string): string {
  if (url.startsWith("http")) {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  }
  return url;
}

function formatValue(val: number | string | null, field: string): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "number") {
    if (field === "exampleBill1000kwh") return val.toFixed(2);
    if (field === "avgRateCentsPerKwh") return val.toFixed(2);
    if (field === "valueScore" || field === "affordabilityIndex") return val.toFixed(1);
    return String(val);
  }
  return String(val);
}

function getLabel(fieldId: string, glossaryMap?: Record<string, GlossaryField>): string {
  if (glossaryMap?.[fieldId]?.label) return glossaryMap[fieldId].label;
  const key = `field.${fieldId}`;
  return t(key) !== key ? t(key) : fieldId;
}

export default function CompareStateCard({
  state,
  fields,
  glossaryMap,
  coveragePct,
  onRemove,
}: CompareStateCardProps) {
  const statePath = toPath(state.canonicalUrl);
  const displayFields = fields.slice(0, 5);

  return (
    <div
      style={{
        padding: 16,
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        backgroundColor: "var(--color-surface-alt)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <Link href={statePath} style={{ fontWeight: 600, fontSize: 16, textDecoration: "none" }}>
            {state.name}
          </Link>
          {state.postal && (
            <span className="muted" style={{ marginLeft: 6, fontSize: 14 }}>
              ({state.postal})
            </span>
          )}
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${state.name} from comparison`}
            style={{
              padding: "4px 8px",
              fontSize: 12,
              border: "1px solid var(--color-border)",
              borderRadius: 4,
              background: "transparent",
              cursor: "pointer",
              color: "var(--color-muted)",
            }}
          >
            Remove
          </button>
        )}
      </div>
      <dl style={{ margin: 0, fontSize: 14, display: "flex", flexDirection: "column", gap: 6 }}>
        {displayFields.map((fieldId) => (
          <div key={fieldId} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <dt className="muted" style={{ margin: 0, fontWeight: 500 }}>
              {getLabel(fieldId, glossaryMap)}
            </dt>
            <dd style={{ margin: 0, fontWeight: 600 }}>
              {fieldId === "freshnessStatus" && state.metrics[fieldId]
                ? t(`status.${String(state.metrics[fieldId])}`)
                : formatValue(state.metrics[fieldId], fieldId)}
            </dd>
          </div>
        ))}
      </dl>
      {typeof coveragePct === "number" && (
        <div style={{ marginTop: 4 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Coverage</div>
          <div
            style={{
              height: 6,
              borderRadius: 3,
              backgroundColor: "var(--color-border)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.min(100, Math.max(0, coveragePct))}%`,
                height: "100%",
                backgroundColor: "var(--color-muted)",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
