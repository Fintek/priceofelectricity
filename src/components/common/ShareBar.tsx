"use client";

import Link from "next/link";
import CopyButton from "./CopyButton";

type ShareBarProps = {
  /** Absolute URL preferred for copy */
  canonicalUrl: string;
  /** Absolute URL preferred for copy */
  jsonUrl?: string;
  label?: string;
};

export default function ShareBar({ canonicalUrl, jsonUrl, label = "Share" }: ShareBarProps) {
  const canonicalHref = canonicalUrl.startsWith("http") ? canonicalUrl : canonicalUrl.startsWith("/") ? canonicalUrl : `/${canonicalUrl}`;
  const jsonHref = jsonUrl ? (jsonUrl.startsWith("http") ? jsonUrl : jsonUrl.startsWith("/") ? jsonUrl : `/${jsonUrl}`) : null;

  return (
    <div
      role="group"
      aria-label={label}
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 8,
        marginBottom: 16,
        fontSize: 14,
      }}
    >
      <Link href={canonicalHref} aria-label="Open page">
        Open page
      </Link>
      <CopyButton value={canonicalUrl.startsWith("http") ? canonicalUrl : canonicalHref} label="Copy link" />
      {jsonUrl && jsonHref && (
        <>
          <span className="muted" style={{ marginLeft: 4 }}>·</span>
          <Link href={jsonHref} target="_blank" rel="noopener noreferrer" aria-label="Open JSON in new tab">
            Open JSON
          </Link>
          <CopyButton value={jsonUrl.startsWith("http") ? jsonUrl : jsonHref} label="Copy JSON URL" />
        </>
      )}
    </div>
  );
}
