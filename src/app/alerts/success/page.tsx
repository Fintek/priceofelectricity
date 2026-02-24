import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { recordRevenueEvent } from "@/lib/revenueMetrics";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

export const metadata: Metadata = {
  title: "You're subscribed | PriceOfElectricity.com",
  description: "Your electricity alerts subscription request has been received.",
  alternates: { canonical: `${BASE_URL}/alerts/success` },
  openGraph: {
    title: "You're subscribed | PriceOfElectricity.com",
    description: "Your electricity alerts subscription request has been received.",
    url: `${BASE_URL}/alerts/success`,
  },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function toSingle(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export default async function AlertsSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const areaRaw = toSingle(params.area);
  const area =
    areaRaw === "regulatory" || areaRaw === "ai-energy" || areaRaw === "state"
      ? areaRaw
      : undefined;
  const state = toSingle(params.state);

  recordRevenueEvent("alert_submit", { state });

  return (
    <main className="container">
      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/">Home</Link> {" → "}
        <Link href="/alerts">Alerts</Link> {" → "} Success
      </p>

      <h1>You're subscribed</h1>
      <p className="intro muted" style={{ marginTop: 0 }}>
        Your alerts request has been received. We will use this signup
        foundation to enable full delivery workflows in a later phase.
      </p>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Next steps</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li>
            <Link href="/alerts">Manage alert preferences</Link>
          </li>
          {area === "regulatory" && (
            <li>
              <Link href="/regulatory">Explore regulatory tracking</Link>
            </li>
          )}
          {area === "ai-energy" && (
            <li>
              <Link href="/v/ai-energy">Explore AI & Energy analysis</Link>
            </li>
          )}
          {state && (
            <li>
              <Link href={`/${state}`}>Return to {state} state page</Link>
            </li>
          )}
        </ul>
      </section>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/alerts/regulatory">Regulatory alerts</Link> {" | "}
        <Link href="/alerts/ai-energy">AI & Energy alerts</Link> {" | "}
        <Link href="/disclosures">Disclosures</Link>
      </p>
    </main>
  );
}
