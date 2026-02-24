import type { NextWebVitalsMetric } from "next/app";

export function reportWebVitals(metric: NextWebVitalsMetric): void {
  console.log("[web-vitals]", {
    name: metric.name,
    value: metric.value,
    id: metric.id,
    label: metric.label,
    startTime: metric.startTime,
  });
}
