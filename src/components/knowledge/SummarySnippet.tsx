"use client";

import CopyButton from "@/components/common/CopyButton";

type SummarySnippetProps = {
  title: string;
  lines: string[];
  copyValue?: string;
  label?: string;
};

export default function SummarySnippet({ title, lines, copyValue, label = "Copy summary" }: SummarySnippetProps) {
  if (lines.length === 0) return null;

  const text = copyValue ?? lines.join("\n");

  return (
    <div
      role="region"
      aria-label={title}
      style={{
        padding: 12,
        border: "1px solid var(--color-border, #e5e7eb)",
        borderRadius: 8,
        backgroundColor: "var(--color-surface-alt, #f9fafb)",
        fontSize: 14,
        lineHeight: 1.6,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <strong style={{ fontSize: 14 }}>{title}</strong>
        <CopyButton value={text} label={label} />
      </div>
      <pre
        style={{
          margin: 0,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontFamily: "inherit",
          fontSize: "inherit",
        }}
      >
        {lines.join("\n")}
      </pre>
    </div>
  );
}
