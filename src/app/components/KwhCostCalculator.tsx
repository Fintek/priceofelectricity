"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useDebouncedAnnounce } from "@/hooks/useDebouncedAnnounce";
import {
  USAGE_COST_ESTIMATE_DISCLAIMER,
  calculateUsageCost,
  formatRate,
  formatUsd,
} from "@/lib/usageCost";
import { getPreferredState } from "@/lib/preferences";

export type KwhCostCalculatorState = {
  slug: string;
  name: string;
  rateCentsPerKwh: number | null;
  updatedLabel: string | null;
  sourceName: string;
  sourceUrl: string | null;
};

export type KwhCostCalculatorRateEndpoint = {
  name: string;
  rateCentsPerKwh: number | null;
};

const US_AVERAGE_SLUG = "";

type KwhCostCalculatorProps = {
  states: KwhCostCalculatorState[];
  nationalRateCentsPerKwh: number | null;
  nationalUpdatedLabel: string | null;
  nationalSourceName: string;
  nationalSourceUrl: string | null;
  cheapest: KwhCostCalculatorRateEndpoint;
  mostExpensive: KwhCostCalculatorRateEndpoint;
  initialKwh?: number;
  initialStateSlug?: string;
  /** When true, omit inline disclaimer (parent page already renders Source & Method). */
  hideInlineDisclaimer?: boolean;
};

function parseKwhInput(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const kwh = Number(trimmed);
  if (!Number.isFinite(kwh) || kwh < 0) return null;
  return kwh;
}

function readUrlParams(): { kwh: string | null; state: string | null } {
  const params = new URLSearchParams(window.location.search);
  return {
    kwh: params.get("kwh"),
    state: params.get("state"),
  };
}

/**
 * Interactive kWh × state-rate cost calculator (amount-to-cost intent).
 */
export default function KwhCostCalculator({
  states,
  nationalRateCentsPerKwh,
  nationalUpdatedLabel,
  nationalSourceName,
  nationalSourceUrl,
  cheapest,
  mostExpensive,
  initialKwh = 1000,
  initialStateSlug = US_AVERAGE_SLUG,
  hideInlineDisclaimer = false,
}: KwhCostCalculatorProps) {
  const [slug, setSlug] = useState(initialStateSlug);
  const [kwhInput, setKwhInput] = useState(String(initialKwh));

  useEffect(() => {
    const slugs = new Set(states.map((s) => s.slug));
    const { kwh, state } = readUrlParams();
    if (state != null && slugs.has(state)) {
      setSlug(state);
    } else if (!initialStateSlug) {
      const preferred = getPreferredState();
      if (preferred && slugs.has(preferred)) {
        setSlug(preferred);
      }
    }
    if (kwh != null && kwh.trim() !== "") {
      setKwhInput(kwh);
    }
    // Mount-only: apply URL/preferred values after hydration (no syncUrl on load).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-shot bootstrap
  }, []);

  const syncUrl = useCallback((nextKwh: string, nextSlug: string) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    const parsed = parseKwhInput(nextKwh);
    if (parsed != null) params.set("kwh", String(parsed));
    if (nextSlug) params.set("state", nextSlug);
    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, "", nextUrl);
  }, []);

  const selected = slug ? states.find((s) => s.slug === slug) : undefined;
  const isUsAverage = !slug;
  const rate = isUsAverage ? nationalRateCentsPerKwh : (selected?.rateCentsPerKwh ?? null);
  const locationLabel = isUsAverage ? "U.S. average" : (selected?.name ?? "selected state");

  const kwh = useMemo(() => parseKwhInput(kwhInput), [kwhInput]);
  const totalCost = useMemo(() => {
    if (kwh == null || rate == null) return null;
    return calculateUsageCost(rate, kwh);
  }, [kwh, rate]);

  const dailyCost = totalCost != null ? totalCost / 30 : null;
  const monthlyCost = totalCost;
  const annualCost = totalCost != null ? totalCost * 12 : null;

  const cheapestCost = useMemo(
    () => (kwh != null ? calculateUsageCost(cheapest.rateCentsPerKwh, kwh) : null),
    [cheapest.rateCentsPerKwh, kwh],
  );
  const priciestCost = useMemo(
    () => (kwh != null ? calculateUsageCost(mostExpensive.rateCentsPerKwh, kwh) : null),
    [mostExpensive.rateCentsPerKwh, kwh],
  );

  const statusText = useMemo(() => {
    if (kwh == null || rate == null) {
      return `Enter kWh usage to estimate electricity cost for ${locationLabel}.`;
    }
    if (totalCost == null) return "Enter valid kWh usage to estimate cost.";
    return `${kwh.toLocaleString()} kWh in ${locationLabel} costs about ${formatUsd(totalCost)} at ${formatRate(rate)}.`;
  }, [kwh, rate, locationLabel, totalCost]);

  const announced = useDebouncedAnnounce(statusText);

  const handleSlugChange = (nextSlug: string) => {
    setSlug(nextSlug);
    syncUrl(kwhInput, nextSlug);
  };

  const handleKwhChange = (nextKwh: string) => {
    setKwhInput(nextKwh);
    syncUrl(nextKwh, slug);
  };

  const selectId = "kwh-cost-calculator-state";
  const kwhId = "kwh-cost-calculator-kwh";

  const sourceName = isUsAverage ? nationalSourceName : (selected?.sourceName ?? nationalSourceName);
  const sourceUrl = isUsAverage ? nationalSourceUrl : (selected?.sourceUrl ?? nationalSourceUrl);
  const updatedLabel = isUsAverage ? nationalUpdatedLabel : (selected?.updatedLabel ?? null);

  return (
    <section
      aria-labelledby="kwh-cost-calculator-heading"
      style={{
        marginBottom: "var(--space-6)",
        padding: "var(--space-5)",
        border: "1px solid var(--color-border, #e5e7eb)",
        borderRadius: 8,
        backgroundColor: "var(--color-surface-alt, #f9fafb)",
      }}
    >
      <h2 id="kwh-cost-calculator-heading" style={{ marginTop: 0, marginBottom: "var(--space-3)", fontSize: 22 }}>
        kWh cost calculator
      </h2>
      <p className="muted" style={{ marginTop: 0, marginBottom: "var(--space-4)", fontSize: 14, lineHeight: 1.6 }}>
        Enter any kWh amount and pick a state (or U.S. average) to see estimated electricity cost using published
        residential average rates.
      </p>

      <div style={{ display: "grid", gap: "var(--space-4)", maxWidth: 420 }}>
        <div>
          <label htmlFor={kwhId} style={{ display: "block", marginBottom: "var(--space-2)", fontWeight: 500 }}>
            Electricity usage (kWh)
          </label>
          <input
            id={kwhId}
            type="number"
            min={0}
            step={1}
            value={kwhInput}
            onChange={(e) => handleKwhChange(e.target.value)}
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

        <div>
          <label htmlFor={selectId} style={{ display: "block", marginBottom: "var(--space-2)", fontWeight: 500 }}>
            State or U.S. average
          </label>
          <select
            id={selectId}
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
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
            <option value={US_AVERAGE_SLUG}>U.S. average</option>
            {states.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <span className="sr-only" role="status">
        {announced}
      </span>

      {kwh != null && rate != null && totalCost != null ? (
        <>
          <p style={{ marginTop: "var(--space-4)", marginBottom: "var(--space-2)", fontSize: "var(--font-size-lg)" }}>
            Estimated cost: <strong>{formatUsd(totalCost)}</strong>
          </p>

          <p style={{ marginTop: 0, marginBottom: "var(--space-3)", fontSize: 15, lineHeight: 1.6 }}>
            {kwh.toLocaleString()} kWh × {formatRate(rate)} = {formatUsd(totalCost)} ({locationLabel})
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 12,
              marginBottom: "var(--space-4)",
            }}
          >
            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>
                Per day (÷30)
              </div>
              <div style={{ fontWeight: 600 }}>{formatUsd(dailyCost)}</div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>
                Per month
              </div>
              <div style={{ fontWeight: 600 }}>{formatUsd(monthlyCost)}</div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>
                Per year (×12)
              </div>
              <div style={{ fontWeight: 600 }}>{formatUsd(annualCost)}</div>
            </div>
          </div>

          {cheapestCost != null && priciestCost != null ? (
            <p style={{ marginTop: 0, marginBottom: "var(--space-3)", fontSize: 14, lineHeight: 1.6 }}>
              For {kwh.toLocaleString()} kWh, the lowest state average is {cheapest.name} ({formatUsd(cheapestCost)})
              and the highest is {mostExpensive.name} ({formatUsd(priciestCost)}).
            </p>
          ) : null}

          {!isUsAverage && selected ? (
            <p style={{ marginTop: 0, marginBottom: "var(--space-2)", fontSize: 14 }}>
              <Link href={`/electricity-price-per-kwh/${selected.slug}`}>
                View electricity price per kWh in {selected.name}
              </Link>
            </p>
          ) : null}

          <p className="muted" style={{ marginTop: 0, marginBottom: "var(--space-3)", fontSize: 13, lineHeight: 1.6 }}>
            Source:{" "}
            {sourceUrl ? (
              <a href={sourceUrl} rel="noopener noreferrer" target="_blank">
                {sourceName}
              </a>
            ) : (
              sourceName
            )}
            .
            {updatedLabel
              ? ` Updated: ${updatedLabel}.`
              : " No dataset update label is available for this selection."}
          </p>

          {!hideInlineDisclaimer ? (
            <p className="muted" style={{ marginTop: 0, marginBottom: 0, fontSize: 13, lineHeight: 1.6 }}>
              {USAGE_COST_ESTIMATE_DISCLAIMER}
            </p>
          ) : null}
        </>
      ) : (
        <p className="muted" style={{ marginTop: "var(--space-4)", marginBottom: 0, fontSize: 15, lineHeight: 1.6 }}>
          Enter kWh usage to calculate estimated electricity cost.
        </p>
      )}
    </section>
  );
}
