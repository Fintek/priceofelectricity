import { permanentRedirect } from "next/navigation";
import { getCanonicalUsageCostPath } from "@/lib/longtail/usageEntryRoutes";

export const dynamic = "force-dynamic";

export default async function HowMuchDoes1500KwhCostStatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  permanentRedirect(getCanonicalUsageCostPath(1500, slug));
}
