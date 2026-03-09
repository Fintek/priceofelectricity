type BulletBarProps = {
  value: number;
  min: number;
  max: number;
  target?: number;
  labelLeft?: string;
  labelRight?: string;
  format?: (n: number) => string;
  width?: number;
  height?: number;
};

const defaultFormat = (n: number) => String(n);

export default function BulletBar({
  value,
  min,
  max,
  target,
  labelLeft,
  labelRight,
  format = defaultFormat,
  width = 240,
  height = 14,
}: BulletBarProps) {
  if (max <= min) return null;

  const range = max - min;
  const fillPct = Math.max(0, Math.min(1, (value - min) / range));
  const fillWidth = fillPct * width;
  const targetPct = target != null && target >= min && target <= max
    ? (target - min) / range
    : null;
  const targetX = targetPct != null ? targetPct * width : null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      {labelLeft && (
        <span className="muted" style={{ fontSize: 12, minWidth: 48 }}>
          {labelLeft}
        </span>
      )}
      <svg
        width={width}
        height={height}
        style={{ display: "block", flexShrink: 0 }}
        aria-hidden
      >
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          rx={2}
          ry={2}
          fill="var(--color-surface-alt)" 
          stroke="var(--color-border)"
        />
        <rect
          x={0}
          y={0}
          width={fillWidth}
          height={height}
          rx={2}
          ry={2}
          fill="var(--color-text)"
          opacity={0.4}
        />
        {targetX != null && targetX > 0 && targetX < width && (
          <line
            x1={targetX}
            y1={0}
            x2={targetX}
            y2={height}
            stroke="var(--color-muted)"
            strokeWidth={2}
            strokeDasharray="2 2"
          />
        )}
      </svg>
      {labelRight && (
        <span className="muted" style={{ fontSize: 12, minWidth: 48 }}>
          {labelRight}
        </span>
      )}
      <span style={{ fontSize: 13, fontWeight: 500 }}>
        {format(value)}
      </span>
    </div>
  );
}
