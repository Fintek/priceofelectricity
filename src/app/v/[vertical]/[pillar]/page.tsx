import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import {
  getVertical,
  getVerticalPillar,
  getAllVerticalPillarParams,
} from "@/content/verticals";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 2592000;

type PageParams = Promise<{ vertical: string; pillar: string }>;

export function generateStaticParams() {
  return getAllVerticalPillarParams();
}

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { vertical, pillar } = await params;
  const p = getVerticalPillar(vertical, pillar);
  if (!p) return {};

  return {
    title: `${p.title} | PriceOfElectricity.com`,
    description: p.description,
    alternates: { canonical: `${BASE_URL}/v/${vertical}/${p.slug}` },
    openGraph: {
      title: `${p.title} | PriceOfElectricity.com`,
      description: p.description,
      url: `${BASE_URL}/v/${vertical}/${p.slug}`,
    },
  };
}

export default async function VerticalPillarPage({
  params,
}: {
  params: PageParams;
}) {
  const { vertical, pillar } = await params;
  const v = getVertical(vertical);
  const p = getVerticalPillar(vertical, pillar);
  if (!v || !p) notFound();

  const articleStructuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.title,
    description: p.description,
    url: `${BASE_URL}/v/${vertical}/${p.slug}`,
    dateModified: LAST_REVIEWED,
    author: {
      "@type": "Organization",
      name: "PriceOfElectricity.com",
      url: BASE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "PriceOfElectricity.com",
      url: BASE_URL,
    },
  };

  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: BASE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: v.name,
        item: `${BASE_URL}/v/${v.slug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: p.title,
        item: `${BASE_URL}/v/${v.slug}/${p.slug}`,
      },
    ],
  };

  const otherPillars = v.pillarPages.filter((pp) => pp.slug !== p.slug);
  const isAiEnergy = v.slug === "ai-energy";

  const aiEnergySubnav = isAiEnergy ? (
    <nav
      style={{
        marginTop: 16,
        marginBottom: 16,
        paddingTop: 10,
        paddingBottom: 10,
        borderTop: "1px solid #eee",
        borderBottom: "1px solid #eee",
        fontSize: 14,
      }}
    >
      <span className="muted" style={{ marginRight: 8 }}>
        AI & Energy:
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
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleStructuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData),
        }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/">Home</Link> {" → "}
        <Link href={`/v/${v.slug}`}>{v.name}</Link> {" → "}
        {p.title}
      </p>

      <h1>{p.title}</h1>

      <p className="intro muted" style={{ marginTop: 0, fontSize: 15 }}>
        {p.description}
      </p>

      {aiEnergySubnav}

      {p.contentBlocks.map((block, i) => (
        <section key={i} style={{ marginTop: i === 0 ? 16 : 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 6 }}>{block.heading}</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>{block.body}</p>
        </section>
      ))}

      {(otherPillars.length > 0 || isAiEnergy) && (
        <section
          style={{
            marginTop: 28,
            paddingTop: 12,
            borderTop: "1px solid #eee",
          }}
        >
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            More in {v.name}
          </h2>
          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
            {otherPillars.map((pp) => (
              <li key={pp.slug}>
                <Link href={`/v/${v.slug}/${pp.slug}`}>{pp.title}</Link>
              </li>
            ))}
            {isAiEnergy && (
              <>
                <li>
                  <Link href="/v/ai-energy/watchlist">
                    AI Data Center Electricity Price Watchlist
                  </Link>
                </li>
                <li>
                  <Link href="/v/ai-energy/monitoring">
                    How to Monitor AI Data Center Impacts
                  </Link>
                </li>
                <li>
                  <Link href="/v/ai-energy/glossary">
                    AI, Data Centers, and Grid Pricing Glossary
                  </Link>
                </li>
              </>
            )}
            <li>
              <Link href={`/v/${v.slug}`}>
                Back to {v.name} hub
              </Link>
            </li>
          </ul>
        </section>
      )}

      <nav
        style={{
          marginTop: 20,
          paddingTop: 12,
          borderTop: "1px solid #eee",
        }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Related</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li>
            <Link href="/compare">Compare electricity prices by state</Link>
          </li>
          <li>
            <Link href="/research">Research & insights</Link>
          </li>
          <li>
            <Link href="/sources">Data sources</Link>
          </li>
          <li>
            <Link href="/data-policy">Data policy</Link>
          </li>
          <li>
            <Link href="/datasets">Data downloads</Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
