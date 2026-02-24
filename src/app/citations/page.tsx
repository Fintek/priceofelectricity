import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import {
  getSortedCitations,
  getVerifiedCitations,
} from "@/content/citations";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

const TITLE = "Citations & Media Mentions";
const DESCRIPTION =
  "A manually maintained log of citations and media mentions of PriceOfElectricity.com data, methodology, and analysis.";

export const metadata: Metadata = {
  title: `${TITLE} | PriceOfElectricity.com`,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/citations` },
  openGraph: {
    title: `${TITLE} | PriceOfElectricity.com`,
    description: DESCRIPTION,
    url: `${BASE_URL}/citations`,
  },
};

export default function CitationsPage() {
  const citations = getSortedCitations();
  const verified = getVerifiedCitations();
  const allPlaceholders = verified.length === 0;

  const webPageData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    description: DESCRIPTION,
    url: `${BASE_URL}/citations`,
    dateModified: LAST_REVIEWED,
  };

  const itemListData = citations.length > 0 && !allPlaceholders
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Media citations of PriceOfElectricity.com",
        numberOfItems: verified.length,
        itemListElement: verified.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.title,
          ...(c.url ? { url: c.url } : {}),
        })),
      }
    : null;

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageData) }}
      />
      {itemListData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListData) }}
        />
      )}

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/">Home</Link> {" → "} Citations
      </p>

      <h1>{TITLE}</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        This page logs publications, articles, and research that have cited
        PriceOfElectricity.com data or methodology. Citations are added
        manually as they are verified. For media inquiries or to report a
        citation, <Link href="/contact">contact us</Link>.
      </p>

      {allPlaceholders ? (
        <p style={{ marginTop: 20 }}>
          No verified citations yet. Media inquiries welcome —{" "}
          <Link href="/contact">contact us</Link>.
        </p>
      ) : (
        <ul style={{ paddingLeft: 20, marginTop: 20 }}>
          {verified.map((c) => (
            <li key={c.id} style={{ marginBottom: 20 }}>
              <p style={{ margin: 0, fontWeight: 600 }}>
                {c.url ? (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {c.title}
                  </a>
                ) : (
                  c.title
                )}
              </p>
              <p className="muted" style={{ margin: "2px 0 0", fontSize: 13 }}>
                {c.publication} · {c.date}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 14 }}>{c.context}</p>
            </li>
          ))}
        </ul>
      )}

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 10 }}>Attribution & press</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
          <li>
            <Link href="/attribution">How to cite PriceOfElectricity.com</Link>
          </li>
          <li>
            <Link href="/press-kit">Press kit</Link>
          </li>
          <li>
            <Link href="/methodology">Methodology</Link>
          </li>
        </ul>
      </section>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/knowledge">Knowledge pack</Link> {" | "}
        <Link href="/sources">Sources</Link> {" | "}
        <Link href="/contact">Contact</Link>
      </p>
    </main>
  );
}
