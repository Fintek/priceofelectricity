export type SparklineProps = {
  points: number[];
  width?: number;
  height?: number;
  title: string;
  subtitle?: string;
  formatValue?: (v: number) => string;
  ariaLabel?: string;
};

export default function Sparkline({
  points,
  width = 240,
  height = 48,
  title,
  subtitle,
  formatValue = (v) => String(v),
  ariaLabel,
}: SparklineProps) {
  if (points.length === 0) {
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
            fontSize={12}
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

  const padding = { top: 4, right: 4, bottom: 4, left: 4 };
  const innerWidth = Math.max(0, width - padding.left - padding.right);
  const innerHeight = Math.max(0, height - padding.top - padding.bottom);

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = points.length > 1 ? innerWidth / (points.length - 1) : 0;

  const pathPoints = points.map((v, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + innerHeight - ((v - min) / range) * innerHeight;
    return `${x},${y}`;
  });
  const pathD =
    pathPoints.length === 1
      ? `M ${pathPoints[0]} L ${pathPoints[0]}`
      : `M ${pathPoints.join(" L ")}`;

  const descContent = subtitle
    ? `${title}. ${subtitle}. Values: ${points.map(formatValue).join(", ")}`
    : `${title}. Values: ${points.map(formatValue).join(", ")}`;

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
        <path
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.6}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {subtitle && (
        <figcaption className="muted" style={{ fontSize: 12, marginTop: 4 }}>
          {subtitle}
        </figcaption>
      )}
    </figure>
  );
}
