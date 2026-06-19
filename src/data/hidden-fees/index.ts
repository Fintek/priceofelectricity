import itemizedData from "./itemized.json";
import allInData from "./all-in.json";
import methodologyData from "./methodology.json";
import type {
  AllInStateFee,
  HiddenFeesMethodology,
  ItemizedStateFee,
} from "./types";

export type {
  AllInSource,
  AllInStateFee,
  AmountUnit,
  CaBaseChargeCallout,
  ChargeCategory,
  ConfidenceLevel,
  HiddenFeeCharge,
  HiddenFeesMethodology,
  ItemizedStateFee,
  Market,
  MethodologySource,
} from "./types";

/** Slugs of the states with a complete itemized non-energy breakdown, in display order. */
export const ITEMIZED_ORDER = [
  "california",
  "florida",
  "nevada",
  "texas",
] as const;

const itemizedRecord = itemizedData as Record<string, ItemizedStateFee>;

/** All itemized states (3 bundled + Texas delivery-only), in a stable display order. */
export const ITEMIZED_STATES: ItemizedStateFee[] = ITEMIZED_ORDER.map((slug) => {
  const row = itemizedRecord[slug];
  if (!row) {
    throw new Error(`hidden-fees: missing itemized row for "${slug}"`);
  }
  return row;
});

/** Bundled (regulated, whole-bill) itemized states only — excludes deregulated delivery-only Texas. */
export const BUNDLED_ITEMIZED_STATES: ItemizedStateFee[] = ITEMIZED_STATES.filter(
  (row) => !row.isDeregulatedDeliveryOnly,
);

/** All validated all-in rows (26 states). */
export const ALL_IN_STATES: AllInStateFee[] = allInData as AllInStateFee[];

export const HIDDEN_FEES_METHODOLOGY: HiddenFeesMethodology =
  methodologyData as HiddenFeesMethodology;

export type FindingRange = {
  minAddonUsd: number;
  maxAddonUsd: number;
  minSharePercent: number;
  maxSharePercent: number;
  minAddonState: string;
  maxAddonState: string;
  minShareState: string;
  maxShareState: string;
};

/**
 * Compute the non-energy add-on and bill-share ranges from the BUNDLED itemized
 * states only. Texas (deregulated, delivery-only) is excluded so its
 * delivery-only figure is never blended into a whole-bill range.
 */
export function computeBundledFindingRange(): FindingRange {
  const rows = BUNDLED_ITEMIZED_STATES.filter(
    (row) => row.nonEnergyAddonUsd != null && row.nonEnergySharePercent != null,
  );
  if (rows.length === 0) {
    throw new Error("hidden-fees: no bundled itemized rows available for finding range");
  }
  let minAddon = rows[0];
  let maxAddon = rows[0];
  let minShare = rows[0];
  let maxShare = rows[0];
  for (const row of rows) {
    if ((row.nonEnergyAddonUsd ?? 0) < (minAddon.nonEnergyAddonUsd ?? 0)) minAddon = row;
    if ((row.nonEnergyAddonUsd ?? 0) > (maxAddon.nonEnergyAddonUsd ?? 0)) maxAddon = row;
    if ((row.nonEnergySharePercent ?? 0) < (minShare.nonEnergySharePercent ?? 0)) minShare = row;
    if ((row.nonEnergySharePercent ?? 0) > (maxShare.nonEnergySharePercent ?? 0)) maxShare = row;
  }
  return {
    minAddonUsd: minAddon.nonEnergyAddonUsd as number,
    maxAddonUsd: maxAddon.nonEnergyAddonUsd as number,
    minSharePercent: minShare.nonEnergySharePercent as number,
    maxSharePercent: maxShare.nonEnergySharePercent as number,
    minAddonState: minAddon.state,
    maxAddonState: maxAddon.state,
    minShareState: minShare.state,
    maxShareState: maxShare.state,
  };
}

/** Lead-stat state (highest non-energy share among bundled itemized states). */
export function getLeadState(): ItemizedStateFee {
  return computeLeadState();
}

function computeLeadState(): ItemizedStateFee {
  const rows = BUNDLED_ITEMIZED_STATES.filter((row) => row.nonEnergySharePercent != null);
  return rows.reduce((best, row) =>
    (row.nonEnergyAddonUsd ?? 0) > (best.nonEnergyAddonUsd ?? 0) ? row : best,
  );
}
