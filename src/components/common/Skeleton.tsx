import type { CSSProperties } from "react";

type SkeletonProps = {
  className?: string;
  style?: CSSProperties;
};

export default function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: "var(--color-surface-alt)",
        borderRadius: 4,
        minHeight: 16,
        backgroundImage:
          "linear-gradient(90deg, var(--color-surface-alt) 0%, var(--color-border) 50%, var(--color-surface-alt) 100%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.2s ease-in-out infinite",
        ...style,
      }}
    />
  );
}
