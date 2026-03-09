"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Section from "@/components/common/Section";
import BulletBar from "@/components/knowledge/BulletBar";

type StateRow = {
  rank: number;
  slug: string;
  name: string;
  metricValue: number;
  startRate?: number;
  endRate?: number;
  changePercent?: number;
  signal?: string;
  shortWindowChangePercent?: number;
  longWindowChangePercent?: number;
};

type RankingDetailClientProps = {
  sortedStates: StateRow[];
  excludedStates?: { count?: number; reason?: string };
  pageId: string;
  enabled?: boolean;
  windowYears?: number;
  metricLabel?: string;
};

function StateList({
  states,
  minVal,
  maxVal,
}: {
  states: StateRow[];
  minVal: number;
  maxVal: number;
}) {
  const format = (n: number) => n.toFixed(2);
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {states.map((row) => (
        <li
          key={row.slug}
          style={{
            padding: "8px 12px",
            borderBottom: "1px solid var(--color-border, #eee)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontWeight: 500, minWidth: 20 }}>{row.rank}.</span>
          <Link href={`/${row.slug}`} style={{ flex: 1, minWidth: 0 }}>
            {row.name}
          </Link>
          {maxVal > minVal ? (
            <BulletBar
              value={row.metricValue}
              min={minVal}
              max={maxVal}
              format={format}
              width={80}
              height={8}
            />
          ) : (
            <span className="muted" style={{ fontSize: 12 }}>{format(row.metricValue)}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function RankingDetailClient({
  sortedStates,
  excludedStates,
  pageId,
  enabled = true,
  metricLabel,
}: RankingDetailClientProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return sortedStates;
    const q = search.toLowerCase().trim();
    return sortedStates.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q),
    );
  }, [sortedStates, search]);

  const top5 = sortedStates.slice(0, 5);
  const bottom5 = sortedStates.slice(-5);
  const allValues = sortedStates.map((s) => s.metricValue);
  const minVal = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxVal = allValues.length > 0 ? Math.max(...allValues) : 0;

  return (
    <div style={{ marginTop: 24 }}>
      {excludedStates && (excludedStates.count ?? 0) > 0 && (
        <Section title="Excluded states" defaultCollapsed collapseSummary="Show excluded states">
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            {excludedStates.count} state(s) excluded
            {excludedStates.reason ? `: ${excludedStates.reason}` : ""}.
          </p>
        </Section>
      )}

      {!enabled && (
        <Section title="Data unavailable">
          <p className="muted" style={{ margin: 0 }}>
            {pageId === "price-trend"
              ? "Trend ranking unavailable — historical data not present."
              : pageId === "momentum-signal"
                ? "Momentum signal unavailable — historical data not present."
                : "This ranking requires historical time-series data. History is currently unavailable. The ranking will appear when historical data is added to the build."}
          </p>
        </Section>
      )}
      {enabled && (
      <Section title="Preview" id="preview-heading">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
          }}
        >
          <div
            style={{
              padding: 16,
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              backgroundColor: "var(--color-surface-alt)",
            }}
          >
            <h3 style={{ fontSize: 14, margin: "0 0 12px 0", fontWeight: 600 }}>
              Top 5
            </h3>
            <StateList states={top5}  minVal={minVal} maxVal={maxVal} />
          </div>
          <div
            style={{
              padding: 16,
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              backgroundColor: "var(--color-surface-alt)",
            }}
          >
            <h3 style={{ fontSize: 14, margin: "0 0 12px 0", fontWeight: 600 }}>
              Bottom 5
            </h3>
            <StateList states={bottom5} minVal={minVal} maxVal={maxVal} />
          </div>
        </div>
      </Section>
      )}

      {enabled && (
      <Section title="Full ranking" id="full-ranking-heading">
        <div style={{ marginBottom: 12 }}>
          <input
            type="search"
            placeholder="Jump to state…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Filter states by name"
            style={{
              padding: "8px 12px",
              border: "1px solid var(--color-border)",
              borderRadius: 4,
              minWidth: 200,
            }}
          />
        </div>
        <div
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 12px",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  Rank
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 12px",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  State
                </th>
                {pageId === "price-trend" && (
                  <>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "8px 12px",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      Start (¢/kWh)
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "8px 12px",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      End (¢/kWh)
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "8px 12px",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      Change (%)
                    </th>
                  </>
                )}
                {pageId === "momentum-signal" && (
                  <>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "8px 12px",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      Signal
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "8px 12px",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      12‑mo change (%)
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "8px 12px",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      24‑mo change (%)
                    </th>
                  </>
                )}
                <th
                  style={{
                    textAlign: "right",
                    padding: "8px 12px",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  {metricLabel ?? "Value"}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.slug}>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #eee" }}>
                    {row.rank}
                  </td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #eee" }}>
                    <Link href={`/${row.slug}`}>{row.name}</Link>
                  </td>
                  {pageId === "price-trend" && (
                    <>
                      <td
                        style={{
                          padding: "8px 12px",
                          borderBottom: "1px solid #eee",
                          textAlign: "right",
                        }}
                      >
                        {typeof row.startRate === "number" ? row.startRate.toFixed(2) : "—"}
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          borderBottom: "1px solid #eee",
                          textAlign: "right",
                        }}
                      >
                        {typeof row.endRate === "number" ? row.endRate.toFixed(2) : "—"}
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          borderBottom: "1px solid #eee",
                          textAlign: "right",
                        }}
                      >
                        {typeof row.changePercent === "number" ? `${row.changePercent.toFixed(2)}%` : "—"}
                      </td>
                    </>
                  )}
                  {pageId === "momentum-signal" && (
                    <>
                      <td
                        style={{
                          padding: "8px 12px",
                          borderBottom: "1px solid #eee",
                          textAlign: "left",
                        }}
                      >
                        {row.signal ? row.signal.charAt(0).toUpperCase() + row.signal.slice(1) : "—"}
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          borderBottom: "1px solid #eee",
                          textAlign: "right",
                        }}
                      >
                        {typeof row.shortWindowChangePercent === "number" ? `${row.shortWindowChangePercent >= 0 ? "+" : ""}${row.shortWindowChangePercent.toFixed(2)}%` : "—"}
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          borderBottom: "1px solid #eee",
                          textAlign: "right",
                        }}
                      >
                        {typeof row.longWindowChangePercent === "number" ? `${row.longWindowChangePercent >= 0 ? "+" : ""}${row.longWindowChangePercent.toFixed(2)}%` : "—"}
                      </td>
                    </>
                  )}
                  <td
                    style={{
                      padding: "8px 12px",
                      borderBottom: "1px solid #eee",
                      textAlign: "right",
                    }}
                  >
                    {row.metricValue}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        </div>
      </Section>
      )}
    </div>
  );
}
