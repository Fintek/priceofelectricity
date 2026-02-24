export const SITE_NAME = "PriceOfElectricity.com";

function normalizeSiteUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

function resolveSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    return normalizeSiteUrl(fromEnv);
  }

  if (process.env.NODE_ENV === "production") {
    return "https://priceofelectricity.com";
  }

  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();
export const LAUNCH_MODE = process.env.LAUNCH_MODE === "true";
export const UPDATE_CADENCE_TEXT = "Updated monthly";
export const LAST_REVIEWED = "2026-02-22";
