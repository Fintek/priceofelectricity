import Link from "next/link";
import type { LongtailRelatedLinkSection } from "@/lib/longtail/internalLinks";

type LongtailRelatedLinksProps = {
  sections: LongtailRelatedLinkSection[];
};

export default function LongtailRelatedLinks({ sections }: LongtailRelatedLinksProps) {
  if (sections.length === 0) return null;

  return (
    <section style={{ marginBottom: "var(--space-7)" }}>
      {sections.map((section) => (
        <div key={section.title} style={{ marginBottom: "var(--space-5)" }}>
          <h2
            className="heading-section"
            style={{ marginTop: 0, marginBottom: "var(--space-3)" }}
          >
            {section.title}
          </h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            {section.links.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
                {link.description ? ` — ${link.description}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
