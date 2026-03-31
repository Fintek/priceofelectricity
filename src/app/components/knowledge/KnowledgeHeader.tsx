import Link from "next/link";
import KnowledgeBadges from "./KnowledgeBadges";
import CopyButton from "@/components/common/CopyButton";
import { SITE_URL } from "@/lib/site";
import { t } from "@/lib/knowledge/labels";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type KnowledgeHeaderProps = {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  jsonUrl: string;
  canonicalUrl?: string;
  qualityScore?: number;
  freshnessStatus?: string;
  ageDays?: number;
  sourceVersion?: string;
  semanticCluster?: string;
  methodologyLink?: boolean;
};

export default function KnowledgeHeader({
  breadcrumbs,
  title,
  jsonUrl,
  canonicalUrl,
  qualityScore,
  freshnessStatus,
  ageDays,
  sourceVersion,
  semanticCluster,
  methodologyLink,
}: KnowledgeHeaderProps) {
  const jsonPath = jsonUrl.startsWith("http")
    ? new URL(jsonUrl).pathname
    : jsonUrl;
  const canonicalPath = canonicalUrl?.replace(/^https?:\/\/[^/]+/, "") ?? null;

  const hasBadges = freshnessStatus || typeof qualityScore === "number" || sourceVersion || semanticCluster;

  return (
    <header style={{ marginBottom: 24 }}>
      <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 8 }}>
        {breadcrumbs.map((item, i) => (
          <span key={i}>
            {item.href ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span>{item.label}</span>
            )}
            {i < breadcrumbs.length - 1 && " → "}
          </span>
        ))}
      </nav>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>{title}</h1>
        <a
          href={jsonPath}
          target="_blank"
          rel="noopener noreferrer"
          className="muted"
          style={{
            fontSize: 14,
            padding: "4px 10px",
            border: "1px solid currentColor",
            borderRadius: 4,
            textDecoration: "none",
          }}
        >
          {t("nav.viewJson")}
        </a>
        <CopyButton value={jsonUrl.startsWith("http") ? jsonUrl : `${SITE_URL}${jsonPath.startsWith("/") ? jsonPath : `/${jsonPath}`}`} label="Copy JSON URL" />
        {canonicalPath && (
          <>
            <Link href={canonicalPath} className="muted" style={{ fontSize: 14, textDecoration: "underline" }}>
              View page
            </Link>
            <CopyButton value={canonicalUrl!.startsWith("http") ? canonicalUrl! : `${SITE_URL}${canonicalPath}`} label="Copy page URL" />
          </>
        )}
        <Link href="/data" className="muted" style={{ fontSize: 14, textDecoration: "underline" }}>
          {t("nav.backToDataHub")}
        </Link>
        <Link href="/knowledge" className="muted" style={{ fontSize: 14, textDecoration: "underline" }}>
          Knowledge
        </Link>
        <Link
          href="/knowledge/pages"
          className="muted"
          style={{ fontSize: 14, textDecoration: "underline" }}
        >
          {t("nav.backToKnowledgeDirectory")}
        </Link>
        {methodologyLink && (
          <Link href="/methodology" className="muted" style={{ fontSize: 14, textDecoration: "underline" }}>
            See methodology
          </Link>
        )}
      </div>
      {hasBadges && (
        <KnowledgeBadges
          freshnessStatus={freshnessStatus}
          ageDays={ageDays}
          qualityScore={qualityScore}
          sourceVersion={sourceVersion}
          semanticCluster={semanticCluster}
        />
      )}
    </header>
  );
}
