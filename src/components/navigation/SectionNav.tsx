import Link from "next/link";

export type SectionNavLink = {
  href: string;
  label: string;
};

export type SectionNavProps = {
  title: string;
  description?: string;
  links: SectionNavLink[];
};

/**
 * Top-of-page section navigation for hub/index pages.
 * Server-safe, no client state. Use 3–6 links max.
 * Differs from ExploreMore: SectionNav = entry-point orientation; ExploreMore = related links deeper in page.
 */
export default function SectionNav({ title, description, links }: SectionNavProps) {
  if (links.length === 0) return null;

  return (
    <nav
      aria-label={title}
      style={{
        marginBottom: 24,
        padding: "16px 20px",
        border: "1px solid var(--color-border, #e5e7eb)",
        borderRadius: 8,
        backgroundColor: "var(--color-surface-alt, #f9fafb)",
      }}
    >
      <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px 0" }}>{title}</h2>
      {description && (
        <p className="muted" style={{ margin: "0 0 12px 0", fontSize: 14, lineHeight: 1.5 }}>
          {description}
        </p>
      )}
      <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
        {links.map((link) => (
          <li key={link.href} style={{ listStyle: "disc" }}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
