export type SparklineProps = {
  values: number[];
  width?: number;
  height?: number;
};

export default function Sparkline({
  values,
  width = 120,
  height = 30,
}: SparklineProps) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padding = 2;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const stepX = innerWidth / (values.length - 1);

  const points = values.map((v, i) => {
    const x = padding + i * stepX;
    const y = padding + innerHeight - ((v - min) / range) * innerHeight;
    return `${x},${y}`;
  });
  const pathD = `M ${points.join(" L ")}`;

  return (
    <svg
      width={width}
      height={height}
      role="img"
      aria-hidden
      style={{ display: "block" }}
    >
      <path
        d={pathD}
        fill="none"
        stroke="var(--color-muted, #6b7280)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
