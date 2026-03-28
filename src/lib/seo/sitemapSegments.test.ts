import assert from "node:assert/strict";
import test from "node:test";
import { groupSitemapEntriesBySegment } from "@/lib/seo/sitemapSegments";

test("groups city bill benchmark routes into the cities sitemap segment", () => {
  const url = "https://priceofelectricity.com/average-electricity-bill/ohio/columbus";
  const grouped = groupSitemapEntriesBySegment([{ url }]);

  assert.deepEqual(grouped.cities.map((entry) => entry.url), [url]);
  assert.deepEqual(grouped.core, []);
});
