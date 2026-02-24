import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import AlertSubmitEmit from "@/app/alerts/confirm/AlertSubmitEmit";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

export const metadata: Metadata = {
  title: "Alerts Request Received | PriceOfElectricity.com",
  description: "Review your alert request details for electricity updates.",
  alternates: { canonical: `${BASE_URL}/alerts/confirm` },
  openGraph: {
    title: "Alerts Request Received | PriceOfElectricity.com",
    description: "Review your alert request details for electricity updates.",
    url: `${BASE_URL}/alerts/confirm`,
  },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function toSingle(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default async function AlertsConfirmPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const areaRaw = toSingle(params.area);
  const area =
    areaRaw === "regulatory" || areaRaw === "ai-energy" || areaRaw === "state"
      ? areaRaw
      : "state";
  const state = toSingle(params.state);
  const frequency = toSingle(params.frequency);
  const topics = toArray(params.topics);

  return (
    <main className="container">
      <AlertSubmitEmit
        area={area}
        state={state}
        frequency={frequency}
        topics={topics}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/">Home</Link> {" → "}
        <Link href="/alerts">Alerts</Link> {" → "} Confirm
      </p>

      <h1>Alerts Request Received</h1>
      <p className="intro muted" style={{ marginTop: 0 }}>
        This request has been captured for the current static workflow. Email
        delivery is not yet enabled. We will use this structure to wire alerts
        in a future backend phase.
      </p>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Request summary</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li>
            Area: <b>{area}</b>
          </li>
          <li>
            State: <b>{state ?? "all"}</b>
          </li>
          <li>
            Frequency: <b>{frequency ?? "not provided"}</b>
          </li>
          <li>
            Topics: <b>{topics.length > 0 ? topics.join(", ") : "none selected"}</b>
          </li>
        </ul>
      </section>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/alerts">Back to alerts</Link> {" | "}
        <Link href="/regulatory">Regulatory</Link> {" | "}
        <Link href="/v/ai-energy">AI & Energy</Link>
      </p>
    </main>
  );
}
