import Link from "next/link";

export default function KnowledgeNotFound() {
  return (
    <main className="container" style={{ paddingTop: 48, paddingBottom: 48 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Not found</h1>
      <p className="muted" style={{ marginBottom: 24, fontSize: 16 }}>
        We couldn&apos;t find that page.
      </p>
      <nav aria-label="Navigation" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Link href="/knowledge">Knowledge Home</Link>
        <Link href="/knowledge/pages">States directory</Link>
        <Link href="/knowledge/rankings">Rankings</Link>
        <Link href="/knowledge/pages">Methodologies</Link>
        <Link href="/data">Data Hub</Link>
      </nav>
    </main>
  );
}
