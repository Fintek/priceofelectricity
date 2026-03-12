import { permanentRedirect } from "next/navigation";
import { getCityRolloutStaticParams } from "@/lib/longtail/cityElectricity";

export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 86400;

type LegacyCityParams = Promise<{ state: string; citySlug: string }>;

export function generateStaticParams() {
  return getCityRolloutStaticParams().map(({ state, city }) => ({
    state,
    citySlug: city,
  }));
}

export default async function LegacyCityRouteRedirect({
  params,
}: {
  params: LegacyCityParams;
}) {
  const { state, citySlug } = await params;
  permanentRedirect(`/electricity-cost/${state}/${citySlug}`);
}
