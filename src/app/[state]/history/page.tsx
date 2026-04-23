import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STATES } from "@/data/states";
import { normalizeSlug } from "@/data/slug";
import { isValidStateSlug } from "@/lib/slugGuard";
import { HISTORY_BY_STATE } from "@/data/history";
import { LAST_REVIEWED_DISPLAY, SITE_URL, UPDATE_CADENCE_TEXT } from "@/lib/site";

const BASE_URL = SITE_URL;
const FLAT_THRESHOLD_CENTS = 0.5;

export const dynamic = "force-dynamic";
export const revalidate = 2592000;

type HistoryParams = Promise<{ state: string }>;
type HistorySearchParams = Promise<{ range?: string | string[] }>;
const RECENT_MONTHS = 24;

export function generateStaticParams() {
  return Object.keys(STATES).map((state) => ({ state }));
}

function resolveState(rawState: string) {
  const raw = rawState.trim();
  if (/^[A-Za-z]{2}$/.test(raw)) {
    const postal = raw.toUpperCase();
    const state = Object.values(STATES).find((s) => s.postal.toUpperCase() === postal);
    if (!state) return null;
    return { stateSlug: state.slug, state };
  }

  const stateSlug = normalizeSlug(raw);
  if (!isValidStateSlug(stateSlug)) return null;
  const state = STATES[stateSlug];
  return { stateSlug, state };
}

function buildHistoryKeyCandidates(stateParam: string): string[] {
  const candidates: string[] = [];
  const pushCandidate = (value: string | null | undefined) => {
    if (!value) return;
    if (!candidates.includes(value)) candidates.push(value);
  };

  pushCandidate(stateParam);
  pushCandidate(stateParam.toUpperCase());
  pushCandidate(stateParam.toLowerCase());

  const normalized = normalizeSlug(stateParam);
  const stateRecord = Object.values(STATES).find(
    (s) => s.slug === normalized || s.name.toLowerCase() === stateParam.toLowerCase(),
  );

  if (stateRecord) {
    const code = stateRecord.postal;
    const name = stateRecord.name;
    const slug = stateRecord.slug;

    pushCandidate(code);
    pushCandidate(code.toUpperCase());
    pushCandidate(code.toLowerCase());
    pushCandidate(name);
    pushCandidate(name.toUpperCase());
    pushCandidate(name.toLowerCase());
    pushCandidate(slug);
    pushCandidate(slug.toUpperCase());
    pushCandidate(slug.toLowerCase());
  }

  return candidates;
}

function getTrend(first: number, last: number): "Up" | "Down" | "Flat" {
  const diff = last - first;
  if (Math.abs(diff) < FLAT_THRESHOLD_CENTS) {
    return "Flat";
  }
  return diff > 0 ? "Up" : "Down";
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
  searchParams,
}: {
  params: HistoryParams;
  searchParams: HistorySearchParams;
}) {
  const { state } = await params;
  const resolvedSearchParams = await searchParams;
  const stateParam = state;
  const resolved = resolveState(stateParam);
  if (!resolved) {
    notFound();
  }

  const { stateSlug, state: stateInfo } = resolved;
  const historyKey = buildHistoryKeyCandidates(stateParam).find(
    (key) => HISTORY_BY_STATE[key] !== undefined,
  );
  const history = historyKey ? HISTORY_BY_STATE[historyKey] : undefined;
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
          {UPDATE_CADENCE_TEXT} {"•"} Last reviewed {LAST_REVIEWED_DISPLAY} {"•"}{" "}
          <Link href="/about">Methodology</Link>
        </p>
        <p className="muted">History coming soon.</p>
        <p>
          <Link href={`/${stateSlug}`}>Back to {stateInfo.name} page</Link>
        </p>
      </main>
    );
  }

  const rangeValue = Array.isArray(resolvedSearchParams?.range)
    ? resolvedSearchParams.range[0]
    : resolvedSearchParams?.range;
  const range = typeof rangeValue === "string" && rangeValue.trim().toLowerCase() === "all"
    ? "all"
    : "24";
  const fullSeries = history.series;
  const displayedSeries =
    range === "all"
      ? fullSeries
      : fullSeries.slice(-24);
  if (range === "all" && displayedSeries.length < fullSeries.length) {
    throw new Error(`History range bug: all=${displayedSeries.length} full=${fullSeries.length}`);
  }
  const firstValue = displayedSeries[0].avgRateCentsPerKwh;
  const lastValue = displayedSeries[displayedSeries.length - 1].avgRateCentsPerKwh;
  const trend = getTrend(firstValue, lastValue);
  const firstPeriod = displayedSeries[0].ym;
  const lastPeriod = displayedSeries[displayedSeries.length - 1].ym;

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageStructuredData) }}
      />
      <h1>{stateInfo.name} Electricity Price History</h1>
      <p className="muted" style={{ marginTop: 0, marginBottom: 8 }}>
        {UPDATE_CADENCE_TEXT} {"•"} Last reviewed {LAST_REVIEWED_DISPLAY} {"•"}{" "}
        <Link href="/about">Methodology</Link>
      </p>
      <p className="muted intro" style={{ marginTop: 0 }}>
        This monthly series shows the state-level average residential electricity
        price in cents per kWh and is intended for trend context.
      </p>

      <p>
        <b>Trend:</b> {trend} from {firstPeriod} ({firstValue.toFixed(2)}¢/kWh) to{" "}
        {lastPeriod} ({lastValue.toFixed(2)}¢/kWh)
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
      <p className="muted" style={{ marginTop: 6 }}>
        Showing {displayedSeries.length} of {history.series.length} months.{" "}
        {range === "all" ? (
          <Link href={`/${stateSlug}/history?range=24`}>Last {RECENT_MONTHS} months</Link>
        ) : (
          <Link href={`/${stateSlug}/history?range=all`}>All history</Link>
        )}
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
            {displayedSeries.map((point) => (
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
