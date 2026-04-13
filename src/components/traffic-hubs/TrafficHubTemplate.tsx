import type { ReactNode } from "react";
import Link from "next/link";
import PageMonetization from "@/components/monetization/PageMonetization";
import type { MonetizationContext } from "@/lib/monetization/config";
import type { TrafficHubMetric, TrafficHubSection } from "@/lib/longtail/trafficHubs";

export type TrafficHubBreadcrumb = {
  label: string;
  href?: string;
};

type TrafficHubTemplateProps = {
  breadcrumbs: TrafficHubBreadcrumb[];
  title: string;
  intro: string;
  stats?: TrafficHubMetric[];
  sections: TrafficHubSection[];
  monetizationContext?: MonetizationContext;
  children?: ReactNode;
};

export default function TrafficHubTemplate({
  breadcrumbs,
  title,
  intro,
  stats = [],
  sections,
  monetizationContext,
  children,
}: TrafficHubTemplateProps) {
  return (
    <main className="container">
      <nav aria-label="Breadcrumb" className="breadcrumb-nav">
        <ol className="breadcrumb-list">
          {breadcrumbs.flatMap((item, index) => {
            const items = [
              <li key={`crumb-${index}`}>
                {item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
              </li>,
            ];
            if (index < breadcrumbs.length - 1) {
              items.push(
                <li key={`sep-${index}`} aria-hidden="true">
                  →
                </li>,
              );
            }
            return items;
          })}
        </ol>
      </nav>

      <h1 style={{ marginBottom: "var(--space-4)" }}>{title}</h1>
      <p style={{ marginTop: 0, marginBottom: "var(--space-5)", maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
        {intro}
      </p>

      {stats.length > 0 ? (
        <section style={{ marginBottom: "var(--space-7)" }}>
          <div className="stat-panel">
            {stats.map((stat) => (
              <div key={stat.label} className="stat-card">
                <div className="stat-card-value">{stat.value}</div>
                <div className="stat-card-label">{stat.label}</div>
                {stat.hint ? (
                  <div className="stat-card-label" style={{ marginTop: "var(--space-1)" }}>
                    {stat.hint}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {children}

      {monetizationContext ? <PageMonetization context={monetizationContext} /> : null}

      {sections.map((section) => (
        <section key={section.title} style={{ marginBottom: "var(--space-7)" }}>
          <h2 className="heading-section">{section.title}</h2>
          {section.intro ? (
            <p style={{ marginTop: 0, marginBottom: "var(--space-4)", maxWidth: "65ch", lineHeight: 1.6 }}>
              {section.intro}
            </p>
          ) : null}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "var(--space-4)",
            }}
          >
            {section.cards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                style={{
                  display: "block",
                  padding: "calc(var(--space-4) + var(--space-1))",
                  border: "1px solid var(--color-border, #e5e7eb)",
                  borderRadius: 8,
                  backgroundColor: "var(--color-surface-alt, #f9fafb)",
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                {card.eyebrow ? (
                  <div
                    className="muted"
                    style={{ fontSize: "var(--font-size-sm)", marginBottom: "var(--space-2)" }}
                  >
                    {card.eyebrow}
                  </div>
                ) : null}
                <div
                  style={{
                    fontSize: "var(--font-size-lg)",
                    fontWeight: 600,
                    marginBottom: "var(--space-2)",
                  }}
                >
                  {card.title}
                </div>
                <div style={{ lineHeight: 1.6 }}>{card.description}</div>
                {card.meta ? (
                  <div className="muted" style={{ fontSize: "var(--font-size-sm)", marginTop: "var(--space-3)" }}>
                    {card.meta}
                  </div>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
