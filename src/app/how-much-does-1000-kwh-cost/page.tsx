import type { Metadata } from "next";
import Link from "next/link";
import { loadKnowledgePage, loadEntityIndex } from "@/lib/knowledge/loadKnowledgePage";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";

const USAGE_KWH = 1000;
const BASE_PATH = "/how-much-does-1000-kwh-cost";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "How Much Does 1000 kWh Cost? | PriceOfElectricity.com",
  description:
    "Estimate electricity cost for 1000 kWh. Cost depends on your state's rate. See national average and state-by-state estimates.",
  canonicalPath: BASE_PATH,
});

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function HowMuchDoes1000KwhCostPage() {
  const [nationalPage, entityIndex] = await Promise.all([
    loadKnowledgePage("national", "national"),
    loadEntityIndex(),
  ]);
  const nationalData = nationalPage?.data as { derived?: { averageRate?: number } } | null;
  const nationalAvg =
    typeof nationalData?.derived?.averageRate === "number" ? nationalData.derived.averageRate : null;
  const nationalCost =
    nationalAvg != null ? (nationalAvg / 100) * USAGE_KWH : null;

  const stateEntities =
    entityIndex?.entities
      ?.filter((e) => e.type === "state")
      .sort((a, b) => a.slug.localeCompare(b.slug)) ?? [];

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "How Much Does 1000 kWh Cost?", url: BASE_PATH },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/electricity-cost-calculator">Electricity Cost Calculator</Link>
          {" · "}
          <span aria-current="page">How Much Does 1000 kWh Cost?</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>How Much Does 1000 kWh Cost?</h1>

        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            1000 kWh per month represents moderate to high electricity usage—typical for larger homes, more appliances,
            or regions with significant heating or cooling needs. Your actual cost depends on your electricity rate.
          </p>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity cost = rate (¢/kWh) × usage (kWh). State electricity rates differ widely across the U.S.,
            so the same 1000 kWh can cost significantly more or less depending on where you live.
          </p>
          {nationalCost != null && nationalAvg != null && (
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
                marginBottom: 24,
              }}
            >
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>National estimate (U.S. average rate)</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>${nationalCost.toFixed(2)}</div>
              <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>
                At {nationalAvg.toFixed(2)}¢/kWh average
              </div>
            </div>
          )}
          <p className="muted" style={{ margin: "0 0 24px 0", maxWidth: "65ch", fontSize: 14 }}>
            Rates from EIA data. All figures are build-generated and deterministic.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>1000 kWh Cost by State</h2>
          <p style={{ margin: "0 0 16px 0", maxWidth: "65ch", fontSize: 14 }}>
            Select a state to see the estimated cost of 1000 kWh at that state&apos;s average residential rate.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 8,
            }}
          >
            {stateEntities.map((e) => (
              <Link
                key={e.slug}
                href={`${BASE_PATH}/${e.slug}`}
                style={{
                  display: "block",
                  padding: 10,
                  border: "1px solid var(--color-border, #e5e7eb)",
                  borderRadius: 6,
                  backgroundColor: "var(--color-surface-alt, #f9fafb)",
                  textDecoration: "none",
                  color: "inherit",
                  fontSize: 14,
                }}
              >
                {e.title ?? slugToDisplayName(e.slug)}
              </Link>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/electricity-cost">Electricity Cost by State</Link></li>
            <li><Link href="/electricity-cost-calculator">Electricity Cost Calculator</Link></li>
            <li><Link href="/average-electricity-bill">Average Electricity Bill</Link></li>
            <li><Link href="/electricity-affordability">Electricity Affordability</Link></li>
            <li><Link href="/electricity-cost-of-living">Electricity Cost of Living</Link></li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
