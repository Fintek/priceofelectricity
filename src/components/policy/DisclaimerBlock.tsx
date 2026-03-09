import Link from "next/link";
import type { DisclaimersIndex } from "@/lib/knowledge/loadKnowledgePage";

type DisclaimerBlockProps = {
  disclaimerId: string;
  policy: DisclaimersIndex | null;
  defaultCollapsed?: boolean;
};

export default function DisclaimerBlock({
  disclaimerId,
  policy,
  defaultCollapsed = true,
}: DisclaimerBlockProps) {
  const disclaimer = policy?.disclaimers?.find((d) => d.id === disclaimerId);
  if (!disclaimer) return null;

  const summary =
    disclaimer.text.length > 120 ? `${disclaimer.text.slice(0, 120).trim()}…` : disclaimer.text;

  return (
    <aside
      role="contentinfo"
      aria-label="Disclaimer"
      style={{
        marginTop: 24,
        padding: 16,
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        backgroundColor: "var(--color-surface-alt)",
        fontSize: 14,
      }}
    >
      <strong style={{ display: "block", marginBottom: 4 }}>{disclaimer.title}</strong>
      <p className="muted" style={{ margin: "0 0 8px 0" }}>
        {summary}
      </p>
      <details open={!defaultCollapsed} style={{ marginTop: 8 }}>
        <summary style={{ cursor: "pointer", fontSize: 13 }}>Full text</summary>
        <p className="muted" style={{ margin: "8px 0 0 0" }}>
          {disclaimer.text}
        </p>
      </details>
      <p style={{ margin: "12px 0 0 0", fontSize: 13 }}>
        <Link href="/knowledge/policy/disclaimers.json" className="muted">
          Policy JSON
        </Link>
      </p>
    </aside>
  );
}
