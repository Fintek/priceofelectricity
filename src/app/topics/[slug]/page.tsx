import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDES } from "@/data/guides";
import { STATES } from "@/data/states";
import { TOPIC_BY_SLUG } from "@/data/topics";
import { getQuestionSlugs, parseQuestionSlug } from "@/lib/questions";
import { SITE_URL } from "@/lib/site";

const BASE_URL = SITE_URL;
export const dynamicParams = true;
export const revalidate = 2592000;

type TopicParams = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: TopicParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = TOPIC_BY_SLUG[slug];
  if (!topic) {
    return {
      title: "Topic not found | PriceOfElectricity.com",
      description: "Topic page not found.",
      alternates: { canonical: `${BASE_URL}/topics` },
    };
  }

  const title = `${topic.name} | PriceOfElectricity.com`;
  const canonicalUrl = `${BASE_URL}/topics/${topic.slug}`;
  return {
    title,
    description: topic.description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description: topic.description,
      url: canonicalUrl,
      siteName: "PriceOfElectricity.com",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description: topic.description,
    },
  };
}

export default async function TopicPage({
  params,
}: {
  params: TopicParams;
}) {
  const { slug } = await params;
  const topic = TOPIC_BY_SLUG[slug];
  if (!topic) {
    notFound();
  }

  const prefixes = topic.matchPrefixes ?? [];
  const guideLinks = GUIDES.filter((guide) =>
    prefixes.some((prefix) => guide.slug.startsWith(prefix)),
  ).map((guide) => ({
    href: `/guides/${guide.slug}`,
    label: guide.title,
  }));

  const questionLinks = getQuestionSlugs(STATES)
    .filter((questionSlug) => {
      const parsed = parseQuestionSlug(questionSlug);
      return parsed ? prefixes.includes(parsed.template.slugPrefix) : false;
    })
    .map((questionSlug) => {
      const parsed = parseQuestionSlug(questionSlug);
      const state = parsed ? STATES[parsed.stateSlug] : null;
      const label = parsed && state
        ? parsed.template.titleTemplate(state.name)
        : questionSlug;
      return { href: `/questions/${questionSlug}`, label };
    });

  const toolLinks = [...new Set(topic.staticRoutes ?? [])];

  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: topic.name,
    url: `${BASE_URL}/topics/${topic.slug}`,
    description: topic.description,
  };

  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${BASE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Topics",
        item: `${BASE_URL}/topics`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: topic.name,
        item: `${BASE_URL}/topics/${topic.slug}`,
      },
    ],
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />
      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/topics">Topics</Link>
      </p>
      <h1>{topic.name}</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        {topic.description}
      </p>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ marginBottom: 8 }}>Guides</h2>
        {guideLinks.length === 0 ? (
          <p className="muted" style={{ marginTop: 0 }}>
            No guide links configured yet.
          </p>
        ) : (
          <ul style={{ marginTop: 0, paddingLeft: 20 }}>
            {guideLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ marginBottom: 8 }}>Questions</h2>
        {questionLinks.length === 0 ? (
          <p className="muted" style={{ marginTop: 0 }}>
            No question pages configured for this topic.
          </p>
        ) : (
          <ul style={{ marginTop: 0, paddingLeft: 20 }}>
            {questionLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} prefetch={false}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ marginBottom: 8 }}>Tools</h2>
        {toolLinks.length === 0 ? (
          <p className="muted" style={{ marginTop: 0 }}>
            No tools configured for this topic.
          </p>
        ) : (
          <ul style={{ marginTop: 0, paddingLeft: 20 }}>
            {toolLinks.map((route) => (
              <li key={route}>
                <Link href={route}>{route}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
