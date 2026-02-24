import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import { STATES } from "@/data/states";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

const TITLE = "Regulatory Alerts";
const DESCRIPTION =
  "Subscribe to electricity regulatory alerts: rate case filings, commission decisions, settlements, and fuel adjustment updates across U.S. states.";

export const metadata: Metadata = {
  title: `${TITLE} | PriceOfElectricity.com`,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/alerts/regulatory` },
  openGraph: {
    title: `${TITLE} | PriceOfElectricity.com`,
    description: DESCRIPTION,
    url: `${BASE_URL}/alerts/regulatory`,
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

export default function RegulatoryAlertsPage() {
  const sortedStates = Object.entries(STATES)
    .map(([slug, s]) => ({ slug, name: s.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    description: DESCRIPTION,
    url: `${BASE_URL}/alerts/regulatory`,
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
        <Link href="/alerts">Alerts</Link> {" → "} Regulatory
      </p>

      <h1>{TITLE}</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        Subscribe to receive alerts when electricity regulatory activity occurs
        in a state of your choosing. You can track:
      </p>
      <ul className="muted" style={{ paddingLeft: 20, lineHeight: 2, marginTop: 0 }}>
        <li>Rate case filings — when a utility submits a new rate request</li>
        <li>Decisions and settlements — commission orders and negotiated outcomes</li>
        <li>Timeline updates — new events added to regulatory timelines</li>
        <li>Weekly digest summaries — a rolled-up view of recent activity</li>
      </ul>

      <section style={{ marginTop: 28 }}>
        <form
          method="POST"
          action="/api/alerts/signup"
          style={{ maxWidth: 480 }}
        >
          <input type="hidden" name="area" value="regulatory" />
          <input
            type="hidden"
            name="redirectTo"
            value="/alerts/success?area=regulatory"
          />

          <div style={FIELD_STYLE}>
            <label htmlFor="reg-email" style={LABEL_STYLE}>
              Email address <span style={{ color: "#c00" }}>*</span>
            </label>
            <input
              id="reg-email"
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              style={INPUT_STYLE}
            />
          </div>

          <div style={FIELD_STYLE}>
            <label htmlFor="reg-state" style={LABEL_STYLE}>
              State
            </label>
            <select id="reg-state" name="state" style={SELECT_STYLE}>
              <option value="all">All states</option>
              {sortedStates.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div style={FIELD_STYLE}>
            <label htmlFor="reg-frequency" style={LABEL_STYLE}>
              Frequency
            </label>
            <select id="reg-frequency" name="frequency" style={SELECT_STYLE}>
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
                id="reg-topic-rate-cases"
                name="topics"
                value="rate-cases"
                defaultChecked
              />
              <label htmlFor="reg-topic-rate-cases">Rate cases</label>
            </div>
            <div style={CHECKBOX_ROW_STYLE}>
              <input
                type="checkbox"
                id="reg-topic-timeline"
                name="topics"
                value="timeline-updates"
                defaultChecked
              />
              <label htmlFor="reg-topic-timeline">Timeline updates</label>
            </div>
            <div style={CHECKBOX_ROW_STYLE}>
              <input
                type="checkbox"
                id="reg-topic-settlements"
                name="topics"
                value="settlements"
              />
              <label htmlFor="reg-topic-settlements">Settlements</label>
            </div>
            <div style={CHECKBOX_ROW_STYLE}>
              <input
                type="checkbox"
                id="reg-topic-fuel"
                name="topics"
                value="fuel-adjustments"
              />
              <label htmlFor="reg-topic-fuel">Fuel adjustments</label>
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

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/regulatory">Regulatory hub</Link> {" | "}
        <Link href="/alerts">All alerts</Link> {" | "}
        <Link href="/sources">Sources</Link>
      </p>
    </main>
  );
}
