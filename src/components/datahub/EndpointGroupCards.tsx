import Link from "next/link";
import CopyButton from "@/components/common/CopyButton";
import { SITE_URL } from "@/lib/site";

type EndpointItem = {
  id: string;
  url: string;
  kind?: string;
  description?: string;
};

type EndpointGroup = {
  id: string;
  title?: string;
  items?: EndpointItem[];
};

type EndpointGroupCardsProps = {
  groups: EndpointGroup[];
};

function toPath(url: string): string {
  if (url.startsWith("http")) {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  }
  return url;
}

export default function EndpointGroupCards({ groups }: EndpointGroupCardsProps) {
  if (!groups?.length) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {groups.map((group) => (
        <section key={group.id} aria-labelledby={`group-${group.id}`}>
          <h2 id={`group-${group.id}`} style={{ fontSize: 18, marginBottom: 16, fontWeight: 600 }}>
            {group.title ?? group.id}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {(group.items ?? []).map((item) => {
              const path = toPath(item.url);
              const fullUrl = path.startsWith("/") ? `${SITE_URL}${path}` : path;
              return (
                <div
                  key={item.id}
                  style={{
                    padding: 16,
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    backgroundColor: "var(--color-surface-alt)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{item.id}</span>
                    <CopyButton value={fullUrl} label={`Copy ${item.url}`} />
                  </div>
                  <Link
                    href={path}
                    style={{ fontSize: 14, wordBreak: "break-all", textDecoration: "underline" }}
                  >
                    {item.url}
                  </Link>
                  {item.description && (
                    <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                      {item.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
