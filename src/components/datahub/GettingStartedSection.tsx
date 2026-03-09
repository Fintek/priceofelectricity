import Link from "next/link";
import CopyButton from "@/components/common/CopyButton";
import { SITE_URL } from "@/lib/site";

type StarterPackStep = {
  step: number;
  id: string;
  url: string;
  why?: string;
};

type StarterPack = {
  recommendedOrder?: StarterPackStep[];
};

export type GettingStartedSectionProps = {
  starterPack: StarterPack | null;
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

export default function GettingStartedSection({ starterPack }: GettingStartedSectionProps) {
  const steps = starterPack?.recommendedOrder;
  if (!steps?.length) return null;

  return (
    <section aria-labelledby="getting-started-heading" style={{ marginBottom: 32 }}>
      <h2 id="getting-started-heading" style={{ fontSize: 22, marginBottom: 16, fontWeight: 600 }}>
        Getting started
      </h2>
      <p className="muted" style={{ margin: "0 0 16px 0", fontSize: 14 }}>
        Recommended ingestion order for knowledge JSON. See{" "}
        <Link href="/knowledge/ingest/starter-pack.json">starter-pack.json</Link> for full details.
      </p>
      <ol style={{ paddingLeft: 24, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {steps.map((item) => {
          const path = toPath(item.url);
          const fullUrl = path.startsWith("/") ? `${SITE_URL}${path}` : path;
          return (
            <li key={item.step} style={{ lineHeight: 1.6 }}>
              <strong>Step {item.step}</strong>: {item.id}
              {item.why && (
                <span className="muted" style={{ marginLeft: 8, fontSize: 14 }}>
                  — {item.why}
                </span>
              )}
              <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Link href={path} style={{ fontSize: 14, textDecoration: "underline" }}>
                  {item.url}
                </Link>
                <CopyButton value={fullUrl} label={`Copy ${item.url}`} />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
