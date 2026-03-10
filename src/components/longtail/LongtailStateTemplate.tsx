import type { ReactNode } from "react";
import Link from "next/link";
import Sparkline from "@/components/charts/Sparkline";
import LongtailRelatedLinks from "@/components/longtail/LongtailRelatedLinks";
import PageMonetization from "@/components/monetization/PageMonetization";
import type { LongtailRelatedLinkSection } from "@/lib/longtail/internalLinks";
import type { MonetizationContext } from "@/lib/monetization/config";

export type LongtailBreadcrumb = {
  label: string;
  href?: string;
};

export type LongtailStat = {
  label: string;
  value: string;
  hint?: string;
};

export type LongtailComparisonRow = {
  label: string;
  value: string;
};

export type LongtailTrendSection = {
  title: string;
  points: number[];
  subtitle?: string;
  ariaLabel: string;
  formatValue?: (value: number) => string;
};

export type LongtailRelatedLink = {
  href: string;
  label: string;
  description?: string;
};

export type LongtailSourceAttribution = {
  sourceName: string;
  sourceUrl?: string | null;
  updatedLabel?: string | null;
};

type LongtailStateTemplateProps = {
  breadcrumbs: LongtailBreadcrumb[];
  title: string;
  intro: string;
  stats: LongtailStat[];
  comparisonTitle?: string;
  comparisonRows?: LongtailComparisonRow[];
  comparisonSummary?: string;
  trend?: LongtailTrendSection;
  relatedLinks: LongtailRelatedLink[];
  relatedLinkSections?: LongtailRelatedLinkSection[];
  monetizationContext?: MonetizationContext;
  sourceAttribution: LongtailSourceAttribution;
  children?: ReactNode;
};

export default function LongtailStateTemplate({
  breadcrumbs,
  title,
  intro,
  stats,
  comparisonTitle,
  comparisonRows,
  comparisonSummary,
  trend,
  relatedLinks,
  relatedLinkSections,
  monetizationContext,
  sourceAttribution,
  children,
}: LongtailStateTemplateProps) {
  return (
    <main className="container">
      <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
        {breadcrumbs.map((item, index) => (
          <span key={`${item.label}-${index}`}>
            {item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
            {index < breadcrumbs.length - 1 ? " · " : ""}
          </span>
        ))}
      </nav>

      <h1 style={{ fontSize: 32, marginBottom: 16 }}>{title}</h1>
      <p style={{ marginTop: 0, marginBottom: 24, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
        {intro}
      </p>

      {stats.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 16,
            }}
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                style={{
                  padding: 20,
                  border: "1px solid var(--color-border, #e5e7eb)",
                  borderRadius: 8,
                  backgroundColor: "var(--color-surface-alt, #f9fafb)",
                }}
              >
                <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>{stat.value}</div>
                {stat.hint ? (
                  <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
                    {stat.hint}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Key metrics</h2>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  border: "1px solid var(--color-border, #e5e7eb)",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: "left",
                        padding: 10,
                        borderBottom: "1px solid var(--color-border, #e5e7eb)",
                        backgroundColor: "var(--color-surface-alt, #f9fafb)",
                      }}
                    >
                      Metric
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: 10,
                        borderBottom: "1px solid var(--color-border, #e5e7eb)",
                        backgroundColor: "var(--color-surface-alt, #f9fafb)",
                      }}
                    >
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((stat) => (
                    <tr key={`row-${stat.label}`}>
                      <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                        {stat.label}
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                        {stat.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {(comparisonRows && comparisonRows.length > 0) || comparisonSummary ? (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>{comparisonTitle ?? "Comparison"}</h2>
          <div
            style={{
              padding: 20,
              border: "1px solid var(--color-border, #e5e7eb)",
              borderRadius: 8,
              backgroundColor: "var(--color-surface-alt, #f9fafb)",
            }}
          >
            {comparisonRows && comparisonRows.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 16 }}>
                {comparisonRows.map((row) => (
                  <div key={row.label}>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {row.label}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>{row.value}</div>
                  </div>
                ))}
              </div>
            ) : null}
            {comparisonSummary ? (
              <p style={{ margin: comparisonRows && comparisonRows.length > 0 ? "12px 0 0" : 0 }}>
                {comparisonSummary}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {trend ? (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>{trend.title}</h2>
          {trend.points.length > 0 ? (
            <Sparkline
              points={trend.points}
              width={720}
              height={200}
              title={trend.title}
              subtitle={trend.subtitle}
              formatValue={trend.formatValue ?? ((value) => value.toFixed(2))}
              ariaLabel={trend.ariaLabel}
            />
          ) : (
            <p className="muted" style={{ margin: 0 }}>
              Trend data is not available for this state yet.
            </p>
          )}
        </section>
      ) : null}

      {children}

      {monetizationContext ? <PageMonetization context={monetizationContext} /> : null}

      {relatedLinkSections && relatedLinkSections.length > 0 ? (
        <LongtailRelatedLinks sections={relatedLinkSections} />
      ) : (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            {relatedLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
                {link.description ? ` — ${link.description}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Source & Method</h2>
        <p style={{ margin: 0, lineHeight: 1.7 }}>
          Source:{" "}
          {sourceAttribution.sourceUrl ? (
            <a href={sourceAttribution.sourceUrl} rel="noopener noreferrer" target="_blank">
              {sourceAttribution.sourceName}
            </a>
          ) : (
            sourceAttribution.sourceName
          )}
          .{" "}
          {sourceAttribution.updatedLabel
            ? `Last dataset period: ${sourceAttribution.updatedLabel}.`
            : "Data period label is currently unavailable."}{" "}
          Costs are energy-only estimates and exclude delivery charges, taxes, and fixed utility fees.
        </p>
      </section>
    </main>
  );
}
