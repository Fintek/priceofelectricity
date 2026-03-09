import Skeleton from "@/components/common/Skeleton";

type SkeletonListProps = {
  rows?: number;
};

export default function SkeletonList({ rows = 8 }: SkeletonListProps) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Skeleton style={{ height: 14, width: 24, flexShrink: 0 }} />
          <Skeleton style={{ height: 14, flex: 1, maxWidth: 200 }} />
          <Skeleton style={{ height: 14, width: 80 }} />
        </li>
      ))}
    </ul>
  );
}
