export default function ProviderComparisonTable({
  title,
  rows,
}: {
  title: string;
  rows: Array<{
    id: string;
    name: string;
    providerType: string;
    services: string;
    leadModel: string;
    sponsored: string;
  }>;
}) {
  if (rows.length === 0) return null;

  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 20, marginBottom: 12 }}>{title}</h2>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid var(--color-border, #e5e7eb)",
          }}
        >
          <thead>
            <tr>
              {["Provider", "Type", "Services", "Lead model", "Sponsored"].map((label) => (
                <th
                  key={label}
                  style={{
                    textAlign: "left",
                    padding: 10,
                    borderBottom: "1px solid var(--color-border, #e5e7eb)",
                    backgroundColor: "var(--color-surface-alt, #f9fafb)",
                  }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>{row.name}</td>
                <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>{row.providerType}</td>
                <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>{row.services}</td>
                <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>{row.leadModel}</td>
                <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>{row.sponsored}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
