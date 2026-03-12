import { permanentRedirect } from "next/navigation";
import { getCityRolloutStaticParams } from "@/lib/longtail/cityElectricity";

export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 86400;

type LegacyCityAliasParams = Promise<{ state: string; city: string }>;

export function generateStaticParams() {
  return getCityRolloutStaticParams();
}

export default async function LegacyCityAliasRedirect({
  params,
}: {
  params: LegacyCityAliasParams;
}) {
  const { state, city } = await params;
  permanentRedirect(`/electricity-cost/${state}/${city}`);
}
