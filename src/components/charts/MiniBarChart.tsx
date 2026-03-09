export type MiniBarChartRow = {
  label: string;
  value: number;
};

export type MiniBarChartProps = {
  rows: MiniBarChartRow[];
  width?: number;
  height?: number;
  /** If set, bars are scaled from minValue to max; use 0 for comparison charts. */
  minValue?: number;
  title: string;
  subtitle?: string;
  formatValue?: (v: number) => string;
  ariaLabel?: string;
};

export default function MiniBarChart({
  rows,
  width = 720,
  height = 240,
  minValue,
  title,
  subtitle,
  formatValue = (v) => String(v),
  ariaLabel,
}: MiniBarChartProps) {
  if (rows.length === 0) {
    return (
      <figure style={{ margin: 0 }}>
        <svg width={width} height={height} role="img" aria-label={ariaLabel ?? title}>
          <title>{title}</title>
          {subtitle && <desc>{subtitle}</desc>}
          <text
            x={width / 2}
            y={height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="currentColor"
            opacity={0.5}
            fontSize={14}
          >
            No data
          </text>
        </svg>
        {subtitle && (
          <figcaption className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            {subtitle}
          </figcaption>
        )}
      </figure>
    );
  }

  const padding = { top: 24, right: 16, bottom: 32, left: 80 };
  const innerWidth = Math.max(0, width - padding.left - padding.right);
  const innerHeight = Math.max(0, height - padding.top - padding.bottom);

  const values = rows.map((r) => r.value);
  const min = minValue !== undefined ? minValue : Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const barHeight = Math.max(4, innerHeight / rows.length - 8);
  const barGap = 8;

  const descContent = subtitle
    ? `${title}. ${subtitle}. ${rows.map((r) => `${r.label}: ${formatValue(r.value)}`).join("; ")}`
    : `${title}. ${rows.map((r) => `${r.label}: ${formatValue(r.value)}`).join("; ")}`;

  return (
    <figure style={{ margin: 0 }}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={ariaLabel ?? title}
        style={{ display: "block" }}
      >
        <title>{title}</title>
        <desc>{descContent}</desc>
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {rows.map((row, i) => {
            const barWidth = ((row.value - min) / range) * innerWidth || 2;
            const y = i * (barHeight + barGap);
            return (
              <g key={i}>
                <text
                  x={-8}
                  y={y + barHeight / 2}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize={12}
                  fill="currentColor"
                  opacity={0.8}
                >
                  {row.label}
                </text>
                <rect
                  x={0}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={2}
                  ry={2}
                  fill="currentColor"
                  fillOpacity={0.4}
                />
                <text
                  x={barWidth + 8}
                  y={y + barHeight / 2}
                  textAnchor="start"
                  dominantBaseline="middle"
                  fontSize={11}
                  fill="currentColor"
                  opacity={0.7}
                >
                  {formatValue(row.value)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      {subtitle && (
        <figcaption className="muted" style={{ fontSize: 12, marginTop: 4 }}>
          {subtitle}
        </figcaption>
      )}
    </figure>
  );
}
