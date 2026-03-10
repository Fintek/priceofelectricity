import { notFound, permanentRedirect } from "next/navigation";
import { getAverageBillStaticParams } from "@/lib/longtail/averageBill";
import { loadLongtailStateData } from "@/lib/longtail/stateLongtail";
import { getCanonicalUsageCostPath } from "@/lib/longtail/usageEntryRoutes";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return getAverageBillStaticParams();
}

export default async function HowMuchDoes500KwhCostStatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const state = await loadLongtailStateData(slug);
  if (!state) notFound();
  permanentRedirect(getCanonicalUsageCostPath(500, slug));
}
