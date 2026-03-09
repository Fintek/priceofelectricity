"use client";

import { useState, useCallback } from "react";

type CopyButtonProps = {
  value: string;
  label?: string;
  className?: string;
};

export default function CopyButton({ value, label = "Copy link", className }: CopyButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 1500);
    } catch {
      setStatus("failed");
      setTimeout(() => setStatus("idle"), 2000);
    }
  }, [value]);

  const displayText = status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : "Copy";

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      className={className}
      style={{
        padding: "4px 10px",
        fontSize: "0.8rem",
        cursor: "pointer",
        backgroundColor: status === "copied" ? "#22c55e" : status === "failed" ? "#ef4444" : "var(--color-border, #e5e7eb)",
        color: status === "copied" || status === "failed" ? "#fff" : "var(--color-text, #374151)",
        border: "none",
        borderRadius: 4,
        marginLeft: 8,
      }}
    >
      {displayText}
    </button>
  );
}
