import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STATES } from "@/data/states";
import {
  getSource,
  SOURCES,
  getStatesBySourceSlug,
} from "@/data/sources";
import { SITE_URL } from "@/lib/site";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 2592000;

type SourceParams = Promise<{ slug: string }>;

export function generateStaticParams() {
  return SOURCES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: SourceParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const source = getSource(slug);

  if (!source) {
    return {
      title: "Source not found | PriceOfElectricity.com",
      description: "Data source not found.",
      alternates: { canonical: `${BASE_URL}/sources` },
    };
  }

  const title = `${source.name} | Data Sources`;
  const description = source.description;
  const canonicalUrl = `${BASE_URL}/sources/${slug}`;

  return {
    title: `${title} | PriceOfElectricity.com`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${title} | PriceOfElectricity.com`,
      description,
      url: canonicalUrl,
      siteName: "PriceOfElectricity.com",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${title} | PriceOfElectricity.com`,
      description,
    },
  };
}

export default async function SourcePage({
  params,
}: {
  params: SourceParams;
}) {
  const { slug } = await params;
  const source = getSource(slug);

  if (!source) {
    notFound();
  }

  const statesUsingSource = getStatesBySourceSlug(slug, STATES);

  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: source.name,
    url: source.url,
    ...(source.publisher && { parentOrganization: { "@type": "Organization", name: source.publisher } }),
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationStructuredData),
        }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/sources">Data Sources</Link> {"→"} {source.name}
      </p>

      <h1>{source.name}</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        {source.description}
      </p>

      {source.publisher ? (
        <p className="muted" style={{ marginTop: 8 }}>
          Publisher: {source.publisher}
        </p>
      ) : null}

      <p style={{ marginTop: 12 }}>
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Visit {source.name} →
        </a>
      </p>

      {statesUsingSource.length > 0 ? (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 22, marginBottom: 8 }}>
            States using this source
          </h2>
          <ul style={{ paddingLeft: 20, marginTop: 0 }}>
            {statesUsingSource.map((stateSlug) => (
              <li key={stateSlug} style={{ marginBottom: 6 }}>
                <Link href={`/${stateSlug}`}>{STATES[stateSlug].name}</Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="muted" style={{ marginTop: 24 }}>
          No states currently use this source in our dataset.
        </p>
      )}

      <p style={{ marginTop: 24 }}>
        <Link href="/sources">Back to all sources</Link>
      </p>
    </main>
  );
}
