import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { buildMetadata } from "@/lib/seo/metadata";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Electricity Rankings Dataset | PriceOfElectricity.com",
  description:
    "All state electricity rankings in one dataset. Rate, affordability, inflation. Download JSON and CSV.",
  canonicalPath: "/datasets/electricity-rankings",
});

type RankingRow = {
  rankingId: string;
  rankingTitle: string;
  state: string;
  value: number | null;
  displayValue: string | null;
  direction: string;
  directionLabel?: string;
  metricId: string;
};

function sortOrderPlainLanguage(direction: string): string {
  if (direction === "asc") return "Lowest to highest";
  if (direction === "desc") return "Highest to lowest";
  return direction;
}

type DatasetBody = {
  schemaVersion: string;
  generatedAt: string;
  sourceVersion: string;
  rowCount: number;
  columns: string[];
  data: RankingRow[];
};

async function loadPreview(): Promise<RankingRow[]> {
  try {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const p = join(process.cwd(), "public", "datasets", "electricity-rankings.json");
    const raw = await readFile(p, "utf8");
    const body = JSON.parse(raw) as DatasetBody;
    return (body.data ?? []).slice(0, 15);
  } catch {
    return [];
  }
}

export default async function ElectricityRankingsDatasetPage() {
  const previewRows = await loadPreview();

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Electricity Rankings Dataset",
    description: "Electricity rankings dataset derived from build-time site data. Rate, affordability, value score, inflation rankings.",
    url: `${BASE_URL}/datasets/electricity-rankings`,
    distribution: [
      { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${BASE_URL}/datasets/electricity-rankings.json` },
      { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `${BASE_URL}/datasets/electricity-rankings.csv` },
    ],
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(datasetSchema),
        }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/datasets">Datasets</Link> {"→"} Electricity Rankings
      </p>
      <h1>Electricity Rankings Dataset</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        All state electricity rankings in one flat dataset. Includes rate
        rankings, affordability, value score, inflation (1-year and 5-year),
        and momentum. Derived from the site&apos;s ranking pages.
      </p>
      <p className="muted" style={{ marginTop: 12, fontSize: "var(--font-size-sm)", maxWidth: 640 }}>
        <strong>Sort order:</strong> Each ranking orders states high-to-low or low-to-high depending on the table. The
        downloads include both a readable sort-order column and short spreadsheet codes (<code>asc</code> /{" "}
        <code>desc</code>) stored under the technical column name <code>direction</code>.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Columns</h2>
        <p className="muted" style={{ marginTop: 0, marginBottom: 12, fontSize: "var(--font-size-sm)", maxWidth: 640 }}>
          Download files use stable column names for compatibility.
        </p>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          <li>
            <strong>Ranking</strong> — Shared label for rows from the same leaderboard (such as affordability or highest
            average rate). In the downloadable files, this field is named <code>rankingId</code>.
          </li>
          <li>
            <strong>Ranking title</strong> — Full title shown on the site for that leaderboard. In the downloadable
            files, this field is named <code>rankingTitle</code>.
          </li>
          <li>
            <strong>State</strong> — State name. In the downloadable files, this field is named <code>state</code>.
          </li>
          <li>
            <strong>Metric value</strong> — Numeric value used when ordering the ranking. In the downloadable files,
            this field is named <code>value</code>.
          </li>
          <li>
            <strong>Display value</strong> — Same number formatted for display when the site provides one. In the
            downloadable files, this field is named <code>displayValue</code>.
          </li>
          <li>
            <strong>Sort code</strong> — Short ascending/descending code for spreadsheets. In the downloadable files,
            this field is named <code>direction</code> (values such as <code>asc</code> or <code>desc</code>).
          </li>
          <li>
            <strong>Sort order</strong> — Plain-language ordering such as “Lowest to highest.” In the downloadable
            files, this field is named <code>directionLabel</code>.
          </li>
          <li>
            <strong>Metric key</strong> — Site&apos;s identifier for which metric this row uses. In the downloadable
            files, this field is named <code>metricId</code>.
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Download</h2>
        <p style={{ margin: "0 0 12px 0" }}>
          <a href="/datasets/electricity-rankings.json" download>
            electricity-rankings.json
          </a>
          {" · "}
          <a href="/datasets/electricity-rankings.csv" download>
            electricity-rankings.csv
          </a>
        </p>
      </section>

      {previewRows.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Preview (first 15 rows)</h2>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
              }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--color-border)" }}>
                    Ranking
                  </th>
                  <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--color-border)" }}>
                    State
                  </th>
                  <th style={{ textAlign: "right", padding: "8px 12px", borderBottom: "1px solid var(--color-border)" }}>
                    Metric value
                  </th>
                  <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--color-border)" }}>
                    Sort order
                  </th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--color-border)" }}>{r.rankingId}</td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--color-border)" }}>{r.state}</td>
                    <td style={{ textAlign: "right", padding: "8px 12px", borderBottom: "1px solid var(--color-border)" }}>
                      {r.value != null ? (Number.isInteger(r.value) ? r.value : r.value.toFixed(2)) : "—"}
                    </td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--color-border)" }}>
                      {r.directionLabel ?? sortOrderPlainLanguage(r.direction)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Related</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li><Link href="/knowledge/rankings">Browse rankings</Link></li>
          <li><Link href="/knowledge">Knowledge</Link></li>
          <li><Link href="/methodology">Methodology</Link></li>
        </ul>
      </section>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/datasets">← Back to Datasets</Link>
      </p>
    </main>
  );
}
