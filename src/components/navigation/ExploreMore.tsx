import Link from "next/link";

export type ExploreMoreLink = {
  href: string;
  label: string;
};

export type ExploreMoreProps = {
  title?: string;
  links: ExploreMoreLink[];
};

/**
 * Compact related-navigation block for internal link graph stabilization.
 * Server-safe, no client state. Use 3–6 links max.
 */
export default function ExploreMore({ title = "Explore more", links }: ExploreMoreProps) {
  if (links.length === 0) return null;

  return (
    <section
      aria-labelledby="explore-more-heading"
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
        id="explore-more-heading"
        style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px 0" }}
      >
        {title}
      </h2>
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
