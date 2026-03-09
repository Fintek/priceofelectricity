import Link from "next/link";

export const dynamic = "force-static";
export const revalidate = 86400;

export default function KnowledgePagesDirectoryPage() {
  return (
    <main className="container">
      <h1>Knowledge JSON Pages</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        These endpoints are build-generated static JSON assets designed for LLM
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
