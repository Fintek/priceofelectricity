import Link from "next/link";
import CopyButton from "@/components/common/CopyButton";
import { SITE_URL } from "@/lib/site";

type Release = {
  releaseId?: string;
  sourceVersion?: string;
  contractVersion?: string;
  integrity?: { manifestHash?: string | null };
};

type Capabilities = {
  capabilities?: {
    offersEnabled?: boolean;
    historySnapshots?: boolean;
    bundles?: boolean;
  };
  urls?: {
    docsUrl?: string;
    indexUrl?: string;
  };
};

type PublicEndpoints = {
  groups?: Array<{
    id: string;
    title?: string;
    items?: Array<{ id: string; url: string; kind?: string; description?: string }>;
  }>;
};

export type DataHubHeroProps = {
  release: Release | null;
  capabilities: Capabilities | null;
  endpoints: PublicEndpoints | null;
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

export default function DataHubHero({
  release,
  capabilities,
  endpoints,
}: DataHubHeroProps) {
  const caps = capabilities?.capabilities ?? {};
  const searchIndexItem = endpoints?.groups?.flatMap((g) => g.items ?? []).find(
    (i) => i.id === "knowledge-search-index" || i.url?.includes("search-index"),
  );
  const searchIndexUrl = searchIndexItem?.url ?? "/knowledge/search-index.json";

  return (
    <section
      aria-labelledby="datahub-hero-heading"
      style={{
        padding: 24,
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        backgroundColor: "var(--color-surface-alt)",
        marginBottom: 32,
      }}
    >
      <h1 id="datahub-hero-heading" style={{ fontSize: 28, margin: "0 0 12px 0", fontWeight: 600 }}>
        Data Hub
      </h1>
      <p className="muted" style={{ margin: "0 0 16px 0", fontSize: 15, maxWidth: "60ch" }}>
        Central entry point for electricity data and knowledge surfaces. Datasets for analysis, knowledge pages for LLM ingestion.
      </p>
      <p className="muted" style={{ margin: "0 0 16px 0", fontSize: 15 }}>
        {release?.releaseId ?? "—"} · source {release?.sourceVersion ?? "—"} · contract {release?.contractVersion ?? "—"}
      </p>
      {release?.integrity?.manifestHash && (
        <p style={{ margin: "0 0 16px 0", fontSize: 13 }}>
          <strong>Integrity:</strong>{" "}
          <code style={{ fontSize: 12, wordBreak: "break-all" }}>{release.integrity.manifestHash}</code>
        </p>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <span
          style={{
            padding: "4px 10px",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500,
            backgroundColor: caps.offersEnabled ? "var(--color-success, #22c55e)" : "var(--color-muted)",
            color: caps.offersEnabled ? "#fff" : "var(--color-text)",
          }}
        >
          Offers: {caps.offersEnabled ? "Enabled" : "Disabled"}
        </span>
        <span
          style={{
            padding: "4px 10px",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500,
            backgroundColor: caps.historySnapshots ? "var(--color-success, #22c55e)" : "var(--color-muted)",
            color: caps.historySnapshots ? "#fff" : "var(--color-text)",
          }}
        >
          History: {caps.historySnapshots ? "Enabled" : "Disabled"}
        </span>
        <span
          style={{
            padding: "4px 10px",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500,
            backgroundColor: caps.bundles ? "var(--color-success, #22c55e)" : "var(--color-muted)",
            color: caps.bundles ? "#fff" : "var(--color-text)",
          }}
        >
          Bundles: {caps.bundles ? "Enabled" : "Disabled"}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <Link
          href="/knowledge/pages"
          style={{
            padding: "8px 16px",
            border: "1px solid var(--color-border)",
            borderRadius: 6,
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Knowledge Directory
        </Link>
        <Link
          href="/knowledge/docs"
          style={{
            padding: "8px 16px",
            border: "1px solid var(--color-border)",
            borderRadius: 6,
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Docs
        </Link>
        <Link
          href={toPath(searchIndexUrl)}
          style={{
            padding: "8px 16px",
            border: "1px solid var(--color-border)",
            borderRadius: 6,
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Search Index (JSON)
        </Link>
        <CopyButton
          value={`${SITE_URL}${searchIndexUrl.startsWith("/") ? searchIndexUrl : `/${searchIndexUrl}`}`}
          label="Copy search index URL"
        />
      </div>
    </section>
  );
}
