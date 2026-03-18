import type { Metadata } from "next";
import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STATES } from "@/data/states";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import { isValidStateSlug } from "@/lib/slugGuard";

const BASE_URL = SITE_URL;
export const dynamicParams = true;
export const revalidate = 2592000;

type PageParams = Promise<{ state: string }>;

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { state } = await params;
  if (!isValidStateSlug(state)) return {};
  const s = STATES[state];
  const title = `${s.name} Electricity Alerts`;
  const description = `Get email alerts for electricity rate changes, regulatory updates, and demand growth signals in ${s.name}.`;

  return {
    title: `${title} | PriceOfElectricity.com`,
    description,
    alternates: { canonical: `${BASE_URL}/alerts/${state}` },
    openGraph: {
      title: `${title} | PriceOfElectricity.com`,
      description,
      url: `${BASE_URL}/alerts/${state}`,
    },
  };
}

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

export default function StateAlertsPage({ params }: { params: PageParams }) {
  const { state } = use(params);
  if (!isValidStateSlug(state)) notFound();

  const s = STATES[state];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${s.name} Electricity Alerts`,
    description: `Email alerts for electricity rate changes, regulatory updates, and demand growth signals in ${s.name}.`,
    url: `${BASE_URL}/alerts/${state}`,
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
        <Link href="/alerts">Alerts</Link> {" → "} {s.name}
      </p>

      <h1>{s.name} Electricity Alerts</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        Get optional email alerts when electricity-related activity occurs in{" "}
        {s.name}: rate changes, regulatory filings, commission decisions, and
        demand growth signals. No spam. Unsubscribe at any time.
      </p>

      <section style={{ marginTop: 24 }}>
        <form
          method="POST"
          action="/api/alerts/signup"
          style={{ maxWidth: 480 }}
        >
          <input type="hidden" name="area" value="state" />
          <input type="hidden" name="state" value={state} />
          <input
            type="hidden"
            name="redirectTo"
            value={`/alerts/success?area=state&state=${state}`}
          />

          <div style={FIELD_STYLE}>
            <label htmlFor="st-email" style={LABEL_STYLE}>
              Email address <span style={{ color: "#c00" }}>*</span>
            </label>
            <input
              id="st-email"
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              style={INPUT_STYLE}
            />
          </div>

          <div style={FIELD_STYLE}>
            <label htmlFor="st-frequency" style={LABEL_STYLE}>
              Frequency
            </label>
            <select id="st-frequency" name="frequency" style={SELECT_STYLE}>
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
                id="st-topic-rate"
                name="topics"
                value="rate-changes"
                defaultChecked
              />
              <label htmlFor="st-topic-rate">Rate changes</label>
            </div>
            <div style={CHECKBOX_ROW_STYLE}>
              <input
                type="checkbox"
                id="st-topic-reg"
                name="topics"
                value="regulatory-updates"
                defaultChecked
              />
              <label htmlFor="st-topic-reg">Regulatory updates</label>
            </div>
            <div style={CHECKBOX_ROW_STYLE}>
              <input
                type="checkbox"
                id="st-topic-demand"
                name="topics"
                value="demand-growth"
              />
              <label htmlFor="st-topic-demand">Demand growth</label>
            </div>
            <div style={CHECKBOX_ROW_STYLE}>
              <input
                type="checkbox"
                id="st-topic-dc"
                name="topics"
                value="data-centers"
              />
              <label htmlFor="st-topic-dc">Data centers</label>
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

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 10 }}>More for {s.name}</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
          <li>
            <Link href={`/regulatory/${state}`}>
              {s.name} regulatory overview
            </Link>
          </li>
          <li>
            <Link href={`/${state}`}>{s.name} electricity rates</Link>
          </li>
          <li>
            <Link href={`/offers/${state}`}>Offers in {s.name}</Link>
          </li>
        </ul>
      </section>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/alerts">All alerts</Link> {" | "}
        <Link href="/alerts/regulatory">Regulatory alerts</Link> {" | "}
        <Link href="/compare">Compare states</Link>
      </p>
    </main>
  );
}
