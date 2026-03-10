import {
  getIndustryConfig,
  isSupportedIndustrySlug,
  SUPPORTED_INDUSTRY_SLUGS,
  type IndustrySlug,
} from "@/lib/longtail/industryConfig";
import {
  calculateUsageCost,
  formatRate,
  formatUsd,
  getLongtailStateStaticParams,
  type LongtailStateData,
} from "@/lib/longtail/stateLongtail";

export type IndustryEstimate = {
  industry: IndustrySlug;
  displayName: string;
  shortLabel: string;
  assumptionsLabel: string;
  assumptionsNotes: string;
  framingBullets: string[];
  monthlyUsageKwh: number;
  annualUsageKwh: number;
  monthlyCostState: number | null;
  annualCostState: number | null;
  monthlyCostNational: number | null;
  annualCostNational: number | null;
  monthlyDifferenceVsNational: number | null;
  annualDifferenceVsNational: number | null;
  summary: string;
};

export function buildIndustryStaticParams(states: Array<{ state: string }>) {
  return SUPPORTED_INDUSTRY_SLUGS.flatMap((industry) =>
    states.map(({ state }) => ({ industry, state })),
  );
}

export async function getIndustryLongtailStaticParams() {
  const states = await getLongtailStateStaticParams();
  return buildIndustryStaticParams(states);
}

export function parseIndustrySlug(value: string): IndustrySlug | null {
  if (!isSupportedIndustrySlug(value)) return null;
  return value;
}

export function buildIndustryEstimate(
  industry: IndustrySlug,
  stateData: LongtailStateData,
): IndustryEstimate {
  const config = getIndustryConfig(industry);
  const monthlyCostState = calculateUsageCost(stateData.avgRateCentsPerKwh, config.monthlyUsageKwh);
  const annualCostState = calculateUsageCost(stateData.avgRateCentsPerKwh, config.annualUsageKwh);
  const monthlyCostNational = calculateUsageCost(
    stateData.nationalAverageCentsPerKwh,
    config.monthlyUsageKwh,
  );
  const annualCostNational = calculateUsageCost(
    stateData.nationalAverageCentsPerKwh,
    config.annualUsageKwh,
  );
  const monthlyDifferenceVsNational =
    monthlyCostState != null && monthlyCostNational != null
      ? monthlyCostState - monthlyCostNational
      : null;
  const annualDifferenceVsNational =
    annualCostState != null && annualCostNational != null
      ? annualCostState - annualCostNational
      : null;

  const summary =
    monthlyCostState != null
      ? `${stateData.name} average electricity rate is ${formatRate(stateData.avgRateCentsPerKwh)}. Under the example ${config.shortLabel} assumption (${config.monthlyUsageKwh.toLocaleString()} kWh/month), estimated monthly energy cost is ${formatUsd(monthlyCostState)}.`
      : `${stateData.name} ${config.shortLabel} electricity cost estimate is unavailable because state rate data is missing.`;

  return {
    industry,
    displayName: config.displayName,
    shortLabel: config.shortLabel,
    assumptionsLabel: config.assumptionsLabel,
    assumptionsNotes: config.assumptionsNotes,
    framingBullets: config.framingBullets,
    monthlyUsageKwh: config.monthlyUsageKwh,
    annualUsageKwh: config.annualUsageKwh,
    monthlyCostState,
    annualCostState,
    monthlyCostNational,
    annualCostNational,
    monthlyDifferenceVsNational,
    annualDifferenceVsNational,
    summary,
  };
}
