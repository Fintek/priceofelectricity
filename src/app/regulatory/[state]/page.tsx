import type { Metadata } from "next";
import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STATES } from "@/data/states";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import { isValidStateSlug } from "@/lib/slugGuard";
import { getRateCasesForState, getTimelineForState } from "@/content/regulatory";
import { getRelatedLinks } from "@/lib/related";
import RelatedLinks from "@/app/components/RelatedLinks";

const BASE_URL = SITE_URL;
export const dynamicParams = true;
export const revalidate = 2592000;

type PageParams = Promise<{ state: string }>;

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { state } = await params;
  if (!isValidStateSlug(state)) return {};
  const s = STATES[state];
  const title = `${s.name} Regulatory Overview`;
  const description = `Track rate cases, regulatory decisions, and timeline events for electricity in ${s.name}.`;

  return {
    title: `${title} | PriceOfElectricity.com`,
    description,
    alternates: { canonical: `${BASE_URL}/regulatory/${state}` },
    openGraph: {
      title: `${title} | PriceOfElectricity.com`,
      description,
      url: `${BASE_URL}/regulatory/${state}`,
    },
  };
}

export default function StateRegulatoryPage({
  params,
}: {
  params: PageParams;
}) {
  const { state } = use(params);
  if (!isValidStateSlug(state)) notFound();

  const s = STATES[state];
  const rateCases = getRateCasesForState(state);
  const timeline = getTimelineForState(state);

  const openCount = rateCases.filter((rc) => rc.status === "open").length;
  const timelineCount = timeline.length;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${s.name} Regulatory Overview`,
    description: `Rate cases, regulatory decisions, and timeline events for electricity in ${s.name}.`,
    url: `${BASE_URL}/regulatory/${state}`,
    dateModified: LAST_REVIEWED,
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/">Home</Link> {" → "}
        <Link href="/regulatory">Regulatory</Link> {" → "} {s.name}
      </p>

      <h1>{s.name} Regulatory Overview</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        Regulatory activity and rate-case tracking for {s.name}. Rate cases
        filed with the state public utility commission can directly affect
        residential electricity prices. This information is maintained manually
        and is not legal advice.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Summary</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li>
            Open rate cases: <b>{openCount}</b>
          </li>
          <li>
            Total timeline events: <b>{timelineCount}</b>
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Explore</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
          <li>
            <Link href={`/regulatory/${state}/rate-cases`}>
              All rate cases in {s.name}
            </Link>
          </li>
          <li>
            <Link href={`/regulatory/${state}/timeline`}>
              Full regulatory timeline for {s.name}
            </Link>
          </li>
        </ul>
      </section>

      <RelatedLinks links={getRelatedLinks({ kind: "state", state, from: "regulatory" })} />
    </main>
  );
}
