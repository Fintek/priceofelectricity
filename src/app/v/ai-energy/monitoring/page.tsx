import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import { AI_ENERGY_MONITORING_SOURCES, AI_ENERGY_WATCHLIST } from "@/content/aiEnergy";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

const TITLE = "How to Monitor AI Data Center Impacts on Electricity Prices";
const DESCRIPTION =
  "A reference guide to the sources, signals, and methods useful for tracking how AI data center growth may affect electricity demand and consumer prices.";
const CANONICAL = `${BASE_URL}/v/ai-energy/monitoring`;

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

const CADENCE_LABEL: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
};

const WATCHLIST_CATEGORIES = [
  {
    heading: "Grid capacity signals",
    items: [
      "interconnection-queue",
      "transformer-supply",
      "reserve-margin-trends",
      "grid-upgrade-timelines",
    ],
  },
  {
    heading: "Market pricing signals",
    items: [
      "capacity-market-prices",
      "transmission-congestion",
      "ppa-pricing",
    ],
  },
  {
    heading: "Demand and planning signals",
    items: [
      "peak-demand-forecasts",
      "load-forecast-revisions",
      "data-center-clustering",
      "renewable-deployment-pace",
    ],
  },
  {
    heading: "Regulatory and policy signals",
    items: ["rate-cases", "demand-response"],
  },
];

export default function MonitoringPage() {
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    description: DESCRIPTION,
    url: CANONICAL,
    dateModified: LAST_REVIEWED,
  };

  const watchlistMap = new Map(
    AI_ENERGY_WATCHLIST.map((item) => [item.id, item])
  );

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/">Home</Link> {" → "}
        <Link href="/v/ai-energy">AI Data Centers & Electricity Prices</Link>{" "}
        {" → "} Monitoring
      </p>

      <h1>{TITLE}</h1>

      <p className="intro muted" style={{ marginTop: 0, fontSize: 15 }}>
        Assessing whether and how AI data center growth is affecting electricity
        prices requires drawing on multiple public information sources at
        different cadences. This page organizes those sources and describes what
        signals to look for within each. It is intended as a reference for
        analysts, researchers, and engaged consumers who want to track these
        dynamics over time.
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
        <strong>Monitoring</strong>
        {" · "}
        <Link href="/v/ai-energy/glossary">Glossary</Link>
      </nav>

      {/* Section 1: What signals to watch */}
      <section style={{ marginTop: 8 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>
          What signals to watch
        </h2>
        <p style={{ marginTop: 0, lineHeight: 1.7 }}>
          Price impacts from data center growth do not appear in a single
          indicator. They emerge from the interaction of demand growth, supply
          response, infrastructure constraints, and regulatory decisions. The
          watchlist below organizes key signals into four categories.
        </p>

        {WATCHLIST_CATEGORIES.map((cat) => (
          <div key={cat.heading} style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: 16, marginBottom: 6 }}>{cat.heading}</h3>
            <ul style={{ marginTop: 0, paddingLeft: 20, lineHeight: 1.9 }}>
              {cat.items.map((id) => {
                const item = watchlistMap.get(id);
                if (!item) return null;
                return (
                  <li key={id}>
                    <Link href={`/v/ai-energy/watchlist#${id}`}>
                      {item.title}
                    </Link>
                    {" — "}
                    <span className="muted" style={{ fontSize: 14 }}>
                      {item.whyItMatters.split(".")[0]}.
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <p style={{ marginTop: 12 }}>
          <Link href="/v/ai-energy/watchlist">
            View the full watchlist with monitoring guidance →
          </Link>
        </p>
      </section>

      {/* Section 2: Monitoring sources table */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>
          Monitoring sources
        </h2>
        <p style={{ marginTop: 0, lineHeight: 1.7 }}>
          The following source categories are useful for tracking the signals
          described above. They are organized by approximate update cadence.
          Most are publicly available through government or market operator
          websites.
        </p>

        <div style={{ overflowX: "auto", marginTop: 16 }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid #ddd" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 12px 8px 0",
                    fontWeight: 600,
                    minWidth: 180,
                  }}
                >
                  Source
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 12px",
                    fontWeight: 600,
                    width: 90,
                  }}
                >
                  Cadence
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 0 8px 12px",
                    fontWeight: 600,
                  }}
                >
                  What to look for
                </th>
              </tr>
            </thead>
            <tbody>
              {AI_ENERGY_MONITORING_SOURCES.map((src, i) => (
                <tr
                  key={src.id}
                  style={{
                    borderBottom: "1px solid #eee",
                    backgroundColor: i % 2 === 0 ? "transparent" : "#fafafa",
                    verticalAlign: "top",
                  }}
                >
                  <td
                    style={{
                      padding: "10px 12px 10px 0",
                      fontWeight: 500,
                    }}
                  >
                    <span id={src.id}>{src.name}</span>
                    <p
                      className="muted"
                      style={{
                        marginTop: 2,
                        marginBottom: 0,
                        fontWeight: 400,
                        fontSize: 13,
                        lineHeight: 1.5,
                      }}
                    >
                      {src.description}
                    </p>
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 12,
                        backgroundColor: "#f0f0f0",
                      }}
                    >
                      {CADENCE_LABEL[src.cadence]}
                    </span>
                  </td>
                  <td style={{ padding: "10px 0 10px 12px" }}>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: 18,
                        lineHeight: 1.7,
                        fontSize: 13,
                      }}
                    >
                      {src.whatToLookFor.map((item, j) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 3: How to interpret changes */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>
          How to interpret changes
        </h2>

        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, marginBottom: 4 }}>
            Single signals rarely tell the full story
          </h3>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            A rise in capacity market prices, for example, may reflect demand
            growth from data centers — or it may reflect the retirement of
            aging generation, changes in capacity market rules, or shifts in
            fuel costs. Monitoring multiple signal categories simultaneously
            provides more reliable context than tracking any single indicator.
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, marginBottom: 4 }}>
            Geographic specificity matters
          </h3>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            Grid dynamics vary significantly by region. A constraint in the
            mid-Atlantic may not be observed in the Southwest. For any analysis,
            focusing on the relevant ISO/RTO and state regulatory jurisdiction
            produces more meaningful conclusions than national averages.
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, marginBottom: 4 }}>
            Lag between signal and outcome
          </h3>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            Changes in wholesale electricity markets or utility cost structures
            typically take time to flow through to consumer retail rates.
            Regulatory proceedings, multi-year rate cases, and long-term
            contracts can delay the transmission of market signals to retail
            bills. Observing a change in a leading indicator does not imply an
            immediate change in consumer prices.
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, marginBottom: 4 }}>
            Counteracting forces
          </h3>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            Demand growth may be offset by new generation development, energy
            efficiency improvements, demand response programs, or transmission
            upgrades. Monitoring the pace of these offsetting developments
            alongside demand signals provides a more complete picture of
            potential price outcomes.
          </p>
        </div>
      </section>

      <section
        style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid #eee" }}
      >
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Next steps</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li>
            <Link href="/v/ai-energy/watchlist">
              Full AI energy price watchlist
            </Link>{" "}
            — Detailed guidance for each indicator category
          </li>
          <li>
            <Link href="/v/ai-energy/glossary">
              AI, data centers, and grid pricing glossary
            </Link>{" "}
            — Definitions for terms used on this page
          </li>
          <li>
            <Link href="/compare">Compare current state electricity rates</Link>{" "}
            — Baseline rate data for all 50 states
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
        {" | "}
        <Link href="/methodology">Methodology</Link>
      </p>
    </main>
  );
}
