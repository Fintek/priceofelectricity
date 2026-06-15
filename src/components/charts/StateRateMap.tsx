import mapPaths from "@/data/usStateMapPaths.generated.json";
import { STATE_ABBREV } from "@/data/stateAbbr";
import { getRateTier, getRateTierLabel } from "@/lib/insights";

export type StateRateMapState = {
  slug: string;
  name: string;
  avgRateCentsPerKwh: number;
};

export type StateRateMapProps = {
  states: StateRateMapState[];
  nationalAverage: number;
  highlightSlug?: string;
  caption?: string;
  linkStates?: boolean;
};

type MapPathEntry = {
  d: string;
  cx: number;
  cy: number;
};

const TIER_FILL: Record<ReturnType<typeof getRateTier>, string> = {
  low: "var(--tier-low-bg)",
  medium: "var(--tier-medium-bg)",
  high: "var(--tier-high-bg)",
};

function formatPctVsNational(rate: number, nationalAverage: number): {
  pct: number;
  direction: "above" | "below";
} {
  const pct = Math.round(
    (Math.abs(rate - nationalAverage) / nationalAverage) * 100,
  );
  return {
    pct,
    direction: rate >= nationalAverage ? "above" : "below",
  };
}

function buildPathTitle(
  name: string,
  rate: number | null,
  nationalAverage: number,
): string {
  if (rate === null || !Number.isFinite(rate)) {
    return `${name}: data unavailable`;
  }
  const { pct, direction } = formatPctVsNational(rate, nationalAverage);
  return `${name}: ${rate}¢/kWh — ${pct}% ${direction} the national average`;
}

type StatePathProps = {
  slug: string;
  name: string;
  rate: number | null;
  pathData: MapPathEntry;
  nationalAverage: number;
  linkStates?: boolean;
  highlighted?: boolean;
};

function StatePath({
  slug,
  name,
  rate,
  pathData,
  nationalAverage,
  linkStates,
  highlighted,
}: StatePathProps) {
  const fill =
    rate === null || !Number.isFinite(rate)
      ? "var(--color-border)"
      : TIER_FILL[getRateTier(rate)];
  const title = buildPathTitle(name, rate, nationalAverage);

  const pathEl = (
    <path
      d={pathData.d}
      fill={fill}
      stroke={highlighted ? "var(--color-text)" : "var(--color-bg)"}
      strokeWidth={highlighted ? 2 : 1}
    >
      <title>{title}</title>
    </path>
  );

  if (linkStates) {
    return (
      <a
        key={slug}
        href={`/electricity-price-per-kwh/${slug}`}
        aria-label={title}
      >
        {pathEl}
      </a>
    );
  }

  return <g key={slug}>{pathEl}</g>;
}

export default function StateRateMap({
  states,
  nationalAverage,
  highlightSlug,
  caption,
  linkStates,
}: StateRateMapProps) {
  const paths = mapPaths.states as Record<string, MapPathEntry>;
  const rateBySlug = new Map(
    states.map((s) => [s.slug, s.avgRateCentsPerKwh] as const),
  );
  const nameBySlug = new Map(states.map((s) => [s.slug, s.name] as const));

  const joinedSlugs = Object.keys(paths)
    .filter((slug) => rateBySlug.has(slug))
    .sort((a, b) => a.localeCompare(b));

  const ratedStates = states.filter(
    (s) => s.avgRateCentsPerKwh !== null && Number.isFinite(s.avgRateCentsPerKwh),
  );
  const highest = [...ratedStates].sort(
    (a, b) => b.avgRateCentsPerKwh - a.avgRateCentsPerKwh,
  )[0];
  const lowest = [...ratedStates].sort(
    (a, b) => a.avgRateCentsPerKwh - b.avgRateCentsPerKwh,
  )[0];

  const descParts: string[] = [];
  if (highest) {
    descParts.push(
      `Highest: ${highest.name} at ${highest.avgRateCentsPerKwh}¢/kWh`,
    );
  }
  if (lowest) {
    descParts.push(
      `Lowest: ${lowest.name} at ${lowest.avgRateCentsPerKwh}¢/kWh`,
    );
  }
  descParts.push(`National average: ${nationalAverage}¢/kWh`);

  const regularSlugs = joinedSlugs.filter((slug) => slug !== highlightSlug);
  const highlightEntry =
    highlightSlug && paths[highlightSlug] && rateBySlug.has(highlightSlug)
      ? {
          slug: highlightSlug,
          pathData: paths[highlightSlug],
          rate: rateBySlug.get(highlightSlug) ?? null,
          name: nameBySlug.get(highlightSlug) ?? highlightSlug,
        }
      : null;

  return (
    <figure className="state-rate-map" style={{ margin: 0 }}>
      <div
        role="group"
        aria-label="Rate tier legend"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          marginBottom: 12,
          fontSize: 12,
        }}
      >
        {(["low", "medium", "high"] as const).map((tier) => (
          <span
            key={tier}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <span
              aria-hidden
              style={{
                width: 14,
                height: 14,
                borderRadius: 2,
                background: TIER_FILL[tier],
                border: "1px solid var(--color-border)",
              }}
            />
            {getRateTierLabel(tier)}
            {tier === "low" && " <15¢"}
            {tier === "medium" && " 15–22¢"}
            {tier === "high" && " >22¢"}
          </span>
        ))}
        <span style={{ color: "var(--color-muted)" }}>
          National average: {nationalAverage}¢/kWh
        </span>
      </div>

      <svg
        viewBox={mapPaths.viewBox}
        role="img"
        aria-label="US map of electricity rates by state; green = below-average, red = above-average"
        style={{ display: "block", width: "100%", height: "auto", maxWidth: 975 }}
      >
        <title>US electricity rates by state</title>
        <desc>{descParts.join(". ")}.</desc>

        {regularSlugs.map((slug) => (
          <StatePath
            key={slug}
            slug={slug}
            name={nameBySlug.get(slug) ?? slug}
            rate={rateBySlug.get(slug) ?? null}
            pathData={paths[slug]}
            nationalAverage={nationalAverage}
            linkStates={linkStates}
          />
        ))}

        {highlightEntry ? (
          <StatePath
            slug={highlightEntry.slug}
            name={highlightEntry.name}
            rate={highlightEntry.rate}
            pathData={highlightEntry.pathData}
            nationalAverage={nationalAverage}
            linkStates={linkStates}
            highlighted
          />
        ) : null}

        {joinedSlugs.map((slug) => {
          const entry = paths[slug];
          const abbr = STATE_ABBREV[slug];
          if (!abbr || entry.cx === undefined || entry.cy === undefined) {
            return null;
          }
          return (
            <text
              key={`label-${slug}`}
              x={entry.cx}
              y={entry.cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={11}
              fill="var(--color-text)"
              pointerEvents="none"
            >
              {abbr}
            </text>
          );
        })}
      </svg>

      {caption ? (
        <figcaption className="muted" style={{ fontSize: 14, marginTop: 12 }}>
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
