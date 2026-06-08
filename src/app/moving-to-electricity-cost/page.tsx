import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs, { breadcrumbsToJsonLd, type BreadcrumbItem } from "@/components/navigation/Breadcrumbs";
import { loadEntityIndex } from "@/lib/knowledge/loadKnowledgePage";
import { buildMetadata } from "@/lib/seo/metadata";

import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import { getRelease } from "@/lib/knowledge/fetch";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Electricity Costs When Moving to a New State | PriceOfElectricity.com",
  description:
    "Electricity cost differences between states. See estimated monthly bills when relocating. All estimates assume 900 kWh monthly usage.",
  canonicalPath: "/moving-to-electricity-cost",
});

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function MovingToElectricityCostIndexPage() {
  const entityIndex = await loadEntityIndex();
  const stateEntities =
    entityIndex?.entities
      ?.filter((e) => e.type === "state")
      .sort((a, b) => a.slug.localeCompare(b.slug)) ?? [];

  const breadcrumbTrail: BreadcrumbItem[] = [
    { name: "Home", url: "/" },
    { name: "Data", url: "/data" },
    { name: "Electricity Costs When Moving" },
  ];
  const breadcrumbJsonLd = breadcrumbsToJsonLd(breadcrumbTrail);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <Breadcrumbs trail={breadcrumbTrail} />

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Electricity Costs When Moving to a New State</h1>
        <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
          Electricity costs vary significantly between states. Average residential rates can differ by more than
          a factor of two across the U.S., so moving to a new state can meaningfully change your monthly bill.
        </p>
        <p className="muted" style={{ margin: "0 0 32px 0", maxWidth: "65ch", fontSize: 14 }}>
          All estimates on this page assume 900 kWh monthly usage (10,800 kWh annually). Rates come from EIA data.
          Figures are updated from the latest published EIA data using consistent methodology.
        </p>

        {/* State links */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>By State</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 12,
            }}
          >
            {stateEntities.map((e) => (
              <Link
                key={e.slug}
                href={`/moving-to-electricity-cost/${e.slug}`}
                style={{
                  display: "block",
                  padding: 16,
                  border: "1px solid var(--color-border, #e5e7eb)",
                  borderRadius: 8,
                  backgroundColor: "var(--color-surface-alt, #f9fafb)",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                {e.title ?? slugToDisplayName(e.slug)}
              </Link>
            ))}
          </div>
        </section>

        {/* Related links */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href="/electricity-cost-comparison">Compare electricity prices between states</Link>
              {" — "}
              See state-to-state electricity comparisons
            </li>
            <li>
              <Link href="/electricity-cost">Electricity Cost by State</Link>
              {" — "}
              Compare rates and costs across all states
            </li>
            <li>
              <Link href="/average-electricity-bill">Average Electricity Bill</Link>
              {" — "}
              Monthly and annual bill estimates
            </li>
            <li>
              <Link href="/knowledge">Knowledge</Link>
              {" — "}
              Rates, rankings, affordability, trends
            </li>
            <li>
              <Link href="/electricity-cost-of-living">Compare electricity's role in cost of living</Link>
              {" — "}
              Electricity cost of living by state
            </li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
