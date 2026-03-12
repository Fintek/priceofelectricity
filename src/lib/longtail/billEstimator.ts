import {
  type AverageBillStateSummary,
  loadAllAverageBillStateSummaries,
  loadAverageBillStateSummary,
} from "@/lib/longtail/averageBill";
import { calculateUsageCost, formatUsd } from "@/lib/longtail/stateLongtail";

export type BillEstimatorProfile = {
  slug: string;
  label: string;
  defaultMonthlyKwh: number;
  monthlyKwhRange: { low: number; high: number };
  usageBehavior: string;
  variabilityNote: string;
};

export const BILL_ESTIMATOR_PROFILES: readonly BillEstimatorProfile[] = [
  {
    slug: "apartment",
    label: "Apartment",
    defaultMonthlyKwh: 650,
    monthlyKwhRange: { low: 450, high: 850 },
    usageBehavior: "Smaller conditioned space with fewer major electric loads and moderate HVAC runtime.",
    variabilityNote: "Usage may rise with electric resistance heating, older HVAC, or high summer cooling demand.",
  },
  {
    slug: "small-home",
    label: "Small Home",
    defaultMonthlyKwh: 900,
    monthlyKwhRange: { low: 700, high: 1150 },
    usageBehavior: "Typical small detached home profile with balanced appliance and HVAC usage.",
    variabilityNote: "Bills vary with occupancy, insulation quality, and electric water-heating share.",
  },
  {
    slug: "medium-home",
    label: "Medium Home",
    defaultMonthlyKwh: 1200,
    monthlyKwhRange: { low: 950, high: 1500 },
    usageBehavior: "Moderate-to-higher whole-home usage from larger floor area and longer HVAC operation.",
    variabilityNote: "High cooling or winter electric heating can move usage above the modeled range.",
  },
  {
    slug: "large-home",
    label: "Large Home",
    defaultMonthlyKwh: 1600,
    monthlyKwhRange: { low: 1300, high: 2100 },
    usageBehavior: "Higher household electricity demand from larger conditioned area and greater appliance intensity.",
    variabilityNote: "Pool pumps, EV charging, and intensive cooling can materially increase monthly usage.",
  },
] as const;

export type BillEstimatorProfileSlug = (typeof BILL_ESTIMATOR_PROFILES)[number]["slug"];

export function isBillEstimatorProfileSlug(value: string): value is BillEstimatorProfileSlug {
  return BILL_ESTIMATOR_PROFILES.some((profile) => profile.slug === value);
}

export function getBillEstimatorProfile(slug: string): BillEstimatorProfile | null {
  return BILL_ESTIMATOR_PROFILES.find((profile) => profile.slug === slug) ?? null;
}

export function getBillEstimatorStateStaticParams(): Promise<Array<{ slug: string }>> {
  return loadAllAverageBillStateSummaries().then((states) => states.map((state) => ({ slug: state.slug })));
}

export async function getBillEstimatorProfileStaticParams(): Promise<
  Array<{ slug: string; profile: BillEstimatorProfileSlug }>
> {
  const states = await getBillEstimatorStateStaticParams();
  return states.flatMap(({ slug }) =>
    BILL_ESTIMATOR_PROFILES.map((profile) => ({
      slug,
      profile: profile.slug,
    })),
  );
}

export function calculateBillEstimatorProfileMonthlyCost(
  stateRateCentsPerKwh: number | null,
  profile: BillEstimatorProfile,
): number | null {
  return calculateUsageCost(stateRateCentsPerKwh, profile.defaultMonthlyKwh);
}

export function buildBillEstimatorProfileRows(state: AverageBillStateSummary): Array<{
  profile: BillEstimatorProfile;
  monthlyCost: number | null;
  annualCost: number | null;
  href: string;
}> {
  return BILL_ESTIMATOR_PROFILES.map((profile) => {
    const monthlyCost = calculateBillEstimatorProfileMonthlyCost(state.avgRateCentsPerKwh, profile);
    return {
      profile,
      monthlyCost,
      annualCost: monthlyCost != null ? monthlyCost * 12 : null,
      href: `/electricity-bill-estimator/${state.slug}/${profile.slug}`,
    };
  });
}

export async function loadBillEstimatorStateSummary(slug: string): Promise<AverageBillStateSummary | null> {
  return loadAverageBillStateSummary(slug);
}

export async function loadAllBillEstimatorStateSummaries(): Promise<AverageBillStateSummary[]> {
  return loadAllAverageBillStateSummaries();
}

export function buildBillEstimatorMethodologyNote(profile: BillEstimatorProfile): string {
  return `This deterministic scenario applies ${profile.defaultMonthlyKwh.toLocaleString()} kWh/month for the ${profile.label.toLowerCase()} profile and excludes delivery fees, taxes, and fixed utility charges.`;
}

export function buildBillEstimatorDifferenceVsBenchmark(
  profileMonthlyCost: number | null,
  benchmarkMonthlyCost: number | null,
): string {
  if (profileMonthlyCost == null || benchmarkMonthlyCost == null) return "N/A";
  const diff = profileMonthlyCost - benchmarkMonthlyCost;
  const direction = diff >= 0 ? "higher" : "lower";
  return `${formatUsd(Math.abs(diff))} ${direction}`;
}
