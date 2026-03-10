import { getActiveUsageKwhTiers } from "@/lib/longtail/rollout";

export const LEGACY_USAGE_ENTRY_KWH_VALUES = [500, 1000, 1500, 2000] as const;

export type LegacyUsageEntryKwh = (typeof LEGACY_USAGE_ENTRY_KWH_VALUES)[number];

export function isLegacyUsageEntryKwh(value: number): value is LegacyUsageEntryKwh {
  return LEGACY_USAGE_ENTRY_KWH_VALUES.includes(value as LegacyUsageEntryKwh);
}

export function getLegacyUsageEntryBasePath(kwh: LegacyUsageEntryKwh): string {
  return `/how-much-does-${kwh}-kwh-cost`;
}

export function getCanonicalUsageCostPath(kwh: number, state: string): string {
  return `/electricity-usage-cost/${kwh}/${state}`;
}

export function getCanonicalUsageHubPath(kwh: number): string {
  return getActiveUsageKwhTiers().includes(kwh) ? `/electricity-hubs/usage/${kwh}` : "/electricity-hubs/usage";
}
