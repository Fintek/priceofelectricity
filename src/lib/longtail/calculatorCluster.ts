import {
  APPLIANCE_CONFIGS,
  getApplianceConfig,
  isSupportedApplianceSlug,
  type ApplianceConfig,
  type ApplianceSlug,
} from "@/lib/longtail/applianceConfig";
import {
  calculateApplianceOperatingCost,
  formatHoursPerDay,
  formatKwh,
  getApplianceLongtailStaticParams,
} from "@/lib/longtail/applianceLongtail";
import {
  calculateUsageCost,
  formatRate,
  formatUsd,
  getLongtailStateStaticParams,
  type LongtailStateData,
} from "@/lib/longtail/stateLongtail";

export const CALCULATOR_USAGE_TIERS = [500, 1000, 1500, 2000] as const;

export type CalculatorUsageScenario = {
  kwh: number;
  monthlyCost: number | null;
  annualCost: number | null;
  href: string;
};

export type CalculatorApplianceLink = {
  href: string;
  label: string;
  description: string;
};

export type ApplianceUsageProfile = {
  id: string;
  label: string;
  hoursPerDay: number;
};

export async function getCalculatorStateStaticParams(): Promise<Array<{ slug: string }>> {
  const states = await getLongtailStateStaticParams();
  return states.map(({ state }) => ({ slug: state }));
}

export async function getCalculatorApplianceStaticParams(): Promise<
  Array<{ slug: string; appliance: string }>
> {
  const params = await getApplianceLongtailStaticParams();
  return params.map((item) => ({ slug: item.state, appliance: item.appliance }));
}

export function parseApplianceCalculatorSlug(value: string): ApplianceSlug | null {
  if (!isSupportedApplianceSlug(value)) return null;
  return value;
}

export function buildCalculatorUsageScenarios(state: LongtailStateData): CalculatorUsageScenario[] {
  return CALCULATOR_USAGE_TIERS.map((kwh) => {
    const monthlyCost = calculateUsageCost(state.avgRateCentsPerKwh, kwh);
    return {
      kwh,
      monthlyCost,
      annualCost: monthlyCost != null ? monthlyCost * 12 : null,
      href: `/electricity-usage-cost/${kwh}/${state.slug}`,
    };
  });
}

export function buildCalculatorApplianceLinks(
  state: LongtailStateData,
  limit = 6,
): CalculatorApplianceLink[] {
  return APPLIANCE_CONFIGS.slice(0, limit).map((appliance) => ({
    href: `/electricity-cost-calculator/${state.slug}/${appliance.slug}`,
    label: `${appliance.displayName} calculator`,
    description: `Model ${appliance.displayName.toLowerCase()} electricity cost in ${state.name} at ${formatRate(
      state.avgRateCentsPerKwh,
    )}.`,
  }));
}

export function buildApplianceUsageProfiles(appliance: ApplianceConfig): ApplianceUsageProfile[] {
  return [
    {
      id: "light",
      label: "Light usage",
      hoursPerDay: Math.max(0.5, appliance.typicalUsageHoursPerDay * 0.5),
    },
    {
      id: "typical",
      label: "Typical usage",
      hoursPerDay: appliance.typicalUsageHoursPerDay,
    },
    {
      id: "heavy",
      label: "Heavy usage",
      hoursPerDay: Math.min(24, Math.max(appliance.typicalUsageHoursPerDay + 2, appliance.typicalUsageHoursPerDay * 1.5)),
    },
  ];
}

export function buildApplianceScenarioRows(
  stateRateCentsPerKwh: number | null,
  nationalRateCentsPerKwh: number | null,
  applianceSlug: ApplianceSlug,
): Array<{
  profile: ApplianceUsageProfile;
  stateMonthlyCost: number | null;
  nationalMonthlyCost: number | null;
  stateYearlyCost: number | null;
  annualKwh: string;
}> {
  const appliance = getApplianceConfig(applianceSlug);
  return buildApplianceUsageProfiles(appliance).map((profile) => {
    const usageAdjustedAppliance: ApplianceConfig = {
      ...appliance,
      typicalUsageHoursPerDay: profile.hoursPerDay,
    };
    const stateCost = calculateApplianceOperatingCost(stateRateCentsPerKwh, usageAdjustedAppliance);
    const nationalCost = calculateApplianceOperatingCost(nationalRateCentsPerKwh, usageAdjustedAppliance);

    return {
      profile,
      stateMonthlyCost: stateCost.costPerMonth,
      nationalMonthlyCost: nationalCost.costPerMonth,
      stateYearlyCost: stateCost.costPerYear,
      annualKwh: formatKwh(stateCost.kwhPerYear),
    };
  });
}

export function buildApplianceCalculatorSummary(
  stateName: string,
  appliance: ApplianceConfig,
  stateRateCentsPerKwh: number | null,
): string {
  const typical = calculateApplianceOperatingCost(stateRateCentsPerKwh, appliance);
  return `${appliance.displayName} in ${stateName} at ${formatRate(
    stateRateCentsPerKwh,
  )}: ${formatUsd(typical.costPerMonth)} per month, ${formatUsd(typical.costPerYear)} per year using ${formatHoursPerDay(
    appliance.typicalUsageHoursPerDay,
  )}.`;
}
