type RankingChartState = {
  slug: string;
  name: string;
  metricValue: number;
};

type RankingChartRow = {
  label: string;
  value: number;
};

export function buildRankingChartModel(
  _pageId: string,
  sortedStates: RankingChartState[],
): {
  barRows: RankingChartRow[];
  sparklinePoints: number[] | null;
} {
  return {
    barRows: sortedStates.slice(0, 10).map((state) => ({
      label: state.name || state.slug,
      value: state.metricValue,
    })),
    // Ranking-position values are not time-series data, so a sparkline is misleading.
    sparklinePoints: null,
  };
}
