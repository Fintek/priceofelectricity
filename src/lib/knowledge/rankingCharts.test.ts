import assert from "node:assert/strict";
import test from "node:test";
import { buildRankingChartModel } from "@/lib/knowledge/rankingCharts";

test("keeps bar rows for the top 10 ranking states", () => {
  const model = buildRankingChartModel("electricity-inflation-1y", [
    { slug: "district-of-columbia", name: "District of Columbia", metricValue: 12.4 },
    { slug: "hawaii", name: "Hawaii", metricValue: 8.2 },
    { slug: "california", name: "California", metricValue: 6.4 },
  ]);

  assert.deepEqual(model.barRows, [
    { label: "District of Columbia", value: 12.4 },
    { label: "Hawaii", value: 8.2 },
    { label: "California", value: 6.4 },
  ]);
});

test("does not emit a sparkline for ranking-position values", () => {
  const model = buildRankingChartModel("electricity-inflation-1y", [
    { slug: "district-of-columbia", name: "District of Columbia", metricValue: 12.4 },
    { slug: "hawaii", name: "Hawaii", metricValue: 8.2 },
    { slug: "california", name: "California", metricValue: 6.4 },
  ]);

  assert.equal(model.sparklinePoints, null);
});
