import Link from "next/link";

export default function AboutPage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 36, marginBottom: 8 }}>About / Methodology</h1>

      <p style={{ fontSize: 18, color: "#555" }}>
        This site shows state-level average residential electricity prices in
        cents per kilowatt-hour (¢/kWh).
      </p>

      <h2 style={{ fontSize: 24, marginTop: 24, marginBottom: 8 }}>
        Data Sources & Methodology
      </h2>
      <p>
        We source electricity rate data from authoritative public sources. The{" "}
        <strong>U.S. Energy Information Administration (EIA)</strong> is the
        federal government&apos;s primary source for energy statistics and is
        a key reference when available. We also use state public utility
        commission data and other aggregated datasets. Each state page links to
        its specific source.
      </p>
      <p className="muted" style={{ marginTop: 8 }}>
        <Link href="/sources">View all data sources</Link> ·{" "}
        <Link href="/data-policy">Data policy</Link> ·{" "}
        <Link href="/datasets">Download datasets</Link> ·{" "}
        <Link href="/methodology">Methodology</Link>
      </p>

      <h2 style={{ fontSize: 24, marginTop: 24, marginBottom: 8 }}>
        Update cadence
      </h2>
      <p>
        State rates are reviewed and updated on a monthly cadence. We aim to
        reflect the latest published data from our sources. See{" "}
        <Link href="/data-policy">data policy</Link> for freshness details.
      </p>

      <h2 style={{ fontSize: 24, marginTop: 24, marginBottom: 8 }}>
        What the rate means
      </h2>
      <p>
        <code>avgRateCentsPerKwh</code> represents a state average residential
        electricity price in ¢/kWh.
      </p>

      <h2 style={{ fontSize: 24, marginTop: 24, marginBottom: 8 }}>
        What the estimator includes/excludes
      </h2>
      <p>
        The Quick bill estimator is energy-only. It excludes delivery fees,
        taxes, fixed customer charges, and other utility charges that may
        appear on a real bill.
      </p>

      <h2 style={{ fontSize: 24, marginTop: 24, marginBottom: 8 }}>
        Calculation used
      </h2>
      <p>
        Estimated energy charge = <code>kWh * (¢/kWh) / 100</code>.
      </p>

      <h2 style={{ fontSize: 24, marginTop: 24, marginBottom: 8 }}>
        Disclaimer
      </h2>
      <p>
        This content is for informational purposes only and is not utility
        billing advice.
      </p>

      <p style={{ marginTop: 24 }}>
        <Link href="/">Back to state list</Link> ·{" "}
        <Link href="/research">Research & Insights</Link>
      </p>
    </main>
  );
}
