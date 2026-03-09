import Link from "next/link";

export type AboutThisSiteLink = {
  href: string;
  label: string;
};

export type AboutThisSiteProps = {
  title?: string;
  description?: string;
  links?: AboutThisSiteLink[];
};

const DEFAULT_LINKS: AboutThisSiteLink[] = [
  { href: "/methodology", label: "Methodology" },
  { href: "/datasets", label: "Datasets" },
  { href: "/electricity-data", label: "Electricity data" },
  { href: "/entity-registry", label: "Entity registry" },
  { href: "/discovery-graph", label: "Discovery graph" },
];

/**
 * Compact authority-signal block for trust and transparency.
 * Communicates: what the site analyzes, that it is data-driven,
 * where methodology and datasets live, and how to verify structure.
 * Server-safe only, no client component.
 */
export default function AboutThisSite({
  title = "About this site",
  description,
  links = DEFAULT_LINKS,
}: AboutThisSiteProps) {
  const desc =
    description ??
    "PriceOfElectricity.com is a data-driven electricity analysis site. It covers state electricity prices, rankings, comparisons, and datasets. Methodology and downloadable data are published for verification.";

  return (
    <section
      aria-labelledby="about-this-site-heading"
      style={{
        marginTop: 24,
        marginBottom: 24,
        padding: "14px 18px",
        border: "1px solid var(--color-border, #e5e7eb)",
        borderRadius: 8,
        backgroundColor: "var(--color-surface-alt, #f9fafb)",
      }}
    >
      <h2
        id="about-this-site-heading"
        style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px 0" }}
      >
        {title}
      </h2>
      <p className="muted" style={{ margin: "0 0 12px 0", fontSize: 14, lineHeight: 1.5 }}>
        {desc}
      </p>
      <p style={{ margin: 0, fontSize: 14 }}>
        {links.map((link, i) => (
          <span key={link.href}>
            {i > 0 && " · "}
            <Link href={link.href}>{link.label}</Link>
          </span>
        ))}
      </p>
    </section>
  );
}
