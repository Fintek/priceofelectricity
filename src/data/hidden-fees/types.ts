// Types for the manually-curated "Hidden Electricity Fees & Taxes" dataset.
//
// This dataset is POINT-IN-TIME and HAND-CURATED from utility tariff filings,
// OpenEI URDB, and EIA reference averages. It is deliberately NOT wired into
// the monthly EIA refresh pipeline — each row carries its own `asOf` date and
// the dataset carries a single `datasetLastUpdated`. Numbers are copied
// verbatim from the QA'd utility-fees export; never interpolate or fabricate a
// fee figure here.

export type ConfidenceLevel = "high" | "medium" | "low";

export type AllInSource = "firecrawl" | "urdb";

export type Market = "regulated" | "deregulated";

export type ChargeCategory =
  | "fixed_customer_charge"
  | "delivery_distribution"
  | "transmission"
  | "fuel_adjustment"
  | "renewable_rider"
  | "efficiency_rider"
  | "other_rider"
  | "state_local_tax"
  | "franchise_gross_receipts_tax"
  | "regulatory_fee"
  | "other";

export type AmountUnit = "usd_per_month" | "cents_per_kwh" | "percent" | "usd_flat";

/** A single charge line item extracted from a utility tariff or filing. */
export type HiddenFeeCharge = {
  name: string;
  category: ChargeCategory;
  amount: number;
  unit: AmountUnit;
  sourceUrl: string;
  asOf: string | null;
  confidence: ConfidenceLevel;
  /** Whether this line is included in the modeled monthly non-energy add-on. */
  includedInAddon: boolean;
  note?: string;
};

/**
 * A state with a complete, itemized non-energy breakdown at the 900 kWh basis.
 * Deregulated delivery-only states (e.g. TX) set `isDeregulatedDeliveryOnly`
 * and leave whole-bill fields (`nonEnergyAddonUsd`, `nonEnergySharePercent`,
 * `allInCentsPerKwh`) null, since supply is billed separately by a competitive
 * retailer.
 */
export type ItemizedStateFee = {
  postal: string;
  state: string;
  slug: string;
  utility: string;
  market: Market;
  usageKwh: number;
  energyRateCentsPerKwh: number | null;
  fixedUsdPerMonth: number;
  ridersCentsPerKwh: number;
  taxPercent: number;
  taxNote?: string;
  nonEnergyAddonUsd: number | null;
  nonEnergySharePercent: number | null;
  allInCentsPerKwh: number | null;
  eiaReferenceCentsPerKwh: number | null;
  reconciliationDeltaPercent: number | null;
  asOf: string | null;
  confidence: ConfidenceLevel;
  breakdownStatus?: string;
  isDeregulatedDeliveryOnly?: boolean;
  /** State-level clarification (e.g. tier-blended rider modeling). */
  note?: string;
  sourceUrls: string[];
  charges: HiddenFeeCharge[];
};

/**
 * A state with a single validated all-in cents/kWh figure (the "real" cost of
 * electricity including fees), but not necessarily a full itemized breakdown.
 */
export type AllInStateFee = {
  postal: string;
  state: string;
  slug: string;
  utility: string;
  allInCentsPerKwh: number;
  source: AllInSource;
  confidence: ConfidenceLevel;
  asOf: string | null;
  sourceUrl: string;
  urdbUri?: string;
  /** Optional provenance/correction note (e.g. independent re-verification, pending rate change). */
  note?: string;
  /** True when this state also appears in the itemized breakdown table. */
  breakdownAvailable: boolean;
};

export type MethodologySource = {
  name: string;
  role: string;
  url?: string;
};

/** PG&E's income-graduated Base Services Charge tiers (monthly), CA callout. */
export type CaBaseChargeCallout = {
  tier1CareFeraUsd: number;
  tier2Usd: number;
  tier3StandardUsd: number;
  modeledTier: string;
  note: string;
};

export type HiddenFeesMethodology = {
  datasetLastUpdated: string;
  usageBasisKwh: number;
  reconciliationTolerancePercent: number;
  sources: MethodologySource[];
  nonEnergyDefinition: string;
  confidenceDefinitions: Record<ConfidenceLevel, string>;
  coverageNote: string;
  caBaseChargeCallout: CaBaseChargeCallout;
  excludedStatesNote: string;
};
