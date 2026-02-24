import { RAW_STATES } from "@/data/raw/states.raw";
import { validateRawState } from "@/lib/validators/stateValidator";

export type TransformedState = {
  slug: string;
  name: string;
  avgRateCentsPerKwh: number;
  updatedISO: string;
};

const TRANSFORMED_STATE_CACHE = new Map<string, TransformedState>();

export function transformRawState(slug: string): TransformedState {
  const cached = TRANSFORMED_STATE_CACHE.get(slug);
  if (cached) {
    return cached;
  }

  const raw = RAW_STATES[slug];
  if (!raw) {
    throw new Error(`Raw state not found: ${slug}`);
  }

  const validated = validateRawState(slug, raw);
  const transformed: TransformedState = {
    slug,
    name: validated.name,
    avgRateCentsPerKwh: validated.avgRateCentsPerKwh,
    updatedISO: new Date(validated.updated).toISOString(),
  };

  TRANSFORMED_STATE_CACHE.set(slug, transformed);
  return transformed;
}

export function getAllTransformedStates(): Record<string, TransformedState> {
  const result: Record<string, TransformedState> = {};
  for (const slug of Object.keys(RAW_STATES)) {
    result[slug] = transformRawState(slug);
  }
  return result;
}
