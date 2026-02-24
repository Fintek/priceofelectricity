import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { STATES } from "@/data/states";
import { normalizeSlug } from "@/data/slug";

const BASE_URL = "https://priceofelectricity.com";
export const dynamic = "force-static";
export const revalidate = 2592000;

type PairParams = Promise<{ pair: string }>;

function getTopHighAndLowSlugs() {
  const entries = Object.entries(STATES);
  const topHigh = [...entries]
    .sort((a, b) => b[1].avgRateCentsPerKwh - a[1].avgRateCentsPerKwh)
    .slice(0, 10)
    .map(([slug]) => slug);
  const topLow = [...entries]
    .sort((a, b) => a[1].avgRateCentsPerKwh - b[1].avgRateCentsPerKwh)
    .slice(0, 10)
    .map(([slug]) => slug);
  return { topHigh, topLow };
}

function getGeneratedPairs() {
  const { topHigh, topLow } = getTopHighAndLowSlugs();
  const pairs = new Set<string>();

  for (const highSlug of topHigh) {
    for (const lowSlug of topLow) {
      if (highSlug === lowSlug) {
        continue;
      }
      const [a, b] = [highSlug, lowSlug].sort((x, y) => x.localeCompare(y));
      pairs.add(`${a}-vs-${b}`);
    }
  }

  return [...pairs].sort((a, b) => a.localeCompare(b));
}

function parsePair(rawPair: string) {
  const parts = rawPair.split("-vs-");
  if (parts.length !== 2) {
    return null;
  }

  const first = normalizeSlug(parts[0]);
  const second = normalizeSlug(parts[1]);
  if (!first || !second || first === second) {
    return null;
  }

  return {
    a: first,
    b: second,
    canonicalPair: [first, second].sort((x, y) => x.localeCompare(y)).join("-vs-"),
  };
}

export function generateStaticParams() {
  return getGeneratedPairs().map((pair) => ({ pair }));
}

export async function generateMetadata({
  params,
}: {
  params: PairParams;
}): Promise<Metadata> {
  const { pair } = await params;
  const parsed = parsePair(pair);
  if (!parsed) {
    return {
      title: "Comparison not found | PriceOfElectricity.com",
      description: "Comparison page not found.",
      alternates: { canonical: `${BASE_URL}/compare` },
    };
  }

  const { a, b, canonicalPair } = parsed;
  const stateA = STATES[a];
  const stateB = STATES[b];
  if (!stateA || !stateB) {
    return {
      title: "Comparison not found | PriceOfElectricity.com",
      description: "Comparison page not found.",
      alternates: { canonical: `${BASE_URL}/compare` },
    };
  }

  const diff = Math.abs(stateA.avgRateCentsPerKwh - stateB.avgRateCentsPerKwh);
  const title = `${stateA.name} vs ${stateB.name} Electricity Price (¢/kWh Comparison)`;
  const description = `${stateA.name} (${stateA.avgRateCentsPerKwh.toFixed(2)}¢/kWh) vs ${stateB.name} (${stateB.avgRateCentsPerKwh.toFixed(2)}¢/kWh). Difference: ${diff.toFixed(2)}¢/kWh.`;
  const canonicalUrl = `${BASE_URL}/compare/${canonicalPair}`;

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

export default async function StateComparisonPage({
  params,
}: {
  params: PairParams;
}) {
  const { pair } = await params;
  const parsed = parsePair(pair);
  if (!parsed) {
    notFound();
  }

  const { a, b, canonicalPair } = parsed;
  if (pair !== canonicalPair) {
    permanentRedirect(`/compare/${canonicalPair}`);
  }

  const stateA = STATES[a];
  const stateB = STATES[b];
  if (!stateA || !stateB || a === b) {
    notFound();
  }

  const rateA = stateA.avgRateCentsPerKwh;
  const rateB = stateB.avgRateCentsPerKwh;
  const diffCents = Math.abs(rateA - rateB);
  const billA = (1000 * rateA) / 100;
  const billB = (1000 * rateB) / 100;
  const billDiff = Math.abs(billA - billB);
  const cheaper =
    rateA < rateB ? stateA.name : rateB < rateA ? stateB.name : "Neither state";

  const faqQ1 = `Which state has cheaper electricity, ${stateA.name} or ${stateB.name}?`;
  const faqA1 =
    rateA === rateB
      ? `${stateA.name} and ${stateB.name} have the same average residential electricity rate in this dataset.`
      : `${cheaper} has the lower average residential electricity rate.`;
  const faqQ2 = `How much more expensive is ${stateA.name} than ${stateB.name} per 1000 kWh?`;
  const faqA2 = `At 1000 kWh, the estimated energy-only bill difference is $${billDiff.toFixed(2)}.`;
  const faqQ3 = "Are these energy-only estimates?";
  const faqA3 =
    "Yes. These estimates are energy-only and exclude delivery fees, taxes, and fixed charges.";

  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${stateA.name} vs ${stateB.name}: Electricity Price Comparison`,
    url: `${BASE_URL}/compare/${canonicalPair}`,
    description: `${stateA.name} vs ${stateB.name} electricity price comparison using average residential rates.`,
  };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: faqQ1, acceptedAnswer: { "@type": "Answer", text: faqA1 } },
      { "@type": "Question", name: faqQ2, acceptedAnswer: { "@type": "Answer", text: faqA2 } },
      { "@type": "Question", name: faqQ3, acceptedAnswer: { "@type": "Answer", text: faqA3 } },
    ],
  };

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />

      <h1 style={{ fontSize: 36, marginBottom: 8 }}>
        {stateA.name} vs {stateB.name}: Electricity Price Comparison
      </h1>

      <section style={{ marginTop: 12 }}>
        <p style={{ marginTop: 0 }}>
          <b>{stateA.name}</b>: {rateA.toFixed(2)}¢/kWh
        </p>
        <p style={{ marginTop: 4 }}>
          <b>{stateB.name}</b>: {rateB.toFixed(2)}¢/kWh
        </p>
        <p style={{ marginTop: 4 }}>Difference: <b>{diffCents.toFixed(2)}¢/kWh</b></p>
        <p style={{ marginTop: 4 }}>
          1000 kWh bill difference (energy-only): <b>${billDiff.toFixed(2)}</b>
        </p>
      </section>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 18 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "10px 8px" }}>
              State
            </th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "10px 8px" }}>
              Avg rate (¢/kWh)
            </th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "10px 8px" }}>
              Example 1000 kWh bill
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ borderBottom: "1px solid #eee", padding: "10px 8px" }}>{stateA.name}</td>
            <td style={{ borderBottom: "1px solid #eee", padding: "10px 8px" }}>{rateA.toFixed(2)}</td>
            <td style={{ borderBottom: "1px solid #eee", padding: "10px 8px" }}>${billA.toFixed(2)}</td>
          </tr>
          <tr>
            <td style={{ borderBottom: "1px solid #eee", padding: "10px 8px" }}>{stateB.name}</td>
            <td style={{ borderBottom: "1px solid #eee", padding: "10px 8px" }}>{rateB.toFixed(2)}</td>
            <td style={{ borderBottom: "1px solid #eee", padding: "10px 8px" }}>${billB.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <p style={{ marginTop: 16 }}>
        Which is cheaper?{" "}
        <b>
          {rateA === rateB
            ? `${stateA.name} and ${stateB.name} are tied at this average rate.`
            : `${cheaper} has the lower average electricity rate.`}
        </b>
      </p>

      <p style={{ marginTop: 16 }}>
        <Link href={`/${a}`}>{stateA.name} page</Link> {" | "}
        <Link href={`/${b}`}>{stateB.name} page</Link> {" | "}
        <Link href="/compare">Back to compare</Link> {" | "}
        <Link href="/calculator">National calculator</Link>
      </p>
    </main>
  );
}
