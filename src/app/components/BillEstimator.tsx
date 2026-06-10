"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function BillEstimator({
  rateCentsPerKwh,
  stateSlug,
}: {
  rateCentsPerKwh: number;
  stateSlug: string;
}) {
  const [kwhInput, setKwhInput] = useState("900");
  const [announced, setAnnounced] = useState("");
  const hasTrackedEstimatorUse = useRef(false);
  const kwhInputId = `bill-estimator-kwh-${stateSlug}`;

  /** Parsed only for display; input stays string so clearing/editing never coerces to 0 mid-keystroke. */
  const estimateDollars = useMemo(() => {
    const trimmed = kwhInput.trim();
    if (trimmed === "") return null;
    const kwh = Number(trimmed);
    if (!Number.isFinite(kwh) || kwh < 0) return null;
    return (kwh * rateCentsPerKwh) / 100;
  }, [kwhInput, rateCentsPerKwh]);

  const statusText =
    estimateDollars == null
      ? "Enter monthly usage to estimate energy charge."
      : `Estimated energy charge: $${estimateDollars.toFixed(2)}.`;

  useEffect(() => {
    const timer = window.setTimeout(() => setAnnounced(statusText), 500);
    return () => window.clearTimeout(timer);
  }, [statusText]);

  const handleKwhChange = (value: string) => {
    if (!hasTrackedEstimatorUse.current) {
      (window as any).plausible?.("EstimatorUsed", {
        props: {
          state: stateSlug,
          rate: rateCentsPerKwh,
        },
      });
      hasTrackedEstimatorUse.current = true;
    }
    setKwhInput(value);
  };

  return (
    <section
      style={{
        marginTop: "var(--space-6)",
        paddingTop: "var(--space-5)",
        borderTop: "1px solid var(--color-border)",
      }}
    >
      <h2 className="heading-section" style={{ marginTop: 0, marginBottom: "var(--space-3)" }}>
        Quick bill estimate
      </h2>

      <label htmlFor={kwhInputId} style={{ display: "block", marginBottom: "var(--space-2)" }}>
        Monthly usage (kWh):
      </label>

      <input
        id={kwhInputId}
        type="number"
        value={kwhInput}
        min={0}
        step={50}
        onChange={(e) => handleKwhChange(e.target.value)}
        style={{
          padding: "var(--space-2) var(--space-3)",
          width: 200,
          border: "1px solid var(--color-border-input)",
          borderRadius: 6,
          fontSize: "var(--font-size-base)",
        }}
      />

      <p style={{ marginTop: "var(--space-3)", fontSize: "var(--font-size-lg)" }}>
        Est. energy charge:{" "}
        <b>{estimateDollars == null ? "—" : `$${estimateDollars.toFixed(2)}`}</b>
      </p>

      <span className="sr-only" role="status">
        {announced}
      </span>

      <p className="muted" style={{ marginTop: "var(--space-2)" }}>
        Note: this is energy-only (doesn’t include delivery fees, taxes, etc.).
      </p>
    </section>
  );
}
