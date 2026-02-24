import Link from "next/link";
import type { RelatedLink } from "@/lib/related";

const TYPE_ORDER = [
  "offers",
  "tool",
  "regulatory",
  "drivers",
  "ranking",
  "vertical",
  "research",
  "guide",
  "question",
  "state",
  "data",
  "resource",
];

const TYPE_LABELS: Record<string, string> = {
  offers: "Offers & Alerts",
  tool: "Tools",
  regulatory: "Regulatory",
  drivers: "Drivers",
  ranking: "Rankings",
  vertical: "Verticals",
  research: "Research",
  guide: "Guides",
  question: "Questions",
  state: "States",
  data: "Data",
  resource: "Resources",
};

export default function RelatedLinks({
  title = "Related",
  links,
}: {
  title?: string;
  links: RelatedLink[];
}) {
  if (links.length === 0) return null;

  const grouped = new Map<string, RelatedLink[]>();
  for (const link of links) {
    const list = grouped.get(link.type) ?? [];
    list.push(link);
    grouped.set(link.type, list);
  }

  const sortedTypes = [...grouped.keys()].sort(
    (a, b) => (TYPE_ORDER.indexOf(a) === -1 ? 99 : TYPE_ORDER.indexOf(a)) -
              (TYPE_ORDER.indexOf(b) === -1 ? 99 : TYPE_ORDER.indexOf(b)),
  );

  return (
    <section
      style={{ marginTop: 28, paddingTop: 12, borderTop: "1px solid #eee" }}
    >
      <h2 style={{ fontSize: 22, marginBottom: 12 }}>{title}</h2>
      {sortedTypes.map((type) => (
        <div key={type} style={{ marginBottom: 10 }}>
          <p
            className="muted"
            style={{ marginBottom: 4, marginTop: 0, fontSize: 13 }}
          >
            {TYPE_LABELS[type] ?? type}
          </p>
          <ul style={{ marginTop: 0, paddingLeft: 20, lineHeight: 1.9 }}>
            {grouped.get(type)!.map((link) => (
              <li key={link.href}>
                <Link href={link.href} prefetch={false}>
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
