"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type SearchEntity = {
  id: string;
  type: string;
  slug: string;
  title: string;
  canonicalUrl: string;
  excerpt?: string;
  tokens?: string[];
};

type SearchIndex = {
  schemaVersion?: string;
  entities: SearchEntity[];
};

const STATIC_ENTRIES: SearchEntity[] = [
  {
    id: "knowledge:docs",
    type: "docs",
    slug: "docs",
    title: "Knowledge API Documentation",
    canonicalUrl: "/knowledge/docs",
    excerpt: "API documentation for Knowledge surfaces, endpoints, and ingestion.",
    tokens: ["docs", "documentation", "api", "knowledge"],
  },
  {
    id: "data:hub",
    type: "hub",
    slug: "data",
    title: "Data Hub",
    canonicalUrl: "/data",
    excerpt: "Human entry point for data surfaces and datasets.",
    tokens: ["data", "hub", "datasets"],
  },
];

function getPath(url: string): string {
  try {
    const u = new URL(url, "http://localhost");
    return u.pathname;
  } catch {
    return url.startsWith("/") ? url : `/${url}`;
  }
}

function scoreMatch(entity: SearchEntity, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const titleLower = entity.title.toLowerCase();
  const tokens = entity.tokens ?? [];
  const queryTerms = q.split(/\s+/).filter(Boolean);

  const exactTitle = titleLower.includes(q);
  if (exactTitle) return 1000;

  let tokenScore = 0;
  const tokenSet = new Set(tokens.map((t) => t.toLowerCase()));
  for (const term of queryTerms) {
    if (tokenSet.has(term)) tokenScore += 10;
    if (titleLower.includes(term)) tokenScore += 5;
  }
  return tokenScore;
}

export default function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const loadIndex = useCallback(async () => {
    if (index) return;
    setLoading(true);
    try {
      const res = await fetch("/knowledge/search-index.json");
      const data = (await res.json()) as SearchIndex;
      setIndex(data);
    } catch {
      setIndex({ entities: [] });
    } finally {
      setLoading(false);
    }
  }, [index]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadIndex();
      setQuery("");
      setSelectedIndex(0);
      inputRef.current?.focus();
    }
  }, [isOpen, loadIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  const allEntities = useMemo(() => {
    const fromIndex = index?.entities ?? [];
    return [...STATIC_ENTRIES, ...fromIndex];
  }, [index]);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return allEntities.slice(0, 12);
    const scored = allEntities
      .map((e) => ({ entity: e, score: scoreMatch(e, q) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((x) => x.entity);
    return scored;
  }, [allEntities, query]);

  useEffect(() => {
    setSelectedIndex((i) => Math.min(i, Math.max(0, results.length - 1)));
  }, [results.length]);

  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = results[selectedIndex];
      if (selected) {
        const path = getPath(selected.canonicalUrl);
        setIsOpen(false);
        router.push(path);
      }
    }
  };

  const handleSelect = (entity: SearchEntity) => {
    const path = getPath(entity.canonicalUrl);
    setIsOpen(false);
    router.push(path);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open search (Ctrl+K)"
        className="chip"
        style={{ marginLeft: 0, fontSize: 12 }}
      >
        Search (Ctrl+K)
      </button>
    );
  }

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingTop: "15vh",
          background: "rgba(0,0,0,0.4)",
        }}
        onClick={() => setIsOpen(false)}
      >
        <div
          style={{
            background: "var(--color-bg)",
            borderRadius: 8,
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            width: "min(560px, 90vw)",
            maxHeight: "70vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search Knowledge..."
            aria-label="Search input"
            autoComplete="off"
            style={{
              width: "100%",
              padding: "14px 18px",
              fontSize: 16,
              border: "none",
              borderBottom: "1px solid var(--color-border)",
              outline: "none",
            }}
          />
          <ul
            ref={listRef}
            role="listbox"
            aria-label="Search results"
            style={{
              margin: 0,
              padding: "8px 0",
              listStyle: "none",
              overflowY: "auto",
              flex: "1 1 auto",
              maxHeight: 400,
            }}
          >
            {loading && (
              <li style={{ padding: "12px 18px", color: "var(--color-muted)" }}>
                Loading...
              </li>
            )}
            {!loading && results.length === 0 && (
              <li style={{ padding: "12px 18px", color: "var(--color-muted)" }}>
                No results
              </li>
            )}
            {!loading &&
              results.map((entity, i) => (
                <li
                  key={entity.id}
                  role="option"
                  aria-selected={i === selectedIndex}
                  style={{
                    padding: "10px 18px",
                    cursor: "pointer",
                    background: i === selectedIndex ? "var(--color-surface-alt)" : "transparent",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                  onClick={() => handleSelect(entity)}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 500 }}>{entity.title}</span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: "var(--color-surface-alt)",
                        color: "var(--color-muted)",
                        textTransform: "capitalize",
                      }}
                    >
                      {entity.type}
                    </span>
                  </div>
                  {entity.excerpt && (
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--color-muted)",
                        lineHeight: 1.4,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {entity.excerpt}
                    </span>
                  )}
                </li>
              ))}
          </ul>
        </div>
      </div>
    </>
  );
}
