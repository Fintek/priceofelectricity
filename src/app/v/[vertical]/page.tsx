import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import { VERTICALS, getVertical } from "@/content/verticals";
import { getRelatedLinks } from "@/lib/related";
import RelatedLinks from "@/app/components/RelatedLinks";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 2592000;

type PageParams = Promise<{ vertical: string }>;

export function generateStaticParams() {
  return VERTICALS.map((v) => ({ vertical: v.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { vertical } = await params;
  const v = getVertical(vertical);
  if (!v) return {};

  return {
    title: `${v.name} | PriceOfElectricity.com`,
    description: v.description,
    alternates: { canonical: `${BASE_URL}/v/${v.slug}` },
    openGraph: {
      title: `${v.name} | PriceOfElectricity.com`,
      description: v.description,
      url: `${BASE_URL}/v/${v.slug}`,
    },
  };
}

export default async function VerticalHubPage({
  params,
}: {
  params: PageParams;
}) {
  const { vertical } = await params;
  const v = getVertical(vertical);
  if (!v) notFound();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: v.name,
    description: v.description,
    url: `${BASE_URL}/v/${v.slug}`,
    dateModified: LAST_REVIEWED,
  };

  const hasPillars = v.pillarPages.length > 0;
  const isAiEnergy = v.slug === "ai-energy";

  const aiEnergySubnav = isAiEnergy ? (
    <nav
      style={{
        marginTop: 16,
        marginBottom: 8,
        paddingTop: 10,
        paddingBottom: 10,
        borderTop: "1px solid #eee",
        borderBottom: "1px solid #eee",
        fontSize: 14,
      }}
    >
      <span className="muted" style={{ marginRight: 8 }}>
        In this section:
      </span>
      <Link href="/v/ai-energy/overview">Overview</Link>
      {" · "}
      <Link href="/v/ai-energy/load-growth">Load Growth</Link>
      {" · "}
      <Link href="/v/ai-energy/where-prices-rise">Where Prices Rise</Link>
      {" · "}
      <Link href="/v/ai-energy/watchlist">Watchlist</Link>
      {" · "}
      <Link href="/v/ai-energy/monitoring">Monitoring</Link>
      {" · "}
      <Link href="/v/ai-energy/glossary">Glossary</Link>
    </nav>
  ) : null;

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/">Home</Link> {" → "} Vertical
      </p>

      <h1>{v.name}</h1>

      <p className="intro" style={{ marginTop: 0 }}>
        {v.description}
      </p>

      {aiEnergySubnav}

      {hasPillars ? (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Analysis</h2>
          <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
            {v.pillarPages.map((p) => (
              <li key={p.slug}>
                <Link href={`/v/${v.slug}/${p.slug}`}>{p.title}</Link>
                {" — "}
                <span className="muted">{p.description}</span>
              </li>
            ))}
          </ul>
          {isAiEnergy && (
            <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
              <li>
                <Link href="/v/ai-energy/watchlist">
                  AI Data Center Electricity Price Watchlist
                </Link>{" "}
                — Key indicators and signals to track
              </li>
              <li>
                <Link href="/v/ai-energy/monitoring">
                  How to Monitor AI Data Center Impacts
                </Link>{" "}
                — Sources, cadences, and what to look for
              </li>
              <li>
                <Link href="/v/ai-energy/glossary">
                  AI, Data Centers, and Grid Pricing Glossary
                </Link>{" "}
                — Definitions of key terms
              </li>
            </ul>
          )}
        </section>
      ) : (
        <section style={{ marginTop: 24 }}>
          <p className="muted">
            Content for this vertical is coming soon. Check back for in-depth
            analysis and pillar articles.
          </p>
        </section>
      )}

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>
          Related core tools
        </h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li>
            <Link href="/compare">Compare electricity prices by state</Link>
          </li>
          <li>
            <Link href="/electricity-cost-calculator">Bill calculator</Link>
          </li>
          <li>
            <Link href="/affordability">Affordability index</Link>
          </li>
          <li>
            <Link href="/research">Research & insights</Link>
          </li>
          <li>
            <Link href="/national">National electricity overview</Link>
          </li>
          <li>
            <Link href="/datasets">Data downloads</Link>
          </li>
          <li>
            <Link href="/regulatory">Regulatory & rate-case tracking</Link>
          </li>
          <li>
            <Link href="/drivers">Price drivers</Link>
          </li>
          {isAiEnergy && (
            <li>
              <Link href="/alerts/ai-energy">Get AI Energy alerts</Link>
            </li>
          )}
        </ul>
      </section>

      {isAiEnergy && (
        <RelatedLinks links={getRelatedLinks({ kind: "hub", hub: "ai-energy" })} />
      )}

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/">Home</Link> {" | "}
        <Link href="/research">Research</Link> {" | "}
        <Link href="/methodology">Methodology</Link>
      </p>
    </main>
  );
}
