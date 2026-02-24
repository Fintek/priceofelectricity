"use client";

import { useMemo, useRef, useState } from "react";

export default function BillEstimator({
  rateCentsPerKwh,
  stateSlug,
}: {
  rateCentsPerKwh: number;
  stateSlug: string;
}) {
  const [kwh, setKwh] = useState<number>(900);
  const hasTrackedEstimatorUse = useRef(false);

  const estimate = useMemo(() => {
    const dollars = (kwh * rateCentsPerKwh) / 100;
    return dollars;
  }, [kwh, rateCentsPerKwh]);

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
    setKwh(Number(value || 0));
  };

  return (
    <section style={{ marginTop: 28, paddingTop: 18, borderTop: "1px solid #eee" }}>
      <h2 style={{ fontSize: 22, marginBottom: 8 }}>Quick bill estimate</h2>

      <label style={{ display: "block", marginBottom: 8 }}>
        Monthly usage (kWh):
      </label>

      <input
        type="number"
        value={kwh}
        min={0}
        step={50}
        onChange={(e) => handleKwhChange(e.target.value)}
        style={{ padding: 10, width: 200 }}
      />

      <p style={{ marginTop: 12, fontSize: 18 }}>
        Est. energy charge: <b>${estimate.toFixed(2)}</b>
      </p>

      <p style={{ color: "#777", marginTop: 6 }}>
        Note: this is energy-only (doesn’t include delivery fees, taxes, etc.).
      </p>
    </section>
  );
}