import { permanentRedirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LegacyCityAliasRedirect({
  params,
}: {
  params: Promise<{ state: string; city: string }>;
}) {
  const { state, city } = await params;
  permanentRedirect(`/electricity-cost/${state}/${city}`);
}
