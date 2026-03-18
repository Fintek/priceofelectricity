import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import { getGeneratedPage } from "@/lib/templateGenerator";

const BASE_URL = SITE_URL;
export const dynamicParams = true;
export const revalidate = 2592000;

type PageParams = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getGeneratedPage(slug);
  if (!page) return {};

  return {
    title: `${page.title} | PriceOfElectricity.com`,
    description: page.description,
    alternates: { canonical: `${BASE_URL}/generated/${page.slug}` },
    openGraph: {
      title: `${page.title} | PriceOfElectricity.com`,
      description: page.description,
      url: `${BASE_URL}/generated/${page.slug}`,
    },
  };
}

export default async function GeneratedPage({
  params,
}: {
  params: PageParams;
}) {
  const { slug } = await params;
  const page = getGeneratedPage(slug);
  if (!page) notFound();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description: page.description,
    url: `${BASE_URL}/generated/${page.slug}`,
    dateModified: LAST_REVIEWED,
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href={`/${page.stateSlug}`}>{page.stateSlug}</Link> {"→"}{" "}
        {page.type}
      </p>

      <h1>{page.title}</h1>

      {page.contentBlocks.map((block, i) => (
        <section key={i} style={{ marginTop: i === 0 ? 12 : 20 }}>
          <h2 style={{ fontSize: 20, marginBottom: 6 }}>{block.heading}</h2>
          {block.body.includes("\n") ? (
            <ul style={{ marginTop: 0, paddingLeft: 20, lineHeight: 1.8 }}>
              {block.body.split("\n").map((line, j) => (
                <li key={j}>{line}</li>
              ))}
            </ul>
          ) : (
            <p style={{ marginTop: 0 }}>{block.body}</p>
          )}
        </section>
      ))}

      <nav style={{ marginTop: 28, paddingTop: 12, borderTop: "1px solid #eee" }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Related</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li>
            <Link href={`/${page.stateSlug}`}>
              {page.stateSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} electricity rates
            </Link>
          </li>
          <li>
            <Link href="/compare">Compare all states</Link>
          </li>
          <li>
            <Link href="/electricity-cost-calculator">Bill calculator</Link>
          </li>
          <li>
            <Link href={`/${page.stateSlug}/plans`}>Plans</Link>
          </li>
          <li>
            <Link href="/affordability">Affordability index</Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
