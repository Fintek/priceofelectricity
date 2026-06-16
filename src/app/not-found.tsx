import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFoundPage() {
  return (
    <main className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
      <h1>Page not found</h1>
      <p className="muted" style={{ fontSize: "var(--font-size-lg)", marginTop: 12, marginBottom: 24 }}>
        We couldn&apos;t find that electricity-rate page. You can search the site, compare states,
        estimate a bill, or browse electricity data.
      </p>
      <nav aria-label="Suggested pages">
        <p style={{ marginBottom: 12, fontWeight: 600 }}>Try one of these:</p>
        <ul className="list-unstyled" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <li>
            <Link href="/">Home — average electricity prices overview</Link>
          </li>
          <li>
            <Link href="/search">Search the site</Link>
          </li>
          <li>
            <Link href="/compare">Compare states by electricity rate</Link>
          </li>
          <li>
            <Link href="/electricity-cost-calculator">Electricity cost calculator</Link>
          </li>
          <li>
            <Link href="/electricity-cost">Browse electricity costs by state</Link>
          </li>
          <li>
            <Link href="/datasets">Datasets</Link>
          </li>
          <li>
            <Link href="/methodology">Methodology</Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
