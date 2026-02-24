export type RawState = {
  name: string;
  avgRateCentsPerKwh: number;
  updated: string;
};

export function validateRawState(slug: string, data: any): RawState {
  if (!data || typeof data !== "object") {
    throw new Error(`Invalid raw state "${slug}": expected object`);
  }

  if (typeof data.name !== "string" || data.name.trim().length === 0) {
    throw new Error(`Invalid raw state "${slug}": name must be a non-empty string`);
  }

  if (
    typeof data.avgRateCentsPerKwh !== "number" ||
    !Number.isFinite(data.avgRateCentsPerKwh) ||
    data.avgRateCentsPerKwh <= 0
  ) {
    throw new Error(
      `Invalid raw state "${slug}": avgRateCentsPerKwh must be a number greater than 0`
    );
  }

  if (typeof data.updated !== "string" || Number.isNaN(Date.parse(data.updated))) {
    throw new Error(`Invalid raw state "${slug}": updated must be a parseable date string`);
  }

  return {
    name: data.name,
    avgRateCentsPerKwh: data.avgRateCentsPerKwh,
    updated: data.updated,
  };
}
