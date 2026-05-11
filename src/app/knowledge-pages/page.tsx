import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Knowledge JSON Pages | PriceOfElectricity.com",
  description:
    "Static JSON endpoints produced at build time for LLM and agent ingestion of electricity data, state pages, and rankings.",
  canonicalPath: "/knowledge-pages",
  robots: { index: false, follow: true },
});

export default function KnowledgePagesDirectoryPage() {
  return (
    <main className="container">
      <h1>Knowledge JSON Pages</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        These endpoints are static JSON assets produced at build time, designed for LLM
        and agent ingestion.
      </p>
      <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
        <li>
          <Link href="/knowledge/index.json" prefetch={false}>
            /knowledge/index.json
          </Link>
        </li>
        <li>
          <Link href="/knowledge/national.json" prefetch={false}>
            /knowledge/national.json
          </Link>
        </li>
        <li>
          <Link href="/knowledge/state/texas.json" prefetch={false}>
            /knowledge/state/texas.json
          </Link>
        </li>
      </ul>
    </main>
  );
}
