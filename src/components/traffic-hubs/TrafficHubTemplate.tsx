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

      {stats.length > 0 ? (
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
        </section>
      ) : null}

      {children}

      {monetizationContext ? <PageMonetization context={monetizationContext} /> : null}

      {sections.map((section) => (
        <section key={section.title} style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>{section.title}</h2>
          {section.intro ? (
            <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", lineHeight: 1.6 }}>{section.intro}</p>
          ) : null}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 16,
            }}
          >
            {section.cards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                style={{
                  display: "block",
                  padding: 18,
                  border: "1px solid var(--color-border, #e5e7eb)",
                  borderRadius: 8,
                  backgroundColor: "var(--color-surface-alt, #f9fafb)",
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                {card.eyebrow ? (
                  <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                    {card.eyebrow}
                  </div>
                ) : null}
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{card.title}</div>
                <div style={{ lineHeight: 1.6 }}>{card.description}</div>
                {card.meta ? (
                  <div className="muted" style={{ fontSize: 13, marginTop: 10 }}>
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
