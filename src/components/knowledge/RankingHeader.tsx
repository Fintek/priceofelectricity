import Link from "next/link";
import { SITE_URL } from "@/lib/site";

type GlossaryField = {
  id: string;
  label: string;
  description?: string;
};

export type RankingHeaderProps = {
  title: string;
  excerpt?: string;
  metricId?: string;
  direction?: "asc" | "desc";
  methodologyRefs?: string[];
  methodologyHubUrl?: string;
  glossary?: Record<string, GlossaryField>;
  jsonUrl?: string;
  enabled?: boolean;
  windowYears?: number;
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

export default function RankingHeader({
  title,
  excerpt,
  metricId,
  direction,
  methodologyRefs,
  methodologyHubUrl,
  glossary,
  jsonUrl,
  enabled = true,
  windowYears,
}: RankingHeaderProps) {
  const metricLabel = metricId && glossary?.[metricId] ? glossary[metricId].label : metricId ?? "Metric";
  const metricDesc = metricId && glossary?.[metricId] ? glossary[metricId].description : undefined;
  const directionLabel = direction === "asc" ? "Lower is better" : direction === "desc" ? "Higher is better" : null;
  const firstMethodology = methodologyRefs?.[0];
  const jsonPath = jsonUrl ? toPath(jsonUrl) : null;

  return (
    <header style={{ marginBottom: 24 }}>
      <h1 style={{ margin: "0 0 8px 0", fontSize: 24 }}>{title}</h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        {!enabled && (
          <span
            className="muted"
            style={{
              fontSize: 13,
              padding: "4px 8px",
              borderRadius: 4,
              backgroundColor: "var(--color-surface-alt)",
            }}
          >
            History required
          </span>
        )}
        {typeof windowYears === "number" && (
          <span
            className="muted"
            style={{
              fontSize: 13,
              padding: "4px 8px",
              borderRadius: 4,
              backgroundColor: "var(--color-surface-alt)",
            }}
          >
            Window: {windowYears} years
          </span>
        )}
      </div>
      {excerpt && (
        <p className="muted" style={{ margin: "0 0 12px 0", fontSize: 15 }}>
          {excerpt}
        </p>
      )}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          fontSize: 14,
        }}
      >
        <span>
          <strong>Metric:</strong>{" "}
          {metricDesc ? (
            <details style={{ display: "inline" }}>
              <summary style={{ cursor: "pointer", listStyle: "none" }}>
                {metricLabel} <span className="muted">?</span>
              </summary>
              <span className="muted" style={{ display: "block", marginTop: 4, maxWidth: 400 }}>
                {metricDesc}
              </span>
            </details>
          ) : (
            metricLabel
          )}
        </span>
        {directionLabel && (
          <span className="muted" style={{ borderLeft: "1px solid var(--color-border)", paddingLeft: 12 }}>
            {directionLabel}
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
        {jsonPath && (
          <a
            href={jsonPath.startsWith("/") ? `${SITE_URL}${jsonPath}` : jsonPath}
            target="_blank"
            rel="noopener noreferrer"
            className="muted"
            style={{ fontSize: 14, textDecoration: "underline" }}
          >
            View JSON
          </a>
        )}
        {firstMethodology && (
          <Link
            href={toPath(firstMethodology)}
            className="muted"
            style={{ fontSize: 14, textDecoration: "underline" }}
          >
            Methodology
          </Link>
        )}
        {methodologyHubUrl && (
          <Link
            href={toPath(methodologyHubUrl)}
            className="muted"
            style={{ fontSize: 14, textDecoration: "underline" }}
          >
            How this is calculated
          </Link>
        )}
      </div>
    </header>
  );
}
