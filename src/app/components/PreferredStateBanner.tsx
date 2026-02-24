"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getPreferredState,
  clearPreferredState,
  PREFERRED_STATE_CHANGED,
} from "@/lib/preferences";

type PreferredStateBannerProps = {
  statesMap: Record<string, string>;
};

export default function PreferredStateBanner({ statesMap }: PreferredStateBannerProps) {
  const [preferredState, setPreferredState] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setPreferredState(getPreferredState());
    refresh();
    window.addEventListener(PREFERRED_STATE_CHANGED, refresh);
    return () => window.removeEventListener(PREFERRED_STATE_CHANGED, refresh);
  }, []);

  const handleClear = () => {
    clearPreferredState();
    setPreferredState(null);
  };

  if (!preferredState || !statesMap[preferredState]) return null;

  const stateName = statesMap[preferredState];

  return (
    <div
      className="preferred-state-banner"
      style={{
        padding: "8px 16px",
        backgroundColor: "#f5f5f5",
        borderBottom: "1px solid #e0e0e0",
        fontSize: 14,
      }}
    >
      <div className="container" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span className="muted">Your state: <b>{stateName}</b></span>
        <span>
          <Link href={`/${preferredState}`} style={{ marginRight: 12 }}>
            View state page
          </Link>
          <Link href="/compare" style={{ marginRight: 12 }}>
            Compare
          </Link>
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              textDecoration: "underline",
              color: "inherit",
              fontSize: "inherit",
            }}
          >
            Clear
          </button>
        </span>
      </div>
    </div>
  );
}
