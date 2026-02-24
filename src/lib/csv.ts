function escapeCSVField(value: unknown): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const headerLine = headers.map(escapeCSVField).join(",");
  const bodyLines = rows.map((row) =>
    headers.map((h) => escapeCSVField(row[h])).join(",")
  );
  return [headerLine, ...bodyLines].join("\n");
}
