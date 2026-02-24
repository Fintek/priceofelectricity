"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Structured error report sent to server endpoint for logging.
    // Avoids importing server-only logger in client component.
    const body = JSON.stringify({
      message: error.message || "Unknown error",
      digest: error.digest,
    });
    fetch("/api/_error-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }).catch(() => {
      // Best effort; don't break the error page.
    });
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
        padding: "2rem",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
        Something went wrong
      </h1>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        style={{
          padding: "0.5rem 1.5rem",
          borderRadius: "0.375rem",
          border: "1px solid #ccc",
          background: "#fff",
          cursor: "pointer",
          fontSize: "0.875rem",
        }}
      >
        Try again
      </button>
    </div>
  );
}
