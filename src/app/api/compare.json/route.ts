import { STATE_LIST } from "@/data/states";

const API_CACHE_CONTROL =
  "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800";

export const dynamic = "force-static";
export const revalidate = 86400;

type SortMode = "high" | "low" | "alpha";

function parseSortMode(input: string | null): SortMode {
  if (input === "low" || input === "alpha") {
    return input;
  }
  return "high";
}

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sortMode = parseSortMode(searchParams.get("sort"));

  const sorted = [...STATE_LIST].sort((a, b) => {
    if (sortMode === "alpha") {
      return a.name.localeCompare(b.name);
    }
    if (sortMode === "low") {
      return a.avgRateCentsPerKwh - b.avgRateCentsPerKwh;
    }
    return b.avgRateCentsPerKwh - a.avgRateCentsPerKwh;
  });

  const payload = sorted.map((state) => ({
    slug: state.slug,
    name: state.name,
    avgRateCentsPerKwh: state.avgRateCentsPerKwh,
    exampleBill1000: Number(((state.avgRateCentsPerKwh * 1000) / 100).toFixed(2)),
  }));

  return Response.json(payload, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": API_CACHE_CONTROL,
    },
  });
}
