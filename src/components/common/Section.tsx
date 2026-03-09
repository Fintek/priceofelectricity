import type { ReactNode } from "react";

export type SectionProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  defaultCollapsed?: boolean;
  /** When collapsed, the summary text shown (e.g. "Show JSON", "Show sources") */
  collapseSummary?: string;
  id?: string;
};

export default function Section({
  title,
  subtitle,
  children,
  actions,
  defaultCollapsed = false,
  collapseSummary,
  id,
}: SectionProps) {
  const headingId = id ?? title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const content = (
    <>
      {(subtitle || actions) && (
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
          {subtitle && (
            <p className="muted" style={{ margin: 0, fontSize: 14, maxWidth: "60ch" }}>
              {subtitle}
            </p>
          )}
          {actions && <div style={{ flexShrink: 0 }}>{actions}</div>}
        </div>
      )}
      {children}
    </>
  );

  if (defaultCollapsed) {
    return (
      <section
        aria-labelledby={headingId}
        style={{ marginTop: 32, marginBottom: 24, maxWidth: "100%" }}
      >
        <details open={false} style={{ margin: 0 }}>
          <summary
            style={{
              cursor: "pointer",
              listStyle: "none",
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <h2
              id={headingId}
              style={{ fontSize: 18, fontWeight: 600, margin: 0, display: "inline" }}
            >
              {title}
            </h2>
            <span className="muted" style={{ fontSize: 14 }}>
              {collapseSummary ?? `Show ${title}`}
            </span>
          </summary>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--color-border)" }}>
            {content}
          </div>
        </details>
      </section>
    );
  }

  return (
    <section
      aria-labelledby={headingId}
      style={{ marginTop: 32, marginBottom: 24, maxWidth: "100%" }}
    >
      <h2 id={headingId} style={{ fontSize: 18, fontWeight: 600, margin: "0 0 12px 0" }}>
        {title}
      </h2>
      {content}
    </section>
  );
}
