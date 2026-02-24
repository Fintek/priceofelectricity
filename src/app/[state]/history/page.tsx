import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STATES } from "@/data/states";
import { normalizeSlug } from "@/data/slug";
import { isValidStateSlug } from "@/lib/slugGuard";
import { HISTORY_BY_STATE } from "@/data/history";
import { LAST_REVIEWED, SITE_URL, UPDATE_CADENCE_TEXT } from "@/lib/site";

const BASE_URL = SITE_URL;
const FLAT_THRESHOLD_CENTS = 0.5;
const SPARK_CHARS = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];

export const dynamic = "force-static";
export const revalidate = 2592000;

type HistoryParams = Promise<{ state: string }>;

export function generateStaticParams() {
  return Object.keys(STATES).map((state) => ({ state }));
}

function resolveState(rawState: string) {
  const stateSlug = normalizeSlug(rawState);
  if (!isValidStateSlug(stateSlug)) return null;
  const state = STATES[stateSlug];
  return { stateSlug, state };
}

function getTrend(first: number, last: number): "Up" | "Down" | "Flat" {
  const diff = last - first;
  if (Math.abs(diff) < FLAT_THRESHOLD_CENTS) {
    return "Flat";
  }
  return diff > 0 ? "Up" : "Down";
}

function getSparkline(values: number[]): string {
  if (values.length === 0) {
    return "";
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return "▅".repeat(values.length);
  }

  return values
    .map((value) => {
      const normalized = (value - min) / (max - min);
      const index = Math.round(normalized * (SPARK_CHARS.length - 1));
      return SPARK_CHARS[index];
    })
    .join("");
}

export async function generateMetadata({
  params,
}: {
  params: HistoryParams;
}): Promise<Metadata> {
  const { state } = await params;
  const resolved = resolveState(state);

  if (!resolved) {
    return {
      title: "State not found | PriceOfElectricity.com",
      description: "State history page not found.",
      alternates: { canonical: `${BASE_URL}/` },
    };
  }

  const { stateSlug, state: stateInfo } = resolved;
  const title = `${stateInfo.name} Electricity Price History | PriceOfElectricity.com`;
  const description = `Monthly average residential electricity price trend in ${stateInfo.name} (¢/kWh).`;
  const canonicalUrl = `${BASE_URL}/${stateSlug}/history`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "PriceOfElectricity.com",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function StateHistoryPage({
  params,
}: {
  params: HistoryParams;
}) {
  const { state } = await params;
  const resolved = resolveState(state);
  if (!resolved) {
    notFound();
  }

  const { stateSlug, state: stateInfo } = resolved;
  const history = HISTORY_BY_STATE[stateSlug];
  const description = `Monthly average residential electricity price trend in ${stateInfo.name} (¢/kWh).`;
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${stateInfo.name} Electricity Price History`,
    url: `${BASE_URL}/${stateSlug}/history`,
    description,
  };

  if (!history || history.series.length === 0) {
    return (
      <main className="container">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageStructuredData) }}
        />
        <h1>{stateInfo.name} Electricity Price History</h1>
        <p className="muted" style={{ marginTop: 0, marginBottom: 8 }}>
          {UPDATE_CADENCE_TEXT} {"•"} Last reviewed {LAST_REVIEWED} {"•"}{" "}
          <Link href="/about">Methodology</Link>
        </p>
        <p className="muted">History coming soon.</p>
        <p>
          <Link href={`/${stateSlug}`}>Back to {stateInfo.name} page</Link>
        </p>
      </main>
    );
  }

  const firstValue = history.series[0].avgRateCentsPerKwh;
  const lastValue = history.series[history.series.length - 1].avgRateCentsPerKwh;
  const trend = getTrend(firstValue, lastValue);
  const sparkline = getSparkline(history.series.map((point) => point.avgRateCentsPerKwh));

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageStructuredData) }}
      />
      <h1>{stateInfo.name} Electricity Price History</h1>
      <p className="muted" style={{ marginTop: 0, marginBottom: 8 }}>
        {UPDATE_CADENCE_TEXT} {"•"} Last reviewed {LAST_REVIEWED} {"•"}{" "}
        <Link href="/about">Methodology</Link>
      </p>
      <p className="muted intro" style={{ marginTop: 0 }}>
        This monthly series shows the state-level average residential electricity
        price in cents per kWh and is intended for trend context.
      </p>

      <p>
        <b>Trend:</b> {trend} ({firstValue.toFixed(2)}¢ → {lastValue.toFixed(2)}¢)
      </p>
      <p>
        <b>Sparkline:</b> <span aria-label="Monthly trend sparkline">{sparkline}</span>
      </p>
      <p className="muted" style={{ marginTop: 6 }}>
        Source:{" "}
        {history.sourceUrl ? (
          <Link href={history.sourceUrl}>{history.sourceName ?? "History source"}</Link>
        ) : (
          history.sourceName ?? "History source unavailable"
        )}{" "}
        (updated {history.updated})
      </p>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">Avg rate (¢/kWh)</th>
            </tr>
          </thead>
          <tbody>
            {history.series.map((point) => (
              <tr key={point.ym}>
                <td>{point.ym}</td>
                <td>{point.avgRateCentsPerKwh.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
