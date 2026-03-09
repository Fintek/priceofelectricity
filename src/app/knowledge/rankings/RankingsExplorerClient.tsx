"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import SkeletonCards from "@/components/knowledge/SkeletonCards";

type GlossaryField = {
  id: string;
  label: string;
  description?: string;
};

type RankingsIndexItem = {
  id: string;
  title: string;
  description: string;
  metricField: string;
  sortDirection: "asc" | "desc";
  jsonUrl: string;
  canonicalUrl: string;
  methodologiesUsed?: Array<{ id: string; version: string }>;
};

type RankingsIndexData = {
  schemaVersion: string;
  generatedAt: string;
  sourceVersion: string;
  items: RankingsIndexItem[];
};

function toPath(url: string): string {
  if (url.startsWith("http")) {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  }
  return url;
}

function getMetricId(metricField: string): string {
  const parts = metricField.split(".");
  return parts[parts.length - 1] ?? metricField;
}

export default function RankingsExplorerClient({
  glossaryMap = {},
}: {
  glossaryMap?: Record<string, GlossaryField>;
}) {
  const [data, setData] = useState<RankingsIndexData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [metricFilter, setMetricFilter] = useState<string>("");

  useEffect(() => {
    fetch("/knowledge/rankings/index.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const metricIds = useMemo(() => {
    if (!data) return [];
    const ids = new Set<string>();
    for (const item of data.items) {
      ids.add(getMetricId(item.metricField));
    }
    return [...ids].sort();
  }, [data]);

  if (loading) return <SkeletonCards count={6} />;
  if (error)
    return (
      <p className="muted" style={{ color: "var(--color-error, #b91c1c)" }}>
        Failed to load: {error}
      </p>
    );
  if (!data) return null;

  const filtered = data.items.filter((item) => {
    const matchSearch = !search.trim() ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase());
    const matchMetric = !metricFilter || getMetricId(item.metricField) === metricFilter;
    return matchSearch && matchMetric;
  });

  return (
    <div style={{ marginTop: 24 }}>
      <div
        role="group"
        aria-label="Filters"
        style={{
          marginBottom: 16,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          type="search"
          placeholder="Search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px 12px",
            border: "1px solid var(--color-border)",
            borderRadius: 4,
            minWidth: 200,
          }}
          aria-label="Search rankings"
        />
        <select
          value={metricFilter}
          onChange={(e) => setMetricFilter(e.target.value)}
          aria-label="Filter by metric"
          style={{
            padding: "8px 12px",
            border: "1px solid var(--color-border)",
            borderRadius: 4,
            minWidth: 160,
          }}
        >
          <option value="">All metrics</option>
          {metricIds.map((mid) => (
            <option key={mid} value={mid}>
              {glossaryMap[mid]?.label ?? mid}
            </option>
          ))}
        </select>
      </div>
      <p className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
        {filtered.length} ranking{filtered.length !== 1 ? "s" : ""} available
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {filtered.map((item) => {
          const canonicalPath = toPath(item.canonicalUrl);
          const jsonPath = toPath(item.jsonUrl);
          const metricId = getMetricId(item.metricField);
          const metricLabel = glossaryMap[metricId]?.label ?? metricId;
          const directionLabel = item.sortDirection === "asc" ? "Lower is better" : "Higher is better";
          return (
            <div
              key={item.id}
              style={{
                padding: 16,
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <h3 style={{ fontSize: 16, margin: 0, fontWeight: 600 }}>{item.title}</h3>
              <p className="muted" style={{ margin: 0, fontSize: 14, flex: 1 }}>
                {item.description}
              </p>
              <div className="muted" style={{ fontSize: 13 }}>
                <strong>Metric:</strong> {metricLabel} · {directionLabel}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                <Link href={canonicalPath} style={{ fontSize: 14 }}>
                  Open ranking
                </Link>
                <a href={jsonPath} target="_blank" rel="noopener noreferrer" className="muted" style={{ fontSize: 14 }}>
                  View JSON
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
