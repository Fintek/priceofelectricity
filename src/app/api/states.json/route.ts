import { STATE_LIST } from "@/data/states";

const API_CACHE_CONTROL =
  "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800";

export const dynamic = "force-static";
export const revalidate = 86400;

export function GET() {
  const payload = [...STATE_LIST]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((state) => ({
      slug: state.slug,
      name: state.name,
      postal: state.postal,
      avgRateCentsPerKwh: state.avgRateCentsPerKwh,
      updated: state.updated,
      sourceName: state.sourceName,
      sourceUrl: state.sourceUrl,
    }));

  return Response.json(payload, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": API_CACHE_CONTROL,
    },
  });
}
