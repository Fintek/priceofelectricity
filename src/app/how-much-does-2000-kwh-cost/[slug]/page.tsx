import { permanentRedirect } from "next/navigation";
import { getCanonicalUsageCostPath } from "@/lib/longtail/usageEntryRoutes";

export const dynamic = "force-dynamic";

export default async function HowMuchDoes2000KwhCostStatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  permanentRedirect(getCanonicalUsageCostPath(2000, slug));
}
