"use client";

import { useState, useCallback } from "react";

type CopyUrlButtonProps = {
  url: string;
};

export default function CopyUrlButton({ url }: CopyUrlButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [url]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "URL copied to clipboard" : "Copy URL to clipboard"}
      style={{
        padding: "4px 10px",
        fontSize: "0.8rem",
        cursor: "pointer",
        backgroundColor: copied ? "#22c55e" : "var(--color-border, #e5e7eb)",
        color: copied ? "#fff" : "var(--color-text, #374151)",
        border: "none",
        borderRadius: 4,
        marginLeft: 8,
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
