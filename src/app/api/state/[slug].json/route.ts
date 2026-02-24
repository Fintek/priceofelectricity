import { STATES } from "@/data/states";
import { normalizeSlug } from "@/data/slug";

const API_CACHE_CONTROL =
  "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function GET(
  _request: Request,
  context: { params: Promise<any> }
) {
  const params = await context.params;
  const rawSlug = typeof params?.slug === "string" ? params.slug : "";
  const slug = normalizeSlug(rawSlug);
  const state = STATES[slug];

  if (!state) {
    return Response.json(
      { error: "not_found" },
      {
        status: 404,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": API_CACHE_CONTROL,
        },
      }
    );
  }

  const rate = Number(state.avgRateCentsPerKwh);
  const examples = [500, 1000, 1500].map((kwh) => ({
    kwh,
    dollars: Number(((kwh * rate) / 100).toFixed(2)),
  }));

  return Response.json(
    {
      slug: state.slug,
      name: state.name,
      postal: state.postal,
      avgRateCentsPerKwh: state.avgRateCentsPerKwh,
      updated: state.updated,
      methodology: state.methodology,
      disclaimer: state.disclaimer,
      sourceName: state.sourceName,
      sourceUrl: state.sourceUrl,
      examples,
    },
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": API_CACHE_CONTROL,
      },
    }
  );
}
