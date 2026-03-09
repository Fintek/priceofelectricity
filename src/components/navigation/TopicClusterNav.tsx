import Link from "next/link";

export type TopicClusterLink = {
  href: string;
  label: string;
};

export type TopicClusterNavProps = {
  title: string;
  description?: string;
  links: TopicClusterLink[];
};

/**
 * Cross-cluster topic navigation for authority and hub pages.
 * Links into adjacent topic clusters for stronger internal link graph.
 * Server-safe. Use 4–8 links max. Keep curated and intentional.
 */
export default function TopicClusterNav({ title, description, links }: TopicClusterNavProps) {
  if (links.length === 0) return null;

  return (
    <section
      aria-labelledby="topic-cluster-nav-heading"
      style={{
        marginTop: 32,
        marginBottom: 24,
        padding: 16,
        border: "1px solid var(--color-border, #e5e7eb)",
        borderRadius: 8,
        backgroundColor: "var(--color-surface-alt, #f9fafb)",
      }}
    >
      <h2
        id="topic-cluster-nav-heading"
        style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px 0" }}
      >
        {title}
      </h2>
      {description && (
        <p className="muted" style={{ margin: "0 0 12px 0", fontSize: 14, lineHeight: 1.5 }}>
          {description}
        </p>
      )}
      <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
