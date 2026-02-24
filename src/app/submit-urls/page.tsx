import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { buildAllNormalizedStates } from "@/lib/stateBuilder";

const BASE_URL = SITE_URL;
const PROD_URL = "https://priceofelectricity.com";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "URL Submission Helper | PriceOfElectricity.com",
  description:
    "Helper page for submitting priority URLs to Google Search Console and Bing.",
  alternates: { canonical: `${BASE_URL}/submit-urls` },
  robots: { index: false, follow: false },
};

export default function SubmitUrlsPage() {
  const states = buildAllNormalizedStates()
    .sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0))
    .slice(0, 10);

  const priorityUrls = [
    `${PROD_URL}/`,
    `${PROD_URL}/national`,
    `${PROD_URL}/compare`,
    `${PROD_URL}/drivers`,
    `${PROD_URL}/regulatory`,
    `${PROD_URL}/offers`,
    `${PROD_URL}/alerts`,
    `${PROD_URL}/affordability`,
    `${PROD_URL}/calculator`,
    `${PROD_URL}/value-ranking`,
    ...states.map((s) => `${PROD_URL}/${s.slug}`),
  ];

  const urlBlock = priorityUrls.join("\n");

  return (
    <main className="container">
      <h1>URL Submission Helper</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        Priority URLs for manual submission to search engines. Copy the list
        below and paste into the relevant tool.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>
          Priority URLs ({priorityUrls.length})
        </h2>
        <pre
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            padding: 16,
            fontSize: 13,
            lineHeight: 1.7,
            overflowX: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            userSelect: "all",
          }}
        >
          {urlBlock}
        </pre>
        <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
          Click the block above to select all, then copy.
        </p>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>
          Google Search Console
        </h2>
        <ol style={{ paddingLeft: 20, lineHeight: 1.9 }}>
          <li>
            Open{" "}
            <a
              href="https://search.google.com/search-console"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Search Console
            </a>
          </li>
          <li>
            Select the <code>priceofelectricity.com</code> property
          </li>
          <li>Go to URL Inspection</li>
          <li>Paste each URL and click &quot;Request Indexing&quot;</li>
          <li>
            Also submit the sitemap:{" "}
            <code>{PROD_URL}/sitemap.xml</code>
          </li>
        </ol>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>
          Bing IndexNow
        </h2>
        <p style={{ lineHeight: 1.7 }}>
          If IndexNow is configured, you can submit URLs programmatically:
        </p>
        <pre
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            padding: 16,
            fontSize: 13,
            lineHeight: 1.7,
            overflowX: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
{`curl -X POST ${PROD_URL}/api/indexnow \\
  -H "Content-Type: application/json" \\
  -H "x-indexnow-key: YOUR_KEY" \\
  -d '{"urls": [${priorityUrls
    .slice(0, 5)
    .map((u) => `"${u}"`)
    .join(", ")}]}'`}
        </pre>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>
          Bing Webmaster Tools
        </h2>
        <ol style={{ paddingLeft: 20, lineHeight: 1.9 }}>
          <li>
            Open{" "}
            <a
              href="https://www.bing.com/webmasters"
              target="_blank"
              rel="noopener noreferrer"
            >
              Bing Webmaster Tools
            </a>
          </li>
          <li>Add and verify the site</li>
          <li>
            Submit the sitemap: <code>{PROD_URL}/sitemap.xml</code>
          </li>
        </ol>
      </section>
    </main>
  );
}
