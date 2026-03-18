import { notFound, permanentRedirect } from "next/navigation";
import { normalizeSlug } from "@/data/slug";

export const dynamic = "force-dynamic";

export default async function StateComparisonPage({
  params,
}: {
  params: Promise<{ pair: string }>;
}) {
  const { pair } = await params;
  const parts = pair.split("-vs-");
  if (parts.length !== 2) notFound();

  const first = normalizeSlug(parts[0]);
  const second = normalizeSlug(parts[1]);
  if (!first || !second || first === second) notFound();

  const canonicalPair = [first, second].sort((x, y) => x.localeCompare(y)).join("-vs-");
  permanentRedirect(`/electricity-cost-comparison/${canonicalPair}`);
}
