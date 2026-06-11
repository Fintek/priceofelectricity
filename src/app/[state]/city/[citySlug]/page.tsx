import { notFound, permanentRedirect } from "next/navigation";
import { isActiveCityPageKey } from "@/lib/longtail/rollout";

export const dynamic = "force-dynamic";

export default async function LegacyCityRouteRedirect({
  params,
}: {
  params: Promise<{ state: string; citySlug: string }>;
}) {
  const { state, citySlug } = await params;
  if (!isActiveCityPageKey(state, citySlug)) {
    notFound();
  }
  permanentRedirect(`/electricity-cost/${state}/${citySlug}`);
}
