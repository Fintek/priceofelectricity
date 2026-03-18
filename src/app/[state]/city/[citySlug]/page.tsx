import { permanentRedirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LegacyCityRouteRedirect({
  params,
}: {
  params: Promise<{ state: string; citySlug: string }>;
}) {
  const { state, citySlug } = await params;
  permanentRedirect(`/electricity-cost/${state}/${citySlug}`);
}
