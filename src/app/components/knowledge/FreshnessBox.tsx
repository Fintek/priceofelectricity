import Link from "next/link";
import { t } from "@/lib/knowledge/labels";

export type FreshnessData = {
  datasetUpdatedAt: string;
  computedAt: string;
  status: "fresh" | "aging" | "stale" | "unknown";
  ageDays?: number;
  methodology: {
    id: string;
    version: string;
    url: string;
    canonicalUrl: string;
  };
};

type FreshnessBoxProps = {
  freshness: FreshnessData;
};

export default function FreshnessBox({ freshness }: FreshnessBoxProps) {
  const methodologyPath = freshness.methodology.canonicalUrl.startsWith("http")
    ? new URL(freshness.methodology.canonicalUrl).pathname
    : freshness.methodology.canonicalUrl;

  return (
    <aside
      role="complementary"
      aria-label="Data freshness"
      style={{
        padding: 16,
        border: "1px solid #ddd",
        borderRadius: 8,
        backgroundColor: "#f9f9f9",
        marginBottom: 24,
      }}
    >
      <h3 style={{ fontSize: 14, margin: "0 0 12px 0", fontWeight: 600 }}>
        {t("section.freshness")}
      </h3>
      <dl style={{ margin: 0, fontSize: 14 }}>
        <dt className="muted" style={{ marginTop: 8 }}>{t("dl.status")}</dt>
        <dd style={{ margin: "2px 0 0 0", textTransform: "capitalize" }}>
          {t(`status.${freshness.status}`)}
        </dd>
        <dt className="muted" style={{ marginTop: 8 }}>{t("dl.datasetUpdatedAt")}</dt>
        <dd style={{ margin: "2px 0 0 0" }}>{freshness.datasetUpdatedAt}</dd>
        {freshness.ageDays !== undefined && (
          <>
            <dt className="muted" style={{ marginTop: 8 }}>{t("dl.ageDays")}</dt>
            <dd style={{ margin: "2px 0 0 0" }}>{freshness.ageDays}</dd>
          </>
        )}
      </dl>
      <p style={{ margin: "12px 0 0 0", fontSize: 13 }}>
        <Link href={methodologyPath} className="muted" style={{ textDecoration: "underline" }}>
          {t("link.freshnessMethodology")}
        </Link>
      </p>
    </aside>
  );
}
