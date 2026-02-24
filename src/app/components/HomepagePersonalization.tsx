"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPreferredState, PREFERRED_STATE_CHANGED } from "@/lib/preferences";

type HomepagePersonalizationProps = {
  statesMap: Record<string, string>;
};

export default function HomepagePersonalization({ statesMap }: HomepagePersonalizationProps) {
  const [preferredState, setPreferredState] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setPreferredState(getPreferredState());
    refresh();
    window.addEventListener(PREFERRED_STATE_CHANGED, refresh);
    return () => window.removeEventListener(PREFERRED_STATE_CHANGED, refresh);
  }, []);

  if (!preferredState || !statesMap[preferredState]) return null;

  const stateName = statesMap[preferredState];

  return (
    <section
      style={{
        marginTop: 16,
        padding: 12,
        backgroundColor: "#f9f9f9",
        borderRadius: 4,
        border: "1px solid #eee",
      }}
    >
      <h2 style={{ fontSize: 16, marginTop: 0, marginBottom: 8 }}>Quick access to {stateName}</h2>
      <p style={{ marginTop: 0, marginBottom: 0 }}>
        <Link href={`/${preferredState}`}>View {stateName} rates</Link>
        {" | "}
        <Link href="/calculator">Calculator</Link>
      </p>
    </section>
  );
}
