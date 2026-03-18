import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  loadRegionDetail,
  loadRegionRankings,
} from "@/lib/knowledge/loadKnowledgePage";
import KnowledgeHeader from "@/app/components/knowledge/KnowledgeHeader";
import MiniBarChart from "@/components/charts/MiniBarChart";
import Section from "@/components/common/Section";
import ShareBar from "@/components/common/ShareBar";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import { SITE_URL } from "@/lib/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { getRelease } from "@/lib/knowledge/fetch";

const BASE_URL = SITE_URL;
export const dynamicParams = true;
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await loadRegionDetail(id);
  if (!data) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that region.",
      canonicalPath: `/knowledge/regions/${id}`,
    });
  }
  const title = `${data.name} Electricity Rates | PriceOfElectricity.com`;
  const description = data.excerpt ?? `Electricity rates and metrics for ${data.name} U.S. states.`;
  return buildMetadata({ title, description, canonicalPath: `/knowledge/regions/${id}` });
}

export default async function RegionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [data, rankings, release] = await Promise.all([
    loadRegionDetail(id),
    loadRegionRankings(id),
    getRelease(),
  ]);

  if (!data) notFound();

  const canonicalPath = `/knowledge/regions/${id}`;
  const jsonUrlPath = `/knowledge/regions/${id}.json`;

  return (
    <main className="container">
      <nav aria-label="Knowledge navigation" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
        <Link href="/data">Data Hub</Link>
        {" · "}
        <Link href="/knowledge">Knowledge</Link>
        {" · "}
        <Link href="/knowledge/regions">Regions</Link>
      </nav>
      <KnowledgeHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Knowledge", href: "/knowledge" },
          { label: "Regions", href: "/knowledge/regions" },
          { label: data.name },
        ]}
        title={`${data.name} Electricity Rates`}
        jsonUrl={`${BASE_URL}${jsonUrlPath}`}
      />
      <ShareBar
        canonicalUrl={`${BASE_URL}${canonicalPath}`}
        jsonUrl={`${BASE_URL}${jsonUrlPath}`}
      />

      {!data.enabled ? (
        <Section title="Incomplete mapping">
          <p className="muted">
            This region has incomplete or unknown state mapping. Data may be limited.
          </p>
          <p className="muted">{data.excerpt}</p>
        </Section>
      ) : (
        <>
          <Section title="Summary" subtitle="Aggregate metrics for states in this region.">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div style={{ padding: 12, border: "1px solid var(--color-border)", borderRadius: 8, backgroundColor: "var(--color-surface-alt)" }}>
                <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>States</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{data.stateCount}</div>
              </div>
              <div style={{ padding: 12, border: "1px solid var(--color-border)", borderRadius: 8, backgroundColor: "var(--color-surface-alt)" }}>
                <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Average rate</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{data.averageRateCentsPerKwh.toFixed(2)} ¢/kWh</div>
              </div>
              <div style={{ padding: 12, border: "1px solid var(--color-border)", borderRadius: 8, backgroundColor: "var(--color-surface-alt)" }}>
                <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Median rate</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{data.medianRateCentsPerKwh.toFixed(2)} ¢/kWh</div>
              </div>
            </div>
          </Section>

          <Section title="Highest and lowest" subtitle="States with highest and lowest electricity rates in this region.">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Highest</div>
                {data.highestState?.slug ? (
                  <Link href={`/knowledge/state/${data.highestState.slug}`}>
                    {data.highestState.name} ({data.highestState.rate.toFixed(2)} ¢/kWh)
                  </Link>
                ) : (
                  <span>—</span>
                )}
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Lowest</div>
                {data.lowestState?.slug ? (
                  <Link href={`/knowledge/state/${data.lowestState.slug}`}>
                    {data.lowestState.name} ({data.lowestState.rate.toFixed(2)} ¢/kWh)
                  </Link>
                ) : (
                  <span>—</span>
                )}
              </div>
            </div>
          </Section>

          {data.top5Highest?.length > 0 && (
            <Section title="Top 5 highest" subtitle="Most expensive states in this region.">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--color-border)" }}>State</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", borderBottom: "1px solid var(--color-border)" }}>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top5Highest.map((s) => (
                    <tr key={s.slug}>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--color-border)" }}>
                        <Link href={`/knowledge/state/${s.slug}`}>{s.name}</Link>
                      </td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--color-border)", textAlign: "right" }}>
                        {s.rate.toFixed(2)} ¢/kWh
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {data.top5Lowest?.length > 0 && (
            <Section title="Top 5 lowest" subtitle="Cheapest states in this region.">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--color-border)" }}>State</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", borderBottom: "1px solid var(--color-border)" }}>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top5Lowest.map((s) => (
                    <tr key={s.slug}>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--color-border)" }}>
                        <Link href={`/knowledge/state/${s.slug}`}>{s.name}</Link>
                      </td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--color-border)", textAlign: "right" }}>
                        {s.rate.toFixed(2)} ¢/kWh
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {data.top5Highest?.length > 0 && data.top5Lowest?.length > 0 && (
            <Section title="Comparison chart" subtitle="Top 5 highest vs top 5 lowest (¢/kWh).">
              <div style={{ overflowX: "auto", maxWidth: "100%" }}>
                <MiniBarChart
                  rows={[
                    ...data.top5Highest.map((s) => ({ label: s.name, value: s.rate })),
                    ...data.top5Lowest.map((s) => ({ label: s.name, value: s.rate })),
                  ]}
                  minValue={0}
                  width={400}
                  height={Math.min(240, (data.top5Highest.length + data.top5Lowest.length) * 28 + 60)}
                  title={`${data.name} top and bottom states`}
                  subtitle="¢/kWh"
                  formatValue={(v) => `${v.toFixed(2)} ¢/kWh`}
                />
              </div>
            </Section>
          )}

          {rankings && (rankings.cheapestStates?.length > 0 || rankings.mostExpensiveStates?.length > 0) && (
            <Section title="Within-region rankings" subtitle="Cheapest and most expensive states.">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div>
                  <h4 style={{ margin: "0 0 8px 0", fontSize: 14 }}>Cheapest (top 10)</h4>
                  <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
                    {rankings.cheapestStates.slice(0, 10).map((s) => (
                      <li key={s.slug}>
                        <Link href={`/knowledge/state/${s.slug}`}>{s.name}</Link>
                        {" "}({s.rate.toFixed(2)} ¢/kWh)
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 style={{ margin: "0 0 8px 0", fontSize: 14 }}>Most expensive (top 10)</h4>
                  <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
                    {rankings.mostExpensiveStates.slice(0, 10).map((s) => (
                      <li key={s.slug}>
                        <Link href={`/knowledge/state/${s.slug}`}>{s.name}</Link>
                        {" "}({s.rate.toFixed(2)} ¢/kWh)
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Section>
          )}
        </>
      )}

      <Disclaimers disclaimerRefs={["general-site"]} />
      <StatusFooter release={release} />
    </main>
  );
}
