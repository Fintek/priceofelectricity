"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AllInStateFee } from "@/data/hidden-fees";

type SortKey = "state" | "allInCentsPerKwh" | "confidence" | "breakdownAvailable";
type SortDir = "asc" | "desc";

const CONFIDENCE_RANK: Record<string, number> = { high: 2, medium: 1, low: 0 };

const COLUMNS: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: "state", label: "State / utility", numeric: false },
  { key: "allInCentsPerKwh", label: "All-in cost (\u00a2/kWh)", numeric: true },
  { key: "confidence", label: "Confidence", numeric: false },
  { key: "breakdownAvailable", label: "Breakdown", numeric: false },
];

function sortValue(row: AllInStateFee, key: SortKey): number | string {
  switch (key) {
    case "state":
      return row.state;
    case "allInCentsPerKwh":
      return row.allInCentsPerKwh;
    case "confidence":
      return CONFIDENCE_RANK[row.confidence] ?? -1;
    case "breakdownAvailable":
      return row.breakdownAvailable ? 1 : 0;
    default: {
      const never: never = key;
      return never;
    }
  }
}

const cellStyle: React.CSSProperties = {
  padding: "10px 8px",
  borderBottom: "1px solid var(--color-border, #e5e7eb)",
  verticalAlign: "top",
};

export default function AllInTable({ rows }: { rows: AllInStateFee[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("allInCentsPerKwh");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      let cmp: number;
      if (typeof av === "string" || typeof bv === "string") {
        cmp = String(av).localeCompare(String(bv));
      } else {
        cmp = av - bv;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "state" ? "asc" : "desc");
    }
  }

  function ariaSort(key: SortKey): "ascending" | "descending" | "none" {
    if (key !== sortKey) return "none";
    return sortDir === "asc" ? "ascending" : "descending";
  }

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <caption className="muted" style={{ textAlign: "left", padding: "0 0 10px 0", fontSize: 13 }}>
          Validated all-in residential electricity cost (energy plus fees and taxes) at 900 kWh per month for 26
          states. Sortable; click a column header to re-sort. A check mark in &ldquo;Breakdown&rdquo; means a full
          itemized fee breakdown is available above; &ldquo;pending&rdquo; means only the all-in total is published
          so far.
        </caption>
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                scope="col"
                aria-sort={ariaSort(col.key)}
                style={{
                  padding: "10px 8px",
                  textAlign: col.numeric ? "right" : "left",
                  borderBottom: "1px solid var(--color-border, #e5e7eb)",
                  backgroundColor: "var(--color-surface-alt, #f9fafb)",
                  whiteSpace: "nowrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleSort(col.key)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    margin: 0,
                    font: "inherit",
                    fontWeight: 600,
                    cursor: "pointer",
                    color: "inherit",
                    textAlign: col.numeric ? "right" : "left",
                    width: "100%",
                  }}
                >
                  {col.label}
                  {col.key === sortKey ? (sortDir === "asc" ? " \u2191" : " \u2193") : ""}
                </button>
              </th>
            ))}
            <th
              scope="col"
              style={{
                padding: "10px 8px",
                textAlign: "left",
                borderBottom: "1px solid var(--color-border, #e5e7eb)",
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
                whiteSpace: "nowrap",
              }}
            >
              Source
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.slug}>
              <th scope="row" style={{ ...cellStyle, textAlign: "left", fontWeight: 500 }}>
                <Link href={`/${row.slug}`}>{row.state}</Link>
                <div className="muted" style={{ fontSize: 12 }}>{row.utility}</div>
              </th>
              <td style={{ ...cellStyle, textAlign: "right" }}>{row.allInCentsPerKwh.toFixed(2)}&cent;</td>
              <td style={{ ...cellStyle, textTransform: "capitalize" }}>{row.confidence}</td>
              <td style={{ ...cellStyle }}>
                {row.breakdownAvailable ? (
                  <span aria-label="Itemized breakdown available">&#10003; Available</span>
                ) : (
                  <span className="muted" aria-label="Itemized breakdown pending">Pending</span>
                )}
              </td>
              <td style={{ ...cellStyle, fontSize: 12 }}>
                <a href={row.sourceUrl} rel="noopener noreferrer" target="_blank">
                  {row.source === "urdb" ? "OpenEI URDB" : "Utility tariff"}
                </a>
                <div className="muted">{row.asOf ?? "date not stated"}</div>
                {row.note ? (
                  <div className="muted" style={{ marginTop: 4, fontStyle: "italic" }}>{row.note}</div>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
