"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ItemizedStateFee } from "@/data/hidden-fees";

type SortKey =
  | "state"
  | "fixedUsdPerMonth"
  | "ridersCentsPerKwh"
  | "taxPercent"
  | "nonEnergyAddonUsd"
  | "nonEnergySharePercent"
  | "allInCentsPerKwh";

type SortDir = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: "state", label: "State / utility", numeric: false },
  { key: "fixedUsdPerMonth", label: "Fixed charge ($/mo)", numeric: true },
  { key: "ridersCentsPerKwh", label: "Delivery + riders (\u00a2/kWh)", numeric: true },
  { key: "taxPercent", label: "Taxes (%)", numeric: true },
  { key: "nonEnergyAddonUsd", label: "Non-energy add-on (900 kWh)", numeric: true },
  { key: "nonEnergySharePercent", label: "% of bill", numeric: true },
  { key: "allInCentsPerKwh", label: "All-in (\u00a2/kWh)", numeric: true },
];

function sortValue(row: ItemizedStateFee, key: SortKey): number | string {
  if (key === "state") return row.state;
  const value = row[key];
  // Null (e.g. Texas all-in) sorts last regardless of direction intent.
  return value == null ? Number.NEGATIVE_INFINITY : value;
}

function usd(value: number | null): string {
  return value == null ? "\u2014" : `$${value.toFixed(2)}`;
}

function cents(value: number | null): string {
  return value == null ? "\u2014" : `${value.toFixed(2)}\u00a2`;
}

function pct(value: number | null): string {
  return value == null ? "\u2014" : `${value.toFixed(1)}%`;
}

const cellStyle: React.CSSProperties = {
  padding: "10px 8px",
  borderBottom: "1px solid var(--color-border, #e5e7eb)",
  verticalAlign: "top",
};

export default function FeeBreakdownTable({ rows }: { rows: ItemizedStateFee[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("nonEnergyAddonUsd");
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
          Itemized residential non-energy charges at 900 kWh per month. Sortable; click a column header to
          re-sort. Texas is shown delivery-only because supply is billed separately by a competitive retailer.
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
              As of / source
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.slug}>
              <th scope="row" style={{ ...cellStyle, textAlign: "left", fontWeight: 500 }}>
                <Link href={`/${row.slug}`}>{row.state}</Link>
                <div className="muted" style={{ fontSize: 12 }}>
                  {row.utility}
                  {row.isDeregulatedDeliveryOnly ? " (delivery only)" : ""}
                </div>
              </th>
              <td style={{ ...cellStyle, textAlign: "right" }}>{usd(row.fixedUsdPerMonth)}</td>
              <td style={{ ...cellStyle, textAlign: "right" }}>{cents(row.ridersCentsPerKwh)}</td>
              <td style={{ ...cellStyle, textAlign: "right" }}>
                {pct(row.taxPercent)}
                {row.taxNote ? (
                  <div className="muted" style={{ fontSize: 11, maxWidth: "22ch", whiteSpace: "normal" }}>
                    {row.taxNote}
                  </div>
                ) : null}
              </td>
              <td style={{ ...cellStyle, textAlign: "right" }}>{usd(row.nonEnergyAddonUsd)}</td>
              <td style={{ ...cellStyle, textAlign: "right" }}>{pct(row.nonEnergySharePercent)}</td>
              <td style={{ ...cellStyle, textAlign: "right" }}>{cents(row.allInCentsPerKwh)}</td>
              <td style={{ ...cellStyle, fontSize: 12 }}>
                <div>{row.asOf ?? "Date not stated"}</div>
                {row.sourceUrls[0] ? (
                  <a href={row.sourceUrls[0]} rel="noopener noreferrer" target="_blank">
                    Source
                  </a>
                ) : null}
                <div className="muted" style={{ textTransform: "capitalize" }}>{row.confidence} confidence</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
