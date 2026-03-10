import {
  APPLIANCE_CONFIGS,
  getApplianceConfig,
  isSupportedApplianceSlug,
  type ApplianceConfig,
  type ApplianceSlug,
} from "@/lib/longtail/applianceConfig";
import { calculateUsageCost, getLongtailStateStaticParams } from "@/lib/longtail/stateLongtail";

const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 365;

export type ApplianceOperatingCost = {
  kwhPerHour: number;
  kwhPerDay: number;
  kwhPerMonth: number;
  kwhPerYear: number;
  costPerHour: number | null;
  costPerDay: number | null;
  costPerMonth: number | null;
  costPerYear: number | null;
};

export async function getApplianceLongtailStaticParams(): Promise<Array<{ appliance: string; state: string }>> {
  const states = await getLongtailStateStaticParams();
  return APPLIANCE_CONFIGS.flatMap((appliance) =>
    states.map(({ state }) => ({ appliance: appliance.slug, state })),
  );
}

export function parseApplianceSlug(value: string): ApplianceSlug | null {
  if (!isSupportedApplianceSlug(value)) return null;
  return value;
}

export function formatWattageRange(config: ApplianceConfig): string {
  return `${config.wattageRange.min.toLocaleString()}-${config.wattageRange.max.toLocaleString()} W`;
}

export function formatHoursPerDay(value: number): string {
  if (Number.isInteger(value)) return `${value} hours/day`;
  return `${value.toFixed(2).replace(/\.?0+$/, "")} hours/day`;
}

export function calculateApplianceOperatingCost(
  avgRateCentsPerKwh: number | null,
  appliance: ApplianceConfig,
): ApplianceOperatingCost {
  const kwhPerHour = appliance.averageWattage / 1000;
  const kwhPerDay = kwhPerHour * appliance.typicalUsageHoursPerDay;
  const kwhPerMonth = kwhPerDay * DAYS_PER_MONTH;
  const kwhPerYear = kwhPerDay * DAYS_PER_YEAR;

  return {
    kwhPerHour,
    kwhPerDay,
    kwhPerMonth,
    kwhPerYear,
    costPerHour: calculateUsageCost(avgRateCentsPerKwh, kwhPerHour),
    costPerDay: calculateUsageCost(avgRateCentsPerKwh, kwhPerDay),
    costPerMonth: calculateUsageCost(avgRateCentsPerKwh, kwhPerMonth),
    costPerYear: calculateUsageCost(avgRateCentsPerKwh, kwhPerYear),
  };
}

export function formatKwh(value: number): string {
  return `${value.toFixed(value >= 10 ? 1 : 2)} kWh`;
}

export function getRelatedAppliances(current: ApplianceSlug, limit = 4): ApplianceConfig[] {
  const currentConfig = getApplianceConfig(current);
  const sameCategory = APPLIANCE_CONFIGS.filter(
    (appliance) => appliance.slug !== current && appliance.category === currentConfig.category,
  );
  const others = APPLIANCE_CONFIGS.filter(
    (appliance) => appliance.slug !== current && appliance.category !== currentConfig.category,
  );

  return [...sameCategory, ...others].slice(0, limit);
}
