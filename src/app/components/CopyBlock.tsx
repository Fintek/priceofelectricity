"use client";

import { useState, useCallback } from "react";

type CopyBlockProps = {
  text: string;
};

const DATE_PLACEHOLDER = "{{DATE}}";

export default function CopyBlock({ text }: CopyBlockProps) {
  const [copied, setCopied] = useState(false);

  const resolvedText = text.includes(DATE_PLACEHOLDER)
    ? text.replace(DATE_PLACEHOLDER, new Date().toISOString().split("T")[0])
    : text;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(resolvedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [resolvedText]);

  return (
    <div style={{ position: "relative", marginTop: 8 }}>
      <pre
        style={{
          padding: 16,
          backgroundColor: "var(--color-surface-alt)",
          border: "1px solid var(--color-border)",
          borderRadius: 4,
          fontSize: "0.9rem",
          overflow: "auto",
          margin: 0,
        }}
      >
        {resolvedText}
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          padding: "6px 12px",
          fontSize: "0.875rem",
          cursor: "pointer",
          backgroundColor: copied ? "#22c55e" : "var(--color-border)",
          color: copied ? "#fff" : "var(--color-text)",
          border: "none",
          borderRadius: 4,
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
