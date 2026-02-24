import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

const TITLE = "AI & Data Center Electricity Alerts";
const DESCRIPTION =
  "Subscribe to alerts on AI data center electricity demand: load growth monitoring, transmission constraints, capacity price signals, and regulatory impacts.";

export const metadata: Metadata = {
  title: `${TITLE} | PriceOfElectricity.com`,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/alerts/ai-energy` },
  openGraph: {
    title: `${TITLE} | PriceOfElectricity.com`,
    description: DESCRIPTION,
    url: `${BASE_URL}/alerts/ai-energy`,
  },
};

const FIELD_STYLE = { marginBottom: 20 };
const LABEL_STYLE = {
  display: "block" as const,
  fontWeight: 600,
  marginBottom: 6,
  fontSize: 15,
};
const INPUT_STYLE = {
  display: "block" as const,
  width: "100%",
  maxWidth: 420,
  padding: "8px 10px",
  fontSize: 15,
  border: "1px solid #ccc",
  borderRadius: 4,
  boxSizing: "border-box" as const,
};
const SELECT_STYLE = { ...INPUT_STYLE };
const CHECKBOX_ROW_STYLE = {
  display: "flex" as const,
  alignItems: "center" as const,
  gap: 8,
  marginBottom: 8,
  fontSize: 15,
};

export default function AiEnergyAlertsPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    description: DESCRIPTION,
    url: `${BASE_URL}/alerts/ai-energy`,
    dateModified: LAST_REVIEWED,
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/">Home</Link> {" → "}
        <Link href="/alerts">Alerts</Link> {" → "} AI & Energy
      </p>

      <h1>{TITLE}</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        Track the intersection of AI infrastructure growth and electricity
        prices. Alerts cover:
      </p>
      <ul className="muted" style={{ paddingLeft: 20, lineHeight: 2, marginTop: 0 }}>
        <li>
          <b>Load growth monitoring</b> — signals from grid operators and ISOs
          that may indicate rising demand from large data center clusters
        </li>
        <li>
          <b>Transmission constraints</b> — bottlenecks that can affect
          locational marginal prices in affected regions
        </li>
        <li>
          <b>Capacity price signals</b> — capacity market developments that may
          flow through to retail rates
        </li>
        <li>
          <b>Regulatory impacts</b> — rate cases or commission orders that
          reference large-load or data center interconnection
        </li>
      </ul>

      <section style={{ marginTop: 28 }}>
        <form
          method="POST"
          action="/api/alerts/signup"
          style={{ maxWidth: 480 }}
        >
          <input type="hidden" name="area" value="ai-energy" />
          <input
            type="hidden"
            name="redirectTo"
            value="/alerts/success?area=ai-energy"
          />

          <div style={FIELD_STYLE}>
            <label htmlFor="aie-email" style={LABEL_STYLE}>
              Email address <span style={{ color: "#c00" }}>*</span>
            </label>
            <input
              id="aie-email"
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              style={INPUT_STYLE}
            />
          </div>

          <div style={FIELD_STYLE}>
            <label htmlFor="aie-region" style={LABEL_STYLE}>
              Region
            </label>
            <select id="aie-region" name="region" style={SELECT_STYLE}>
              <option value="all">All regions</option>
              <option value="northeast">Northeast</option>
              <option value="southeast">Southeast</option>
              <option value="midwest">Midwest</option>
              <option value="southwest">Southwest</option>
              <option value="west">West</option>
            </select>
          </div>

          <div style={FIELD_STYLE}>
            <label htmlFor="aie-frequency" style={LABEL_STYLE}>
              Frequency
            </label>
            <select id="aie-frequency" name="frequency" style={SELECT_STYLE}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <fieldset
            style={{
              border: "1px solid #ddd",
              borderRadius: 4,
              padding: "12px 16px",
              marginBottom: 20,
            }}
          >
            <legend style={{ fontWeight: 600, fontSize: 15, padding: "0 4px" }}>
              Topics
            </legend>
            <div style={CHECKBOX_ROW_STYLE}>
              <input
                type="checkbox"
                id="aie-topic-dc"
                name="topics"
                value="data-center-growth"
                defaultChecked
              />
              <label htmlFor="aie-topic-dc">Data center load growth</label>
            </div>
            <div style={CHECKBOX_ROW_STYLE}>
              <input
                type="checkbox"
                id="aie-topic-tx"
                name="topics"
                value="transmission"
                defaultChecked
              />
              <label htmlFor="aie-topic-tx">Transmission constraints</label>
            </div>
            <div style={CHECKBOX_ROW_STYLE}>
              <input
                type="checkbox"
                id="aie-topic-cap"
                name="topics"
                value="capacity-markets"
              />
              <label htmlFor="aie-topic-cap">Capacity markets</label>
            </div>
            <div style={CHECKBOX_ROW_STYLE}>
              <input
                type="checkbox"
                id="aie-topic-reg"
                name="topics"
                value="regulatory-impact"
              />
              <label htmlFor="aie-topic-reg">Regulatory impact</label>
            </div>
          </fieldset>

          <button
            type="submit"
            style={{
              padding: "10px 24px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              borderRadius: 4,
              backgroundColor: "#1a1a1a",
              color: "#fff",
            }}
          >
            Request Alerts
          </button>

          <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
            No spam. Unsubscribe at any time.{" "}
            <Link href="/disclosures">Disclosures</Link>.
          </p>
        </form>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 18, marginBottom: 10 }}>Learn more</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
          <li>
            <Link href="/v/ai-energy/watchlist">
              AI Data Center Electricity Price Watchlist
            </Link>
          </li>
          <li>
            <Link href="/v/ai-energy/monitoring">
              How to Monitor AI Data Center Impacts
            </Link>
          </li>
          <li>
            <Link href="/v/ai-energy/overview">AI & Energy overview</Link>
          </li>
        </ul>
      </section>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/v/ai-energy">AI & Energy vertical</Link> {" | "}
        <Link href="/alerts">All alerts</Link> {" | "}
        <Link href="/regulatory">Regulatory hub</Link>
      </p>
    </main>
  );
}
