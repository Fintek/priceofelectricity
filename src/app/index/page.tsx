import type { Metadata } from "next";
import Link from "next/link";
import { STATE_LIST } from "@/data/states";

const BASE_URL = "https://priceofelectricity.com";

export const dynamic = "force-static";
export const revalidate = 2592000;

export const metadata: Metadata = {
  title: "Site Index | PriceOfElectricity.com",
  description:
    "Crawl-friendly index of core pages, feeds, agent files, states, and utility pages.",
  alternates: {
    canonical: `${BASE_URL}/index`,
  },
};

export default function SiteIndexPage() {
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Site Index",
    url: `${BASE_URL}/index`,
    description:
      "Crawl-friendly index of core pages, feeds, agent files, states, and utility pages.",
  };

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageStructuredData),
        }}
      />
      <h1 style={{ fontSize: 36, marginBottom: 8 }}>Site Index</h1>
      <p style={{ color: "#555", marginTop: 0 }}>
        This page links major sections and state resources for easier crawling and
        navigation.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 24, marginBottom: 8 }}>Core pages</h2>
        <ul style={{ marginTop: 0, paddingLeft: 20 }}>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/about">About</Link>
          </li>
          <li>
            <Link href="/compare">Compare</Link>
          </li>
          <li>
            <Link href="/electricity-cost-calculator">Calculator</Link>
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 24, marginBottom: 8 }}>Feeds and agent files</h2>
        <ul style={{ marginTop: 0, paddingLeft: 20 }}>
          <li>
            <Link href="/sitemap.xml">sitemap.xml</Link>
          </li>
          <li>
            <Link href="/robots.txt">robots.txt</Link>
          </li>
          <li>
            <Link href="/llms.txt">llms.txt</Link>
          </li>
          <li>
            <Link href="/feed.xml">feed.xml</Link>
          </li>
          <li>
            <Link href="/atom.xml">atom.xml</Link>
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 24, marginBottom: 8 }}>States</h2>
        <ul style={{ marginTop: 0, paddingLeft: 20 }}>
          {STATE_LIST.map((state) => (
            <li key={state.slug} style={{ marginBottom: 4 }}>
              <Link href={`/${state.slug}`} prefetch={false}>
                {state.name}
              </Link>{" "}
              {"—"}{" "}
              {state.avgRateCentsPerKwh.toFixed(2)}¢/kWh
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 24, marginBottom: 8 }}>Utilities</h2>
        <ul style={{ marginTop: 0, paddingLeft: 20 }}>
          {STATE_LIST.map((state) => (
            <li key={`${state.slug}-utilities`} style={{ marginBottom: 4 }}>
              <Link href={`/${state.slug}/utilities`} prefetch={false}>
                Utilities in {state.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
