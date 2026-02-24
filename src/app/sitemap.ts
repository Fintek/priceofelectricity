import type { MetadataRoute } from "next";
import { STATES } from "@/data/states";
import { CITIES } from "@/data/cities";
import { UTILITIES } from "@/data/utilities";
import { GUIDES } from "@/data/guides";
import { TOPICS } from "@/data/topics";
import { SOURCES } from "@/data/sources";
import { getQuestionSlugs } from "@/lib/questions";
import { REGIONS } from "@/data/regions";
import { getSnapshotVersions } from "@/lib/snapshotLoader";
import { generateTemplatePages } from "@/lib/templateGenerator";
import { VERTICALS } from "@/content/verticals";

const BASE_URL = "https://priceofelectricity.com";

function parseUpdatedDate(updated: string): Date {
  const parsed = Date.parse(updated);
  if (Number.isNaN(parsed)) {
    return new Date();
  }
  return new Date(parsed);
}

function getComparisonPairs() {
  const entries = Object.entries(STATES);
  const topHigh = [...entries]
    .sort((a, b) => b[1].avgRateCentsPerKwh - a[1].avgRateCentsPerKwh)
    .slice(0, 10)
    .map(([slug]) => slug);
  const topLow = [...entries]
    .sort((a, b) => a[1].avgRateCentsPerKwh - b[1].avgRateCentsPerKwh)
    .slice(0, 10)
    .map(([slug]) => slug);

  const pairSet = new Set<string>();
  for (const highSlug of topHigh) {
    for (const lowSlug of topLow) {
      if (highSlug === lowSlug) {
        continue;
      }
      const [a, b] = [highSlug, lowSlug].sort((x, y) => x.localeCompare(y));
      pairSet.add(`${a}-vs-${b}`);
    }
  }

  return [...pairSet].sort((a, b) => a.localeCompare(b));
}

export default function sitemap(): MetadataRoute.Sitemap {
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
      lastModified: stateInfo ? parseUpdatedDate(stateInfo.updated) : new Date(),
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
  const cityEntries: MetadataRoute.Sitemap = CITIES.map((city) => {
    const stateInfo = STATES[city.stateSlug];
    return {
      url: `${BASE_URL}/${city.stateSlug}/city/${city.slug}`,
      lastModified: stateInfo ? parseUpdatedDate(stateInfo.updated) : new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    };
  });
  const comparisonEntries: MetadataRoute.Sitemap = getComparisonPairs().map((pair) => ({
    url: `${BASE_URL}/compare/${pair}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));
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

  return [
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
      url: `${BASE_URL}/calculator`,
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
      url: `${BASE_URL}/datasets`,
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
    ...comparisonEntries,
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
      url: `${BASE_URL}/knowledge`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.55,
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
}
