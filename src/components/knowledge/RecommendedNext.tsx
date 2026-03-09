import Link from "next/link";
import Section from "@/components/common/Section";

type RelatedItem = {
  id: string;
  title: string;
  canonicalUrl: string;
  type: string;
  reason: string;
};

type RecommendedNextProps = {
  entityId: string;
  relatedMap: Record<string, RelatedItem[]> | null;
};

const TYPE_LABELS: Record<string, string> = {
  state: "State",
  national: "National",
  rankings: "Ranking",
  methodology: "Methodology",
  vertical: "Vertical",
};

function toPath(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  }
  return url.startsWith("/") ? url : `/${url}`;
}

export default function RecommendedNext({ entityId, relatedMap }: RecommendedNextProps) {
  if (!relatedMap || !relatedMap[entityId] || relatedMap[entityId].length === 0) {
    return null;
  }
  const items = relatedMap[entityId].slice(0, 6);
  return (
    <Section title="Recommended next">
      <ul style={{ paddingLeft: 20, margin: 0, lineHeight: 1.8 }}>
        {items.map((item) => (
          <li key={item.id} style={{ marginBottom: 8 }}>
            <Link href={toPath(item.canonicalUrl)}>{item.title}</Link>
            <span className="muted" style={{ marginLeft: 8, fontSize: 12 }}>
              {TYPE_LABELS[item.type] ?? item.type}
              {item.reason && item.reason !== "Related" ? ` · ${item.reason}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
