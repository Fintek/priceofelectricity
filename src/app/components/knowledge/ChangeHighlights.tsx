import { t } from "@/lib/knowledge/labels";

type ChangeSummary = {
  comparedToVersion: string;
  significantChanges: Array<{
    field: string;
    absoluteDelta: number;
    percentDelta: number;
  }>;
};

function getValueAtPath(data: Record<string, unknown>, fieldPath: string): number | null {
  const path = fieldPath.replace(/^data\./, "");
  const parts = path.split(".");
  let cur: unknown = data;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return null;
    cur = (cur as Record<string, unknown>)[p];
  }
  if (typeof cur !== "number" || !Number.isFinite(cur)) return null;
  return cur;
}

type ChangeHighlightsProps = {
  changeSummary: ChangeSummary;
  data: Record<string, unknown>;
};

export default function ChangeHighlights({ changeSummary, data }: ChangeHighlightsProps) {
  const { comparedToVersion, significantChanges } = changeSummary;
  if (significantChanges.length === 0) return null;

  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 18, marginBottom: 12 }}>{t("section.whatChanged")}</h2>
      <p className="muted" style={{ margin: "0 0 12px 0", fontSize: 14 }}>
        {t("change.compareToVersion")} {comparedToVersion}
      </p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #ddd" }}>
              {t("table.field")}
            </th>
            <th style={{ textAlign: "right", padding: "8px 12px", borderBottom: "1px solid #ddd" }}>
              {t("table.previous")}
            </th>
            <th style={{ textAlign: "right", padding: "8px 12px", borderBottom: "1px solid #ddd" }}>
              {t("table.current")}
            </th>
            <th style={{ textAlign: "right", padding: "8px 12px", borderBottom: "1px solid #ddd" }}>
              Δ
            </th>
          </tr>
        </thead>
        <tbody>
          {significantChanges.map((c) => {
            const currentVal = getValueAtPath(data, c.field);
            const previousVal =
              currentVal !== null ? currentVal - c.absoluteDelta : null;
            return (
              <tr key={c.field}>
                <td style={{ padding: "8px 12px", borderBottom: "1px solid #eee" }}>
                  <code style={{ fontSize: 12 }}>{c.field}</code>
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #eee",
                    textAlign: "right",
                  }}
                >
                  {previousVal != null ? previousVal.toFixed(2) : "—"}
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #eee",
                    textAlign: "right",
                  }}
                >
                  {currentVal != null ? currentVal.toFixed(2) : "—"}
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #eee",
                    textAlign: "right",
                  }}
                >
                  {c.absoluteDelta >= 0 ? "+" : ""}
                  {c.absoluteDelta.toFixed(2)} ({c.percentDelta >= 0 ? "+" : ""}
                  {c.percentDelta}%)
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
