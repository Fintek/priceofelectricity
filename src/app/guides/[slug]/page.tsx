import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDE_BY_SLUG } from "@/data/guides";
import { STATES } from "@/data/states";
import { getTopicsByPrefixMatch } from "@/data/topics";
import { LAST_REVIEWED, SITE_URL } from "@/lib/site";
import { getRelatedForGuide } from "@/lib/related";
import RelatedLinks from "@/app/components/RelatedLinks";

const BASE_URL = SITE_URL;
export const dynamicParams = true;
export const revalidate = 2592000;

type GuideParams = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: GuideParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = GUIDE_BY_SLUG[slug];
  if (!guide) {
    return {
      title: "Guide not found | PriceOfElectricity.com",
      description: "Guide page not found.",
      alternates: { canonical: `${BASE_URL}/guides` },
    };
  }

  const title = `${guide.title} | PriceOfElectricity.com`;
  const canonicalUrl = `${BASE_URL}/guides/${guide.slug}`;

  return {
    title,
    description: guide.description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description: guide.description,
      url: canonicalUrl,
      siteName: "PriceOfElectricity.com",
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description: guide.description,
    },
  };
}

export default async function GuideDetailPage({
  params,
}: {
  params: GuideParams;
}) {
  const { slug } = await params;
  const guide = GUIDE_BY_SLUG[slug];
  if (!guide) {
    notFound();
  }

  const relatedStateLinks = (guide.relatedStates ?? [])
    .filter((stateSlug) => Boolean(STATES[stateSlug]))
    .slice(0, 3)
    .map((stateSlug) => ({
      slug: stateSlug,
      name: STATES[stateSlug].name,
    }));
  const relatedTopics = getTopicsByPrefixMatch(guide.slug).slice(0, 2);

  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: guide.title,
    url: `${BASE_URL}/guides/${guide.slug}`,
    description: guide.description,
  };

  const articleStructuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    author: {
      "@type": "Organization",
      name: "PriceOfElectricity.com",
    },
    dateModified: LAST_REVIEWED,
    mainEntityOfPage: `${BASE_URL}/guides/${guide.slug}`,
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleStructuredData) }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/guides">Electricity Guides</Link>
      </p>
      <h1>{guide.title}</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        {guide.description}
      </p>

      {guide.body.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}

      <section style={{ marginTop: 24 }}>
        <h2 style={{ marginBottom: 8 }}>Related tools and pages</h2>
        <ul style={{ marginTop: 0, paddingLeft: 20 }}>
          <li>
            <Link href="/electricity-cost-calculator">Electricity bill calculator</Link>
          </li>
          <li>
            <Link href="/compare">Compare electricity prices by state</Link>
          </li>
          {relatedStateLinks.map((state) => (
            <li key={state.slug}>
              <Link href={`/${state.slug}`}>{state.name} electricity page</Link>
            </li>
          ))}
        </ul>
      </section>
      {relatedTopics.length > 0 ? (
        <section style={{ marginTop: 20 }}>
          <h2 style={{ marginBottom: 8 }}>Related topics</h2>
          <ul style={{ marginTop: 0, paddingLeft: 20 }}>
            {relatedTopics.map((topic) => (
              <li key={topic.slug}>
                <Link href={`/topics/${topic.slug}`}>{topic.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <RelatedLinks links={getRelatedForGuide(slug)} />
    </main>
  );
}
