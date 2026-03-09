import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import { buildMetadata } from "@/lib/seo/metadata";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

export const metadata: Metadata = buildMetadata({
  title: "How Battery Recharge Cost Is Estimated | PriceOfElectricity.com",
  description:
    "How the site estimates battery recharge cost from capacity and electricity price, including charging losses.",
  canonicalPath: "/methodology/battery-recharge-cost",
});

export default function BatteryRechargeCostMethodologyPage() {
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "How Battery Recharge Cost Is Estimated",
    description:
      "Methodology for estimating battery recharge cost from capacity and electricity price.",
    url: `${BASE_URL}/methodology/battery-recharge-cost`,
    dateModified: LAST_REVIEWED,
    author: {
      "@type": "Organization",
      name: "PriceOfElectricity.com",
      url: BASE_URL,
    },
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageStructuredData),
        }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/methodology">Methodology</Link> {"→"} Battery Recharge Cost
      </p>
      <h1>How Battery Recharge Cost Is Estimated</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        This page explains how PriceOfElectricity.com estimates the electricity
        cost to recharge a home battery from the grid.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Overview</h2>
        <p style={{ marginTop: 0 }}>
          Recharge cost is estimated from battery capacity and the local
          electricity price. The site uses standard example battery sizes common
          for residential backup systems. Charging losses increase the total
          electricity required from the grid.
        </p>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Formulas</h2>
        <p style={{ marginTop: 0 }}>
          Baseline cost (ignoring losses):
        </p>
        <pre
          style={{
            background: "#f5f5f5",
            padding: 16,
            borderRadius: 4,
            overflow: "auto",
            fontSize: 14,
          }}
        >
          {`baselineRechargeCost =
batteryCapacityKwh * rateDollarsPerKwh`}
        </pre>
        <p style={{ marginTop: 12 }}>
          With charging losses (typical round-trip efficiency ~90%):
        </p>
        <pre
          style={{
            background: "#f5f5f5",
            padding: 16,
            borderRadius: 4,
            overflow: "auto",
            fontSize: 14,
          }}
        >
          {`rechargeCostWithLosses =
(batteryCapacityKwh / 0.9) * rateDollarsPerKwh`}
        </pre>
        <p style={{ marginTop: 12 }}>
          The factor <code>0.9</code> approximates charging efficiency; actual
          efficiency varies by battery type and conditions.
        </p>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Standard battery sizes</h2>
        <p style={{ marginTop: 0 }}>
          The site uses common residential backup battery capacities (e.g., 10 kWh,
          13.5 kWh, 20 kWh) as examples. These are usable capacity values, not
          nameplate ratings.
        </p>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Scope</h2>
        <p style={{ marginTop: 0 }}>
          This methodology estimates <strong>electricity cost only</strong>. It does
          not include battery purchase price, installation, maintenance, inverter
          losses, or degradation over time.
        </p>
      </section>

      <p style={{ marginTop: 24 }}>
        <Link href="/battery-recharge-cost">View battery recharge cost by state</Link>
      </p>

      <p className="muted" style={{ marginTop: 16 }}>
        <Link href="/methodology">← Back to Methodology</Link>
      </p>
    </main>
  );
}
