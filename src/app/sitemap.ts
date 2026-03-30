import type { MetadataRoute } from "next";
import { readdirSync, existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { STATES } from "@/data/states";
import { UTILITIES } from "@/data/utilities";
import { GUIDES } from "@/data/guides";
import { TOPICS } from "@/data/topics";
import { SOURCES } from "@/data/sources";
import { getQuestionSlugs } from "@/lib/questions";
import { REGIONS } from "@/data/regions";
import { getSnapshotVersions } from "@/lib/snapshotLoader";
import { generateTemplatePages } from "@/lib/templateGenerator";
import { VERTICALS } from "@/content/verticals";
import { SITE_URL } from "@/lib/site";

import {
  isLongtailFamilyActive,
  getActiveUsageKwhTiers,
  getActiveIndustrySlugs,
  getActiveApplianceSlugs,
  getActiveApplianceCityPages,
  getActiveCityPages,
  getActiveCityBillPages,
} from "@/lib/longtail/rollout";
import { getActiveBillEstimatorProfilePages } from "@/lib/longtail/billEstimator";
import { HOME_SIZE_SCENARIOS } from "@/lib/longtail/usageIntelligence";
import {
  assertNoDuplicateSegmentUrls,
  SITEMAP_SEGMENT_IDS,
  groupSitemapEntriesBySegment,
  type SitemapSegmentId,
} from "@/lib/seo/sitemapSegments";

export const dynamic = "force-dynamic";

const BASE_URL = SITE_URL.replace(/\/+$/, "");
let cachedKnowledgeStateSlugs: string[] | null = null;
const STATE_SLUG_SET = new Set(Object.keys(STATES));

function parseUpdatedDate(updated: string): Date | undefined {
  const parsed = Date.parse(updated);
  if (Number.isNaN(parsed)) {
    return undefined;
  }
  return new Date(parsed);
}

function hasDeterministicStateLastModified(url: string): boolean {
  let pathname = url;
  try {
    pathname = new URL(url).pathname;
  } catch {
    // Keep raw path-like values as-is.
  }
  const segments = pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
  if (segments.length === 0) return false;
  const stateSlug = segments[0];
  if (!STATE_SLUG_SET.has(stateSlug)) return false;
  if (segments.length === 1) return true;
  if (segments.length === 2) {
    return segments[1] === "utilities" || segments[1] === "plans" || segments[1] === "plan-types" || segments[1] === "history";
  }
  if (segments.length === 3) {
    if (segments[1] === "bill") return /^\d+$/.test(segments[2]);
    if (segments[1] === "utility" || segments[1] === "city") return segments[2].length > 0;
    if (segments[0] === "electricity-cost" && STATE_SLUG_SET.has(segments[1])) {
      return segments[2].length > 0;
    }
  }
  if (segments.length === 4) {
    if (segments[0] === "cost-to-run" && STATE_SLUG_SET.has(segments[2])) {
      return segments[1].length > 0 && segments[3].length > 0;
    }
  }
  return false;
}

function stripVolatileLastModified(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  return entries.map((entry) => {
    if (!entry.lastModified || hasDeterministicStateLastModified(entry.url)) {
      return entry;
    }
    const stableEntry = { ...entry };
    delete stableEntry.lastModified;
    return stableEntry;
  });
}

function stripLegacyComparePairRedirectUrls(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const legacyComparePairPath = /^\/compare\/[a-z]+-vs-[a-z]+\/?$/;
  return entries.filter((entry) => {
    try {
      return !legacyComparePairPath.test(new URL(entry.url).pathname);
    } catch {
      return true;
    }
  });
}

function getKnowledgeStateSlugs(): string[] {
  if (cachedKnowledgeStateSlugs) {
    return cachedKnowledgeStateSlugs;
  }
  try {
    const stateDir = path.join(process.cwd(), "public", "knowledge", "state");
    if (!existsSync(stateDir)) return [];
    const files = readdirSync(stateDir);
    cachedKnowledgeStateSlugs = files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    return cachedKnowledgeStateSlugs;
  } catch {
    return [];
  }
}

function getKnowledgeRankingIds(): string[] {
  try {
    const indexPath = path.join(process.cwd(), "public", "knowledge", "rankings", "index.json");
    if (!existsSync(indexPath)) return [];
    const raw = readFileSync(indexPath, "utf8");
    const data = JSON.parse(raw) as { items?: Array<{ id?: string }> };
    const items = data?.items ?? [];
    return items.map((i) => i.id).filter((id): id is string => typeof id === "string").sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}


function getKnowledgeHistoryVersionsWithBundles(): string[] {
  try {
    const historyDir = path.join(process.cwd(), "public", "knowledge", "history");
    if (!existsSync(historyDir)) return [];
    const entries = readdirSync(historyDir);
    return entries
      .filter((e) => {
        const fullPath = path.join(historyDir, e);
        const bundlesPath = path.join(fullPath, "bundles", "index.json");
        return statSync(fullPath).isDirectory() && e.startsWith("v") && existsSync(bundlesPath);
      })
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

function getKnowledgeComparePairs(): string[] {
  try {
    const pairsPath = path.join(process.cwd(), "public", "knowledge", "compare", "pairs.json");
    if (!existsSync(pairsPath)) return [];
    const raw = readFileSync(pairsPath, "utf8");
    const data = JSON.parse(raw) as { pairs?: string[] };
    return (data?.pairs ?? []).sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

export function getSegmentedSitemapEntries() {
  const stateEntries: MetadataRoute.Sitemap = Object.keys(STATES).map((slug) => {
    const info = STATES[slug];
    return {
      url: `${BASE_URL}/${slug}`,
      lastModified: parseUpdatedDate(info.updated),
      changeFrequency: "monthly",
      priority: 0.7,
    };
  });
  const stateUtilitiesEntries: MetadataRoute.Sitemap = Object.keys(STATES).map((slug) => {
    const info = STATES[slug];
    return {
      url: `${BASE_URL}/${slug}/utilities`,
      lastModified: parseUpdatedDate(info.updated),
      changeFrequency: "monthly",
      priority: 0.6,
    };
  });
  const utilityRouteEntries: MetadataRoute.Sitemap = UTILITIES.map((utility) => {
    const stateInfo = STATES[utility.stateSlug];
    return {
      url: `${BASE_URL}/${utility.stateSlug}/utility/${utility.slug}`,
      lastModified: parseUpdatedDate(stateInfo?.updated ?? ""),
      changeFrequency: "monthly",
      priority: 0.55,
    };
  });
  const statePlansEntries: MetadataRoute.Sitemap = Object.keys(STATES).map((slug) => {
    const info = STATES[slug];
    return {
      url: `${BASE_URL}/${slug}/plans`,
      lastModified: parseUpdatedDate(info.updated),
      changeFrequency: "monthly",
      priority: 0.6,
    };
  });
  const statePlanTypesEntries: MetadataRoute.Sitemap = Object.keys(STATES).map((slug) => {
    const info = STATES[slug];
    return {
      url: `${BASE_URL}/${slug}/plan-types`,
      lastModified: parseUpdatedDate(info.updated),
      changeFrequency: "monthly",
      priority: 0.58,
    };
  });
  const stateHistoryEntries: MetadataRoute.Sitemap = Object.keys(STATES).map((slug) => {
    const info = STATES[slug];
    return {
      url: `${BASE_URL}/${slug}/history`,
      lastModified: parseUpdatedDate(info.updated),
      changeFrequency: "monthly",
      priority: 0.6,
    };
  });
  const BILL_KWH_VALUES = [500, 750, 1000, 1250, 1500, 2000];
  const billEntries: MetadataRoute.Sitemap = [];
  for (const slug of Object.keys(STATES)) {
    const info = STATES[slug];
    for (const kwh of BILL_KWH_VALUES) {
      billEntries.push({
        url: `${BASE_URL}/${slug}/bill/${kwh}`,
        lastModified: parseUpdatedDate(info.updated),
        changeFrequency: "monthly",
        priority: 0.55,
      });
    }
  }
  const regionEntries: MetadataRoute.Sitemap = REGIONS.map((region) => ({
    url: `${BASE_URL}/region/${region.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  const cityEntries: MetadataRoute.Sitemap = getActiveCityPages().map((city) => {
    const stateInfo = STATES[city.stateSlug];
    return {
      url: `${BASE_URL}/electricity-cost/${city.stateSlug}/${city.slug}`,
      lastModified: parseUpdatedDate(stateInfo?.updated ?? ""),
      changeFrequency: "monthly",
      priority: 0.6,
    };
  });
  const applianceCityPilotEntries: MetadataRoute.Sitemap = getActiveApplianceCityPages().map((page) => {
    const stateInfo = STATES[page.stateSlug];
    return {
      url: `${BASE_URL}/cost-to-run/${page.applianceSlug}/${page.stateSlug}/${page.citySlug}`,
      lastModified: parseUpdatedDate(stateInfo?.updated ?? ""),
      changeFrequency: "monthly",
      priority: 0.52,
    };
  });
  const guideEntries: MetadataRoute.Sitemap = GUIDES.map((guide) => ({
    url: `${BASE_URL}/guides/${guide.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  const questionEntries: MetadataRoute.Sitemap = getQuestionSlugs(STATES).map((slug) => ({
    url: `${BASE_URL}/questions/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  const topicEntries: MetadataRoute.Sitemap = TOPICS.map((topic) => ({
    url: `${BASE_URL}/topics/${topic.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  const sourceEntries: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/sources`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    ...SOURCES.map((source) => ({
      url: `${BASE_URL}/sources/${source.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.55,
    })),
  ];

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/compare`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/affordability`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/value-ranking`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/index`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/changelog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/licensing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/api-docs`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/status`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/newsletter`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/data-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/performance`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/site-map`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.55,
    },
    {
      url: `${BASE_URL}/data-registry`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.55,
    },
    {
      url: `${BASE_URL}/discovery-graph`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.55,
    },
    {
      url: `${BASE_URL}/entity-registry`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.55,
    },
    {
      url: `${BASE_URL}/page-index`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.55,
    },
    {
      url: `${BASE_URL}/electricity-data`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/datasets`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/datasets/electricity-prices-by-state`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.55,
    },
    {
      url: `${BASE_URL}/datasets/electricity-rankings`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.55,
    },
    {
      url: `${BASE_URL}/data`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/press`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/press/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.55,
    },
    {
      url: `${BASE_URL}/press/brand`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.55,
    },
    {
      url: `${BASE_URL}/press/press-release`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.55,
    },
    {
      url: `${BASE_URL}/index-ranking`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${BASE_URL}/research`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/research/annual-report`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/research/state-trends`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/research/price-volatility`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/methodology`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/methodology/electricity-price-index`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/methodology/value-score`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/methodology/freshness-scoring`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/methodology/electricity-rates`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/methodology/electricity-inflation`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/methodology/electricity-affordability`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/methodology/battery-recharge-cost`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/methodology/generator-vs-battery-cost`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/guides`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/topics`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/feed.xml`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/atom.xml`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    ...stateEntries,
    ...stateUtilitiesEntries,
    ...utilityRouteEntries,
    ...statePlansEntries,
    ...statePlanTypesEntries,
    ...stateHistoryEntries,
    ...billEntries,
    ...regionEntries,
    ...cityEntries,
    ...applianceCityPilotEntries,
    ...guideEntries,
    ...questionEntries,
    ...topicEntries,
    ...sourceEntries,
    {
      url: `${BASE_URL}/offers`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/disclosures`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.55,
    },
    {
      url: `${BASE_URL}/electricity-cost`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    ...getKnowledgeStateSlugs().map((slug) => ({
      url: `${BASE_URL}/electricity-cost/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: `${BASE_URL}/average-electricity-bill`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    ...getKnowledgeStateSlugs().map((slug) => ({
      url: `${BASE_URL}/average-electricity-bill/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...getActiveCityBillPages().map((entry) => ({
      url: `${BASE_URL}/average-electricity-bill/${entry.stateSlug}/${entry.citySlug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.56,
    })),
    {
      url: `${BASE_URL}/electricity-bill-estimator`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.62,
    },
    ...getKnowledgeStateSlugs().map((slug) => ({
      url: `${BASE_URL}/electricity-bill-estimator/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.58,
    })),
    ...getActiveBillEstimatorProfilePages().map((entry) => ({
      url: `${BASE_URL}/electricity-bill-estimator/${entry.slug}/${entry.profile}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.54,
    })),
    {
      url: `${BASE_URL}/moving-to-electricity-cost`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    ...getKnowledgeStateSlugs().map((slug) => ({
      url: `${BASE_URL}/moving-to-electricity-cost/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: `${BASE_URL}/electricity-cost-calculator`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    ...getKnowledgeStateSlugs().map((slug) => ({
      url: `${BASE_URL}/electricity-cost-calculator/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: `${BASE_URL}/electricity-usage`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.62,
    },
    ...getKnowledgeStateSlugs().map((slug) => ({
      url: `${BASE_URL}/electricity-usage/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.56,
    })),
    ...HOME_SIZE_SCENARIOS.map((scenario) => ({
      url: `${BASE_URL}/electricity-usage/home-size/${scenario.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.52,
    })),
    ...getActiveApplianceSlugs().map((appliance) => ({
      url: `${BASE_URL}/electricity-usage/appliances/${appliance}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.52,
    })),
    ...getActiveApplianceSlugs().flatMap((appliance) =>
      getKnowledgeStateSlugs().map((slug) => ({
        url: `${BASE_URL}/electricity-cost-calculator/${slug}/${appliance}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.55,
      })),
    ),
    {
      url: `${BASE_URL}/electricity-hubs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/electricity-hubs/states`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.72,
    },
    ...getKnowledgeStateSlugs().map((slug) => ({
      url: `${BASE_URL}/electricity-hubs/states/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.55,
    })),
    {
      url: `${BASE_URL}/electricity-hubs/scenarios`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.68,
    },
    ...(isLongtailFamilyActive("usage-cost")
      ? [
          {
            url: `${BASE_URL}/electricity-hubs/usage`,
            lastModified: new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.68,
          },
          ...getActiveUsageKwhTiers().map((kwh) => ({
            url: `${BASE_URL}/electricity-hubs/usage/${kwh}`,
            lastModified: new Date(),
            changeFrequency: "monthly" as const,
            priority: 0.55,
          })),
        ]
      : []),
    {
      url: `${BASE_URL}/electricity-hubs/comparisons`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.68,
    },
    {
      url: `${BASE_URL}/energy-comparison`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.78,
    },
    {
      url: `${BASE_URL}/energy-comparison/states`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/energy-comparison/usage`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.68,
    },
    {
      url: `${BASE_URL}/energy-comparison/appliances`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.68,
    },
    ...(isLongtailFamilyActive("industry-cost")
      ? [
          {
            url: `${BASE_URL}/electricity-hubs/industry`,
            lastModified: new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.6,
          },
          ...getActiveIndustrySlugs().map((industry) => ({
            url: `${BASE_URL}/electricity-hubs/industry/${industry}`,
            lastModified: new Date(),
            changeFrequency: "monthly" as const,
            priority: 0.55,
          })),
        ]
      : []),
    ...(isLongtailFamilyActive("state-price-per-kwh")
      ? getKnowledgeStateSlugs().map((slug) => ({
          url: `${BASE_URL}/electricity-price-per-kwh/${slug}`,
          lastModified: new Date(),
          changeFrequency: "monthly" as const,
          priority: 0.6,
        }))
      : []),
    ...(isLongtailFamilyActive("state-price-trend")
      ? getKnowledgeStateSlugs().map((slug) => ({
          url: `${BASE_URL}/electricity-price-trend/${slug}`,
          lastModified: new Date(),
          changeFrequency: "monthly" as const,
          priority: 0.6,
        }))
      : []),
    ...(isLongtailFamilyActive("usage-cost")
      ? getActiveUsageKwhTiers().flatMap((kwh) =>
          getKnowledgeStateSlugs().map((slug) => ({
            url: `${BASE_URL}/electricity-usage-cost/${kwh}/${slug}`,
            lastModified: new Date(),
            changeFrequency: "monthly" as const,
            priority: 0.55,
          })),
        )
      : []),
    ...getActiveApplianceSlugs().flatMap((appliance) =>
      getKnowledgeStateSlugs().map((slug) => ({
        url: `${BASE_URL}/cost-to-run/${appliance}/${slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.55,
      })),
    ),
    ...(isLongtailFamilyActive("industry-cost")
      ? getActiveIndustrySlugs().flatMap((industry) =>
          getKnowledgeStateSlugs().map((slug) => ({
            url: `${BASE_URL}/industry-electricity-cost/${industry}/${slug}`,
            lastModified: new Date(),
            changeFrequency: "monthly" as const,
            priority: 0.55,
          })),
        )
      : []),
    {
      url: `${BASE_URL}/battery-recharge-cost`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    ...getKnowledgeStateSlugs().map((slug) => ({
      url: `${BASE_URL}/battery-recharge-cost/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: `${BASE_URL}/generator-vs-battery-cost`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    ...getKnowledgeStateSlugs().map((slug) => ({
      url: `${BASE_URL}/generator-vs-battery-cost/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: `${BASE_URL}/electricity-price-history`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    ...getKnowledgeStateSlugs().map((slug) => ({
      url: `${BASE_URL}/electricity-price-history/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: `${BASE_URL}/business-electricity-cost-decisions`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/business-electricity-cost-decisions/choosing-a-state-for-electricity-costs`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/business-electricity-cost-decisions/electricity-costs-for-small-businesses`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/business-electricity-options`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    ...getKnowledgeStateSlugs().map((slug) => ({
      url: `${BASE_URL}/business-electricity-options/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: `${BASE_URL}/data-center-electricity-cost`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    ...getKnowledgeStateSlugs().map((slug) => ({
      url: `${BASE_URL}/data-center-electricity-cost/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: `${BASE_URL}/solar-vs-grid-electricity-cost`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    ...getKnowledgeStateSlugs().map((slug) => ({
      url: `${BASE_URL}/solar-vs-grid-electricity-cost/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: `${BASE_URL}/solar-savings`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    ...getKnowledgeStateSlugs().map((slug) => ({
      url: `${BASE_URL}/solar-savings/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: `${BASE_URL}/battery-backup-electricity-cost`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    ...getKnowledgeStateSlugs().map((slug) => ({
      url: `${BASE_URL}/battery-backup-electricity-cost/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: `${BASE_URL}/why-electricity-prices-rise`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/why-electricity-is-expensive`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    ...getKnowledgeStateSlugs().map((slug) => ({
      url: `${BASE_URL}/why-electricity-is-expensive/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: `${BASE_URL}/why-electricity-is-cheap`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    ...getKnowledgeStateSlugs().map((slug) => ({
      url: `${BASE_URL}/why-electricity-is-cheap/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: `${BASE_URL}/electricity-price-volatility`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    ...getKnowledgeStateSlugs().map((slug) => ({
      url: `${BASE_URL}/electricity-price-volatility/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: `${BASE_URL}/ai-energy-demand`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/ai-energy-demand/data-centers-electricity`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/ai-energy-demand/ai-power-consumption`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/ai-energy-demand/electricity-prices-and-ai`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/ai-energy-demand/grid-strain-and-electricity-costs`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/grid-capacity-and-electricity-demand`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/grid-capacity-and-electricity-demand/power-demand-growth`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/grid-capacity-and-electricity-demand/grid-capacity-constraints`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/power-generation-mix`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/power-generation-mix/fuel-costs-and-electricity-prices`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/power-generation-mix/generation-mix-and-price-volatility`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/electricity-markets`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/electricity-markets/iso-rto-markets`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/electricity-markets/regulated-electricity-markets`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/regional-electricity-markets`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/regional-electricity-markets/why-electricity-prices-differ-by-region`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/regional-electricity-markets/regional-grid-structure`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/electricity-shopping`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/shop-electricity`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    ...getKnowledgeStateSlugs().map((slug) => ({
      url: `${BASE_URL}/shop-electricity/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: `${BASE_URL}/electricity-shopping/by-state`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/electricity-shopping/how-electricity-shopping-works`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/compare-electricity-plans`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/compare-electricity-plans/by-state`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/compare-electricity-plans/how-to-compare-electricity-plans`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/electricity-providers`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    ...getKnowledgeStateSlugs().map((slug) => ({
      url: `${BASE_URL}/electricity-providers/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: `${BASE_URL}/electricity-generation-cost-drivers`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/electricity-generation-cost-drivers/fuel-prices-and-generation-costs`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/electricity-generation-cost-drivers/infrastructure-and-electricity-costs`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/electricity-insights`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/electricity-trends`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/electricity-topics`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/electricity-inflation`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/electricity-affordability`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    ...getKnowledgeStateSlugs().map((slug) => ({
      url: `${BASE_URL}/electricity-inflation/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...getKnowledgeStateSlugs().map((slug) => ({
      url: `${BASE_URL}/electricity-affordability/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: `${BASE_URL}/electricity-cost-of-living`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    ...getKnowledgeStateSlugs().map((slug) => ({
      url: `${BASE_URL}/electricity-cost-of-living/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: `${BASE_URL}/electricity-cost-comparison`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    ...getKnowledgeComparePairs().map((pair) => ({
      url: `${BASE_URL}/electricity-cost-comparison/${pair}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: `${BASE_URL}/knowledge`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.55,
    },
    {
      url: `${BASE_URL}/knowledge/pages`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.55,
    },
    {
      url: `${BASE_URL}/knowledge/docs`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.55,
    },
    {
      url: `${BASE_URL}/knowledge/national`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...(getKnowledgeStateSlugs().length > 0 ? getKnowledgeStateSlugs() : Object.keys(STATES)).map((slug) => ({
      url: `${BASE_URL}/knowledge/state/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.55,
    })),
    ...getKnowledgeRankingIds().map((id) => ({
      url: `${BASE_URL}/knowledge/rankings/${id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.55,
    })),
    {
      url: `${BASE_URL}/knowledge/compare`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.55,
    },
    ...getKnowledgeComparePairs().map((pair) => ({
      url: `${BASE_URL}/knowledge/compare/${pair}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.55,
    })),
    {
      url: `${BASE_URL}/knowledge/rankings`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.55,
    },
    {
      url: `${BASE_URL}/knowledge/compare/states.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/rankings/index.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/related/index.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/search-index.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/index.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/national.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/contract.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/labels/en.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/glossary/fields.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/docs/index.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/ingest/starter-pack.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/public-endpoints.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/offers/index.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/policy/disclaimers.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/policy/offers-config.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/policy/deprecations.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/integrity/manifest.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/capabilities.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/release.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/fingerprint.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/changelog.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/provenance.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/schema-map.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/entity-index.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/bundles/index.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/build-profile.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/leaderboards/states.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/bundles/core.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/bundles/states-all.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/bundles/methodologies.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/bundles/rankings.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/history/bundles/index.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    ...getKnowledgeHistoryVersionsWithBundles().map((version) => ({
      url: `${BASE_URL}/knowledge/history/${version}/bundles/index.json`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.5,
    })),
    {
      url: `${BASE_URL}/knowledge/methodology/index.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/knowledge/regression.json`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    ...Object.keys(STATES).map((slug) => ({
      url: `${BASE_URL}/offers/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.55,
    })),
    {
      url: `${BASE_URL}/data-history`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/data-history/compare`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.55,
    },
    ...getSnapshotVersions().map((version) => ({
      url: `${BASE_URL}/data-history/${version}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.55,
    })),
    ...generateTemplatePages().map((gp) => ({
      url: `${BASE_URL}/generated/${gp.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.55,
    })),
    ...VERTICALS.map((v) => ({
      url: `${BASE_URL}/v/${v.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
    ...VERTICALS.flatMap((v) =>
      v.pillarPages.map((p) => ({
        url: `${BASE_URL}/v/${v.slug}/${p.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }))
    ),
    {
      url: `${BASE_URL}/national`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${BASE_URL}/national/rankings`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/national/trends`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/national/affordability`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/national/extremes`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/regulatory`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/regulatory/queue`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/alerts`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/alerts/regulatory`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/alerts/ai-energy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...Object.keys(STATES).map((slug) => ({
      url: `${BASE_URL}/alerts/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.55,
    })),
    ...Object.keys(STATES).map((slug) => ({
      url: `${BASE_URL}/regulatory/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.55,
    })),
    ...Object.keys(STATES).map((slug) => ({
      url: `${BASE_URL}/regulatory/${slug}/rate-cases`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...Object.keys(STATES).map((slug) => ({
      url: `${BASE_URL}/regulatory/${slug}/timeline`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    {
      url: `${BASE_URL}/drivers`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    ...Object.keys(STATES).map((slug) => ({
      url: `${BASE_URL}/drivers/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.55,
    })),
    {
      url: `${BASE_URL}/v/ai-energy/watchlist`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/v/ai-energy/glossary`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/v/ai-energy/monitoring`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/citations`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/press-kit`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/attribution`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
  ];
  // Keep lastModified only when backed by stable source dates.
  const stableEntries = stripLegacyComparePairRedirectUrls(stripVolatileLastModified(entries));
  const grouped = groupSitemapEntriesBySegment(stableEntries);
  assertNoDuplicateSegmentUrls(grouped);
  return grouped;
}

export function generateSitemaps(): Array<{ id: SitemapSegmentId }> {
  return SITEMAP_SEGMENT_IDS.map((id) => ({ id }));
}

export default async function sitemap(props: {
  id: Promise<SitemapSegmentId>;
}): Promise<MetadataRoute.Sitemap> {
  const id = await props.id;
  const grouped = getSegmentedSitemapEntries();
  return grouped[id] ?? grouped.core;
}
