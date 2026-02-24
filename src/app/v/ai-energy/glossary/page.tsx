import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import { AI_ENERGY_GLOSSARY } from "@/content/aiEnergy";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

const TITLE = "AI, Data Centers, and Grid Pricing Glossary";
const DESCRIPTION =
  "Definitions of key terms used in discussions of AI data center electricity demand, grid operations, and electricity market pricing.";
const CANONICAL = `${BASE_URL}/v/ai-energy/glossary`;

export const metadata: Metadata = {
  title: `${TITLE} | PriceOfElectricity.com`,
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: `${TITLE} | PriceOfElectricity.com`,
    description: DESCRIPTION,
    url: CANONICAL,
  },
};

function termAnchor(term: string): string {
  return term.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export default function GlossaryPage() {
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    description: DESCRIPTION,
    url: CANONICAL,
    dateModified: LAST_REVIEWED,
  };

  const sorted = [...AI_ENERGY_GLOSSARY].sort((a, b) =>
    a.term.localeCompare(b.term)
  );

  const letters = [...new Set(sorted.map((t) => t.term[0].toUpperCase()))];

  const byLetter = new Map<string, typeof sorted>();
  for (const letter of letters) {
    byLetter.set(
      letter,
      sorted.filter((t) => t.term[0].toUpperCase() === letter)
    );
  }

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/">Home</Link> {" → "}
        <Link href="/v/ai-energy">AI Data Centers & Electricity Prices</Link>{" "}
        {" → "} Glossary
      </p>

      <h1>{TITLE}</h1>

      <p className="intro muted" style={{ marginTop: 0, fontSize: 15 }}>
        This glossary defines terms commonly encountered when analyzing the
        relationship between AI data center growth and electricity markets.
        Definitions reflect general industry usage; specific applications may
        vary by region or regulatory context.
      </p>

      <nav
        style={{
          marginTop: 16,
          marginBottom: 24,
          paddingTop: 10,
          paddingBottom: 10,
          borderTop: "1px solid #eee",
          borderBottom: "1px solid #eee",
          fontSize: 14,
        }}
      >
        <span className="muted" style={{ marginRight: 8 }}>
          AI & Energy:
        </span>
        <Link href="/v/ai-energy/overview">Overview</Link>
        {" · "}
        <Link href="/v/ai-energy/load-growth">Load Growth</Link>
        {" · "}
        <Link href="/v/ai-energy/where-prices-rise">Where Prices Rise</Link>
        {" · "}
        <Link href="/v/ai-energy/watchlist">Watchlist</Link>
        {" · "}
        <Link href="/v/ai-energy/monitoring">Monitoring</Link>
        {" · "}
        <strong>Glossary</strong>
      </nav>

      <nav style={{ marginBottom: 20, fontSize: 14 }}>
        {letters.map((letter, i) => (
          <span key={letter}>
            {i > 0 && " · "}
            <a href={`#section-${letter}`}>{letter}</a>
          </span>
        ))}
      </nav>

      {letters.map((letter) => (
        <section key={letter} id={`section-${letter}`} style={{ marginTop: 28 }}>
          <h2
            style={{
              fontSize: 22,
              marginBottom: 12,
              paddingBottom: 4,
              borderBottom: "2px solid #eee",
            }}
          >
            {letter}
          </h2>
          <dl>
            {byLetter.get(letter)!.map((entry) => (
              <div
                key={entry.term}
                id={termAnchor(entry.term)}
                style={{ marginBottom: 16 }}
              >
                <dt style={{ fontWeight: 600, marginBottom: 3 }}>
                  {entry.term}
                </dt>
                <dd style={{ marginLeft: 0, lineHeight: 1.7 }}>
                  {entry.definition}
                  {entry.related && entry.related.length > 0 && (
                    <span className="muted" style={{ fontSize: 13 }}>
                      {" "}
                      — See also:{" "}
                      {entry.related.map((r, i) => (
                        <span key={r}>
                          {i > 0 && ", "}
                          <a href={`#${termAnchor(r)}`}>{r}</a>
                        </span>
                      ))}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      <section
        style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid #eee" }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Related pages</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li>
            <Link href="/v/ai-energy/watchlist">
              AI energy price watchlist
            </Link>{" "}
            — Indicators to monitor
          </li>
          <li>
            <Link href="/v/ai-energy/monitoring">
              How to monitor AI data center impacts
            </Link>{" "}
            — Sources and what to look for
          </li>
          <li>
            <Link href="/v/ai-energy">
              Back to AI Data Centers & Electricity Prices hub
            </Link>
          </li>
        </ul>
      </section>

      <p className="muted" style={{ marginTop: 24, fontSize: 13 }}>
        <Link href="/sources">Sources</Link>
        {" | "}
        <Link href="/data-policy">Data policy</Link>
        {" | "}
        <Link href="/research">Research</Link>
      </p>
    </main>
  );
}
