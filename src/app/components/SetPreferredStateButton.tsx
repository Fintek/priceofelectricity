"use client";

import { useState } from "react";
import { setPreferredState } from "@/lib/preferences";

type SetPreferredStateButtonProps = {
  stateSlug: string;
};

export default function SetPreferredStateButton({ stateSlug }: SetPreferredStateButtonProps) {
  const [confirmed, setConfirmed] = useState(false);

  const handleClick = () => {
    setPreferredState(stateSlug);
    setConfirmed(true);
    setTimeout(() => setConfirmed(false), 2000);
  };

  return (
    <span style={{ marginLeft: 8 }}>
      <button
        type="button"
        onClick={handleClick}
        className="chip"
        style={{
          cursor: "pointer",
          border: "1px solid var(--color-border-input)",
          padding: "4px 10px",
          borderRadius: 4,
          fontSize: 13,
          backgroundColor: "#fff",
          minHeight: 32,
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        {confirmed ? "Saved" : "Set as my state"}
      </button>
    </span>
  );
}
