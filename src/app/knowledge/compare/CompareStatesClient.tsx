"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import CompareStateCard from "@/components/knowledge/CompareStateCard";
import BulletBar from "@/components/knowledge/BulletBar";
import { t } from "@/lib/knowledge/labels";

type GlossaryField = {
  id: string;
  label: string;
  description?: string;
};

type CompareState = {
  slug: string;
  name: string;
  postal?: string | null;
  metrics: Record<string, number | string | null>;
  canonicalUrl: string;
  jsonUrl: string;
};

type CompareData = {
  schemaVersion: string;
  generatedAt: string;
  sourceVersion: string;
  fields: string[];
  states: CompareState[];
};

type LeaderboardItem = {
  rank: number;
  slug: string;
  name: string;
  value: number;
};

type Leaderboard = {
  id: string;
  metricId: string;
  direction: "asc" | "desc";
  items: LeaderboardItem[];
};

type LeaderboardsData = {
  leaderboards?: Leaderboard[];
};

function getLabel(fieldId: string, glossaryMap?: Record<string, GlossaryField>): string {
  if (glossaryMap?.[fieldId]?.label) return glossaryMap[fieldId].label;
  const key = `field.${fieldId}`;
  return t(key) !== key ? t(key) : fieldId;
}

export default function CompareStatesClient({
  compareData,
  leaderboards,
  glossaryMap = {},
  coverageBySlug = {},
}: {
  compareData: CompareData | null;
  leaderboards: LeaderboardsData | null;
  glossaryMap?: Record<string, GlossaryField>;
  coverageBySlug?: Record<string, number>;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [showTableView, setShowTableView] = useState(false);

  const data = compareData;
  const filtered = data
    ? search.trim()
      ? data.states.filter(
          (s) =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            (s.postal && s.postal.toLowerCase().includes(search.toLowerCase())) ||
            s.slug.toLowerCase().includes(search.toLowerCase()),
        )
      : data.states
    : [];
  const selectedStates = useMemo(
    () => (data ? data.states.filter((s) => selected.has(s.slug)) : []),
    [data, selected],
  );
  const numericFields = useMemo(
    () =>
      data
        ? data.fields.filter((f) => {
            const vals = selectedStates.map((s) => s.metrics[f]);
            return vals.some((v) => typeof v === "number");
          })
        : [],
    [data, selectedStates],
  );

  const deltas = useMemo(() => {
    const out: Array<{ field: string; min: number; max: number; spread: number; avg: number }> = [];
    for (const field of numericFields) {
      const vals = selectedStates
        .map((s) => s.metrics[field])
        .filter((v): v is number => typeof v === "number");
      if (vals.length > 0) {
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        out.push({ field, min, max, spread: max - min, avg });
      }
    }
    return out;
  }, [selectedStates, numericFields]);

  if (!data) return <p className="muted">No comparison data available.</p>;

  const toggle = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else if (next.size < 4) next.add(slug);
      return next;
    });
  };

  const presetTop3LowestRate = () => {
    const lb = leaderboards?.leaderboards?.find((l) => l.metricId === "avgRateCentsPerKwh" && l.direction === "asc");
    if (lb) {
      setSelected(new Set(lb.items.slice(0, 3).map((i) => i.slug)));
      return;
    }
    const sorted = [...data.states]
      .filter((s) => typeof s.metrics.avgRateCentsPerKwh === "number")
      .sort((a, b) => (a.metrics.avgRateCentsPerKwh as number) - (b.metrics.avgRateCentsPerKwh as number))
      .slice(0, 3)
      .map((s) => s.slug);
    setSelected(new Set(sorted));
  };

  const presetTop3BestValue = () => {
    const lb = leaderboards?.leaderboards?.find((l) => l.metricId === "valueScore" && l.direction === "desc");
    if (lb) {
      setSelected(new Set(lb.items.slice(0, 3).map((i) => i.slug)));
      return;
    }
    const sorted = [...data.states]
      .filter((s) => typeof s.metrics.valueScore === "number")
      .sort((a, b) => (b.metrics.valueScore as number) - (a.metrics.valueScore as number))
      .slice(0, 3)
      .map((s) => s.slug);
    setSelected(new Set(sorted));
  };

  const remove = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(slug);
      return next;
    });
  };

  return (
    <div style={{ marginTop: 24 }}>
      <section aria-labelledby="select-heading" style={{ marginBottom: 32 }}>
        <h2 id="select-heading" style={{ fontSize: 18, marginBottom: 12 }}>
          Select states to compare (max 4)
        </h2>
        <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <input
            type="search"
            placeholder="Search states…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid var(--color-border)",
              borderRadius: 4,
              minWidth: 200,
            }}
            aria-label="Search states"
          />
          <button
            type="button"
            onClick={presetTop3LowestRate}
            style={{
              padding: "8px 12px",
              border: "1px solid var(--color-border)",
              borderRadius: 4,
              background: "var(--color-surface-alt)",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Top 3 lowest rate
          </button>
          <button
            type="button"
            onClick={presetTop3BestValue}
            style={{
              padding: "8px 12px",
              border: "1px solid var(--color-border)",
              borderRadius: 4,
              background: "var(--color-surface-alt)",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Top 3 best value
          </button>
        </div>
        <div
          style={{
            maxHeight: 200,
            overflowY: "auto",
            border: "1px solid var(--color-border)",
            borderRadius: 4,
            padding: 12,
            background: "var(--color-surface-alt)",
          }}
        >
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
            {filtered.map((s) => (
              <li key={s.slug}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={selected.has(s.slug)}
                    onChange={() => toggle(s.slug)}
                    disabled={!selected.has(s.slug) && selected.size >= 4}
                    aria-label={`Select ${s.name}`}
                  />
                  <span>
                    {s.name}
                    {s.postal && <span className="muted" style={{ marginLeft: 4 }}>({s.postal})</span>}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {selectedStates.length > 0 && (
        <>
          <section aria-labelledby="cards-heading" style={{ marginBottom: 32 }}>
            <h2 id="cards-heading" style={{ fontSize: 18, marginBottom: 16 }}>
              Comparison cards
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 16,
              }}
            >
              {selectedStates.map((s) => (
                <CompareStateCard
                  key={s.slug}
                  state={s}
                  fields={data.fields}
                  glossaryMap={glossaryMap}
                  coveragePct={coverageBySlug[s.slug]}
                  onRemove={() => remove(s.slug)}
                />
              ))}
            </div>
          </section>

          {deltas.length > 0 && (
            <section aria-labelledby="deltas-heading" style={{ marginBottom: 32 }}>
              <h2 id="deltas-heading" style={{ fontSize: 18, marginBottom: 12 }}>
                Metric spread
              </h2>
              <div
                style={{
                  padding: 16,
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  backgroundColor: "var(--color-surface-alt)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                {deltas.map((d) => {
                  const format = (n: number) => n.toFixed(2);
                  return (
                    <div key={d.field} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span className="muted" style={{ fontSize: 13 }}>{getLabel(d.field, glossaryMap)}</span>
                      <BulletBar
                        value={d.avg}
                        min={d.min}
                        max={d.max}
                        labelLeft="Lowest"
                        labelRight="Highest"
                        format={format}
                        width={200}
                        height={12}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section style={{ marginBottom: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
              <input
                type="checkbox"
                checked={showTableView}
                onChange={(e) => setShowTableView(e.target.checked)}
              />
              Table view
            </label>
          </section>

          {showTableView && (
            <section aria-labelledby="table-heading" style={{ marginBottom: 24 }}>
              <h2 id="table-heading" style={{ fontSize: 18, marginBottom: 12 }}>
                Compact table
              </h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid var(--color-border)" }}>
                        State
                      </th>
                      {data.fields.map((f) => (
                        <th
                          key={f}
                          style={{ textAlign: "right", padding: "8px 12px", borderBottom: "2px solid var(--color-border)" }}
                        >
                          {getLabel(f, glossaryMap)}
                        </th>
                      ))}
                      <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid var(--color-border)" }}>
                        Links
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStates.map((s) => (
                      <tr key={s.slug} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "8px 12px" }}>
                          <strong>{s.name}</strong>
                          {s.postal && <span className="muted" style={{ marginLeft: 4 }}>({s.postal})</span>}
                        </td>
                        {data.fields.map((f) => (
                          <td key={f} style={{ textAlign: "right", padding: "8px 12px" }}>
                            {f === "freshnessStatus" && s.metrics[f]
                              ? t(`status.${String(s.metrics[f])}`)
                              : typeof s.metrics[f] === "number"
                                ? (s.metrics[f] as number).toFixed(2)
                                : String(s.metrics[f] ?? "—")}
                          </td>
                        ))}
                        <td style={{ padding: "8px 12px" }}>
                          <Link href={s.canonicalUrl.startsWith("http") ? new URL(s.canonicalUrl).pathname : s.canonicalUrl}>
                            Page
                          </Link>
                          {" · "}
                          <a
                            href={s.jsonUrl.startsWith("http") ? new URL(s.jsonUrl).pathname : s.jsonUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            JSON
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {selectedStates.length === 0 && (
        <p className="muted" style={{ fontSize: 14 }}>
          Select 2–4 states above to compare metrics and view deltas.
        </p>
      )}
    </div>
  );
}
