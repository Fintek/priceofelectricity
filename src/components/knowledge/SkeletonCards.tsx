import Skeleton from "@/components/common/Skeleton";

type SkeletonCardsProps = {
  count?: number;
};

export default function SkeletonCards({ count = 6 }: SkeletonCardsProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 16,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            padding: 16,
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            backgroundColor: "var(--color-surface-alt)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <Skeleton style={{ height: 18, width: "80%" }} />
          <Skeleton style={{ height: 14, width: "100%" }} />
          <Skeleton style={{ height: 14, width: "60%" }} />
          <Skeleton style={{ height: 14, width: "40%", marginTop: 8 }} />
        </div>
      ))}
    </div>
  );
}
