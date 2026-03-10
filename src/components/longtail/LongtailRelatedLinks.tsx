import Link from "next/link";
import type { LongtailRelatedLinkSection } from "@/lib/longtail/internalLinks";

type LongtailRelatedLinksProps = {
  sections: LongtailRelatedLinkSection[];
};

export default function LongtailRelatedLinks({ sections }: LongtailRelatedLinksProps) {
  if (sections.length === 0) return null;

  return (
    <section style={{ marginBottom: 32 }}>
      {sections.map((section) => (
        <div key={section.title} style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>{section.title}</h2>
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
