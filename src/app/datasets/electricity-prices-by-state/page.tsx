import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { buildMetadata } from "@/lib/seo/metadata";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Electricity Prices by State Dataset | PriceOfElectricity.com",
  description:
    "State-level electricity rates, national comparison, and momentum. Download JSON and CSV.",
  canonicalPath: "/datasets/electricity-prices-by-state",
});

type DatasetRow = {
  slug: string;
  state: string;
  avgRateCentsPerKwh: number | null;
  nationalAverage: number | null;
  differencePercent: number | null;
  momentumSignal: string | null;
  generatedAt?: string;
  sourceVersion?: string;
};

type DatasetBody = {
  schemaVersion: string;
  generatedAt: string;
  sourceVersion: string;
  rowCount: number;
  columns: string[];
  data: DatasetRow[];
};

async function loadPreview(): Promise<DatasetRow[]> {
  try {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const p = join(process.cwd(), "public", "datasets", "electricity-prices-by-state.json");
    const raw = await readFile(p, "utf8");
    const body = JSON.parse(raw) as DatasetBody;
    return (body.data ?? []).slice(0, 10);
  } catch {
    return [];
  }
}

export default async function ElectricityPricesByStateDatasetPage() {
  const previewRows = await loadPreview();

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Electricity Prices by State Dataset",
    description: "State electricity price dataset derived from build-time site data. State-level rates, national comparison, and momentum.",
    url: `${BASE_URL}/datasets/electricity-prices-by-state`,
    distribution: [
      { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${BASE_URL}/datasets/electricity-prices-by-state.json` },
      { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `${BASE_URL}/datasets/electricity-prices-by-state.csv` },
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
        <Link href="/datasets">Datasets</Link> {"→"} Electricity Prices by State
      </p>
      <h1>Electricity Prices by State Dataset</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        State-level average residential electricity rates (¢/kWh) with national
        comparison and momentum signal. Derived from the site&apos;s normalized
        data pipeline.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Columns</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          <li><code>slug</code> — State slug (e.g. california)</li>
          <li><code>state</code> — State name</li>
          <li><code>avgRateCentsPerKwh</code> — Average residential rate (¢/kWh)</li>
          <li><code>nationalAverage</code> — National average rate (¢/kWh)</li>
          <li><code>differencePercent</code> — State vs national (% difference)</li>
          <li><code>momentumSignal</code> — Price momentum (accelerating, decelerating, etc.)</li>
          <li><code>generatedAt</code>, <code>sourceVersion</code> — Build metadata</li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Download</h2>
        <p style={{ margin: "0 0 12px 0" }}>
          <a href="/datasets/electricity-prices-by-state.json" download>
            electricity-prices-by-state.json
          </a>
          {" · "}
          <a href="/datasets/electricity-prices-by-state.csv" download>
            electricity-prices-by-state.csv
          </a>
        </p>
      </section>

      {previewRows.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Preview (first 10 rows)</h2>
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
                  <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--color-border)" }}>slug</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--color-border)" }}>state</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", borderBottom: "1px solid var(--color-border)" }}>avgRateCentsPerKwh</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", borderBottom: "1px solid var(--color-border)" }}>differencePercent</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--color-border)" }}>momentumSignal</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--color-border)" }}>{r.slug}</td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--color-border)" }}>{r.state}</td>
                    <td style={{ textAlign: "right", padding: "8px 12px", borderBottom: "1px solid var(--color-border)" }}>
                      {r.avgRateCentsPerKwh != null ? r.avgRateCentsPerKwh.toFixed(2) : "—"}
                    </td>
                    <td style={{ textAlign: "right", padding: "8px 12px", borderBottom: "1px solid var(--color-border)" }}>
                      {r.differencePercent != null ? r.differencePercent.toFixed(1) : "—"}
                    </td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--color-border)" }}>{r.momentumSignal ?? "—"}</td>
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
          <li><Link href="/electricity-cost">Electricity cost by state</Link></li>
          <li><Link href="/knowledge">Knowledge Hub</Link></li>
          <li><Link href="/methodology/electricity-rates">How electricity rates are presented</Link></li>
        </ul>
      </section>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/datasets">← Back to Datasets</Link>
      </p>
    </main>
  );
}
