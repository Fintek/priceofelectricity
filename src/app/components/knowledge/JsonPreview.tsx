"use client";

import { useState } from "react";
import CopyButton from "@/components/common/CopyButton";
import { t } from "@/lib/knowledge/labels";

type JsonPreviewProps = {
  jsonUrl: string;
  jsonPreview?: string;
  copyValue?: string;
};

const PREVIEW_LINES = 40;

export default function JsonPreview({ jsonUrl, jsonPreview, copyValue }: JsonPreviewProps) {
  const [expanded, setExpanded] = useState(false);

  const jsonPath = jsonUrl.startsWith("http") ? new URL(jsonUrl).pathname : jsonUrl;

  const lines = jsonPreview ? jsonPreview.split("\n") : [];
  const previewLines = lines.slice(0, PREVIEW_LINES);
  const hasMore = lines.length > PREVIEW_LINES;

  return (
    <aside
      role="complementary"
      aria-label="JSON preview"
      style={{
        marginTop: 24,
        padding: 16,
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        backgroundColor: "var(--color-surface-alt)",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: jsonPreview ? 12 : 0 }}>
        <a
          href={jsonPath}
          target="_blank"
          rel="noopener noreferrer"
          className="muted"
          style={{
            fontSize: 14,
            padding: "4px 10px",
            border: "1px solid currentColor",
            borderRadius: 4,
            textDecoration: "none",
          }}
        >
          {t("nav.viewJson")}
        </a>
        <CopyButton value={copyValue ?? (jsonUrl.startsWith("http") ? jsonUrl : jsonPath)} label="Copy JSON URL" />
        {jsonPreview && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-label={expanded ? "Collapse JSON preview" : "Expand JSON preview"}
            style={{
              fontSize: 14,
              padding: "4px 10px",
              border: "1px solid var(--color-border)",
              borderRadius: 4,
              background: "var(--color-bg)",
              cursor: "pointer",
            }}
          >
            {expanded ? t("collapse.label") : t("preview.label")}
          </button>
        )}
      </div>
      {jsonPreview && expanded && (
        <pre
          style={{
            margin: 0,
            fontSize: 12,
            overflow: "auto",
            maxHeight: 320,
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          {previewLines.join("\n")}
          {hasMore && "\n…"}
        </pre>
      )}
    </aside>
  );
}
