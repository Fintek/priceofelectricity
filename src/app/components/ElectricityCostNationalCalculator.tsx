"use client";

import { useEffect, useMemo, useState } from "react";

export type ElectricityCostNationalCalculatorState = {
  slug: string;
  name: string;
  rateCentsPerKwh: number | null;
  updatedLabel: string | null;
  sourceName: string;
  sourceUrl: string | null;
};

function formatRateCents(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "N/A";
  return `${value.toFixed(2)} ¢/kWh`;
}

/**
 * Interactive monthly energy-charge estimate using residential average rates by state (national hub).
 */
export default function ElectricityCostNationalCalculator({
  states,
}: {
  states: ElectricityCostNationalCalculatorState[];
}) {
  const [slug, setSlug] = useState("");
  const [kwhInput, setKwhInput] = useState("900");
  const [announced, setAnnounced] = useState("");

  const selected = slug ? states.find((s) => s.slug === slug) : undefined;
  const rate = selected?.rateCentsPerKwh ?? null;
  const hasState = Boolean(selected);

  const estimateDollars = useMemo(() => {
    if (!hasState) return null;
    const trimmed = kwhInput.trim();
    if (trimmed === "" || rate == null) return null;
    const kwh = Number(trimmed);
    if (!Number.isFinite(kwh) || kwh < 0) return null;
    return (kwh * rate) / 100;
  }, [kwhInput, rate, hasState]);

  const statusText = useMemo(() => {
    if (!hasState) {
      return "Choose a state and enter monthly kWh to estimate your energy charge.";
    }
    if (estimateDollars == null) {
      return `Enter monthly usage for ${selected?.name ?? "selected state"} to estimate energy charge.`;
    }
    return `Estimated monthly energy charge for ${selected?.name ?? "selected state"}: $${estimateDollars.toFixed(2)}. Rate applied: ${formatRateCents(rate)}.`;
  }, [estimateDollars, hasState, rate, selected?.name]);

  useEffect(() => {
    const timer = window.setTimeout(() => setAnnounced(statusText), 500);
    return () => window.clearTimeout(timer);
  }, [statusText]);

  const selectId = "electricity-cost-national-state";
  const kwhId = "electricity-cost-national-kwh";

  return (
    <section
      aria-labelledby="electricity-cost-national-calculator-heading"
      style={{
        marginBottom: "var(--space-6)",
        padding: "var(--space-5)",
        border: "1px solid var(--color-border, #e5e7eb)",
        borderRadius: 8,
        backgroundColor: "var(--color-surface-alt, #f9fafb)",
      }}
    >
      <h2 id="electricity-cost-national-calculator-heading" style={{ marginTop: 0, marginBottom: "var(--space-3)", fontSize: 22 }}>
        Monthly energy charge calculator
      </h2>
      <p className="muted" style={{ marginTop: 0, marginBottom: "var(--space-4)", fontSize: 14, lineHeight: 1.6 }}>
        Pick your state, enter monthly kWh usage, and see an estimated energy charge using each state&apos;s residential
        average electricity rate.
      </p>

      <div style={{ display: "grid", gap: "var(--space-4)", maxWidth: 420 }}>
        <div>
          <label htmlFor={selectId} style={{ display: "block", marginBottom: "var(--space-2)", fontWeight: 500 }}>
            State
          </label>
          <select
            id={selectId}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            style={{
              width: "100%",
              maxWidth: 360,
              padding: "var(--space-2) var(--space-3)",
              border: "1px solid var(--color-border-input)",
              borderRadius: 6,
              fontSize: "var(--font-size-base)",
              backgroundColor: "var(--color-surface, #fff)",
            }}
          >
            <option value="">Select a state</option>
            {states.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={kwhId} style={{ display: "block", marginBottom: "var(--space-2)", fontWeight: 500 }}>
            Monthly usage (kWh)
          </label>
          <input
            id={kwhId}
            type="number"
            min={0}
            step={50}
            value={kwhInput}
            onChange={(e) => setKwhInput(e.target.value)}
            style={{
              padding: "var(--space-2) var(--space-3)",
              width: "100%",
              maxWidth: 200,
              border: "1px solid var(--color-border-input)",
              borderRadius: 6,
              fontSize: "var(--font-size-base)",
            }}
          />
        </div>
      </div>

      <span className="sr-only" role="status">
        {announced}
      </span>

      {!hasState ? (
        <p className="muted" style={{ marginTop: "var(--space-4)", marginBottom: 0, fontSize: 15, lineHeight: 1.6 }}>
          Choose a state and enter monthly kWh to estimate your energy charge.
        </p>
      ) : selected ? (
        <>
          <p style={{ marginTop: "var(--space-4)", marginBottom: "var(--space-2)", fontSize: "var(--font-size-lg)" }}>
            Estimated monthly energy charge:{" "}
            <strong>{estimateDollars == null ? "—" : `$${estimateDollars.toFixed(2)}`}</strong>
          </p>

          <p style={{ marginTop: 0, marginBottom: "var(--space-2)", fontSize: 15 }}>
            Rate applied: <strong>{formatRateCents(rate)}</strong>
          </p>

          <p className="muted" style={{ marginTop: 0, marginBottom: "var(--space-3)", fontSize: 13, lineHeight: 1.6 }}>
            Source:{" "}
            {selected.sourceUrl ? (
              <a href={selected.sourceUrl} rel="noopener noreferrer" target="_blank">
                {selected.sourceName}
              </a>
            ) : (
              selected.sourceName
            )}
            .
            {selected.updatedLabel
              ? ` Last dataset period shown for ${selected.name}: ${selected.updatedLabel}.`
              : " Dataset period label is currently unavailable."}
          </p>

          <p className="muted" style={{ marginTop: 0, marginBottom: 0, fontSize: 13, lineHeight: 1.6 }}>
            Energy charge estimate only. Your actual bill may also include delivery charges, fixed fees, taxes, and local
            adjustments.
          </p>
        </>
      ) : null}
    </section>
  );
}
