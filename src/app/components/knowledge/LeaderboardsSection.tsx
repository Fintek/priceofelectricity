import Link from "next/link";
import type { LeaderboardsData } from "@/lib/knowledge/loadKnowledgePage";

function formatValue(metricId: string, value: number): string {
  if (metricId === "avgRateCentsPerKwh") {
    return `${value.toFixed(2)} ¢/kWh`;
  }
  if (metricId === "valueScore" || metricId === "affordabilityIndex") {
    return value.toFixed(1);
  }
  return String(value);
}

export default function LeaderboardsSection({
  data,
}: {
  data: LeaderboardsData | null;
}) {
  if (!data || !data.leaderboards?.length) return null;

  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 20, marginBottom: 12 }}>Leaderboards</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {data.leaderboards.map((lb) => (
          <div
            key={lb.id}
            style={{
              padding: 16,
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              backgroundColor: "var(--color-surface-alt)",
            }}
          >
            <h3 style={{ fontSize: 16, marginBottom: 12, marginTop: 0 }}>
              {lb.title}
            </h3>
            <ol
              style={{
                margin: 0,
                paddingLeft: 20,
                lineHeight: 1.8,
                fontSize: 14,
              }}
            >
              {lb.items.map((item) => (
                <li key={item.slug}>
                  <Link href={`/knowledge/state/${item.slug}`}>{item.name}</Link>
                  {" — "}
                  <span className="muted">
                    {formatValue(lb.metricId, item.value)}
                  </span>
                </li>
              ))}
            </ol>
            <p style={{ marginTop: 12, marginBottom: 0, fontSize: 13 }}>
              <Link
                href={
                  lb.canonicalUrl.startsWith("http")
                    ? new URL(lb.canonicalUrl).pathname
                    : lb.canonicalUrl
                }
                className="muted"
              >
                View full ranking →
              </Link>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
