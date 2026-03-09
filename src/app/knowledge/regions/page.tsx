import type { Metadata } from "next";
import Link from "next/link";
import { loadRegionsIndex } from "@/lib/knowledge/loadKnowledgePage";
import KnowledgeHeader from "@/app/components/knowledge/KnowledgeHeader";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Regions | PriceOfElectricity.com",
  description:
    "Electricity rates and metrics by U.S. Census region: Northeast, Midwest, South, West.",
  canonicalPath: "/knowledge/regions",
});

export default async function RegionsIndexPage() {
  const [index, release] = await Promise.all([
    loadRegionsIndex(),
    getRelease(),
  ]);

  const regions = index?.regions ?? [];

  return (
    <main className="container">
      <nav aria-label="Knowledge navigation" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
        <Link href="/data">Data Hub</Link>
        {" · "}
        <Link href="/knowledge">Knowledge</Link>
        {" · "}
        <Link href="/knowledge/pages">States directory</Link>
      </nav>
      <KnowledgeHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Knowledge", href: "/knowledge" },
          { label: "Regions" },
        ]}
        title="Regional Electricity Metrics"
        jsonUrl="/knowledge/regions/index.json"
      />
      <p className="muted" style={{ marginTop: 0, marginBottom: 24 }}>
        U.S. Census Bureau regions: Northeast, Midwest, South, West. Aggregate electricity rates and state rankings by region.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {regions.map((r) => {
          const rc = r as { stateCount?: number; averageRateCentsPerKwh?: number | null };
          return (
            <Link
              key={r.id}
              href={r.href}
              style={{
                display: "block",
                padding: 16,
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <strong style={{ fontSize: 16 }}>{r.name}</strong>
                {!r.enabled && (
                  <span
                    style={{
                      padding: "2px 6px",
                      fontSize: 11,
                      backgroundColor: "var(--color-border)",
                      borderRadius: 4,
                    }}
                  >
                    Incomplete mapping
                  </span>
                )}
              </div>
              {(rc.stateCount != null || rc.averageRateCentsPerKwh != null) && (
                <p style={{ margin: "0 0 4px 0", fontSize: 13 }}>
                  {rc.stateCount != null && <span>{rc.stateCount} states</span>}
                  {rc.stateCount != null && rc.averageRateCentsPerKwh != null && " · "}
                  {rc.averageRateCentsPerKwh != null && <span>{rc.averageRateCentsPerKwh.toFixed(2)} ¢/kWh avg</span>}
                </p>
              )}
              <p className="muted" style={{ margin: 0, fontSize: 14 }}>
                {r.excerpt}
              </p>
            </Link>
          );
        })}
      </div>

      {regions.length === 0 && (
        <p className="muted">No region data available. Run knowledge:build to generate.</p>
      )}

      <Disclaimers disclaimerRefs={["general-site"]} />
      <StatusFooter release={release} />
    </main>
  );
}
