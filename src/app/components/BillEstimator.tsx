"use client";

import { useMemo, useRef, useState } from "react";

export default function BillEstimator({
  rateCentsPerKwh,
  stateSlug,
}: {
  rateCentsPerKwh: number;
  stateSlug: string;
}) {
  const [kwhInput, setKwhInput] = useState("900");
  const hasTrackedEstimatorUse = useRef(false);

  /** Parsed only for display; input stays string so clearing/editing never coerces to 0 mid-keystroke. */
  const estimateDollars = useMemo(() => {
    const trimmed = kwhInput.trim();
    if (trimmed === "") return null;
    const kwh = Number(trimmed);
    if (!Number.isFinite(kwh) || kwh < 0) return null;
    return (kwh * rateCentsPerKwh) / 100;
  }, [kwhInput, rateCentsPerKwh]);

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
    <section style={{ marginTop: 28, paddingTop: 18, borderTop: "1px solid #eee" }}>
      <h2 style={{ fontSize: 22, marginBottom: 8 }}>Quick bill estimate</h2>

      <label style={{ display: "block", marginBottom: 8 }}>
        Monthly usage (kWh):
      </label>

      <input
        type="number"
        value={kwhInput}
        min={0}
        step={50}
        onChange={(e) => handleKwhChange(e.target.value)}
        style={{ padding: 10, width: 200 }}
      />

      <p style={{ marginTop: 12, fontSize: 18 }}>
        Est. energy charge:{" "}
        <b>{estimateDollars == null ? "—" : `$${estimateDollars.toFixed(2)}`}</b>
      </p>

      <p style={{ color: "#777", marginTop: 6 }}>
        Note: this is energy-only (doesn’t include delivery fees, taxes, etc.).
      </p>
    </section>
  );
}