import { SITE_URL } from "@/lib/site";

function ensureAbsoluteUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const base = SITE_URL.replace(/\/+$/, "");
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

export type WebPageJsonLdParams = {
  title: string;
  description: string;
  url: string;
  dateModified?: string;
  isPartOf?: string;
  about?: string[];
};

/**
 * Build schema.org WebPage JSON-LD object.
 * Returns plain object for JSON.stringify.
 */
export function buildWebPageJsonLd(params: WebPageJsonLdParams): Record<string, unknown> {
  const url = ensureAbsoluteUrl(params.url);
  const obj: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: params.title,
    description: params.description,
    url,
  };
  if (params.dateModified) {
    obj.dateModified = params.dateModified;
  }
  if (params.isPartOf) {
    obj.isPartOf = {
      "@type": "WebSite",
      url: ensureAbsoluteUrl(params.isPartOf),
    };
  }
  if (params.about && params.about.length > 0) {
    obj.about = params.about.map((a) => ({
      "@type": "Thing",
      name: a,
    }));
  }
  return obj;
}

export type DatasetJsonLdParams = {
  name: string;
  description: string;
  url: string;
  dateModified?: string;
  license?: string;
  publisher?: string | { name: string; url?: string };
  sameAs?: string[];
  distribution?: Array<{ contentUrl: string; encodingFormat?: string }>;
};

/**
 * Build schema.org Dataset JSON-LD object.
 * Returns plain object for JSON.stringify.
 */
export function buildDatasetJsonLd(params: DatasetJsonLdParams): Record<string, unknown> {
  const url = ensureAbsoluteUrl(params.url);
  const obj: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: params.name,
    description: params.description,
    url,
  };
  if (params.dateModified) {
    obj.dateModified = params.dateModified;
  }
  if (params.license) {
    obj.license = params.license;
  }
  if (params.publisher) {
    obj.publisher =
      typeof params.publisher === "string"
        ? { "@type": "Organization", name: params.publisher }
        : { "@type": "Organization", ...params.publisher };
  }
  if (params.sameAs && params.sameAs.length > 0) {
    obj.sameAs = params.sameAs.map((u) => ensureAbsoluteUrl(u));
  }
  if (params.distribution && params.distribution.length > 0) {
    obj.distribution = params.distribution.map((d) => ({
      "@type": "DataDownload",
      contentUrl: ensureAbsoluteUrl(d.contentUrl),
      ...(d.encodingFormat && { encodingFormat: d.encodingFormat }),
    }));
  }
  return obj;
}

export type BreadcrumbItem = {
  name: string;
  url: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type ItemListEntry = {
  name: string;
  url: string;
  description?: string;
};

export type CommercialPathwayItemEntry = {
  name: string;
  url: string;
  pathwayType?: "provider-marketplace" | "state-cluster" | "comparison-cluster" | "estimator-cluster" | "offers";
};

/**
 * Build schema.org BreadcrumbList JSON-LD object.
 */
export function buildBreadcrumbListJsonLd(items: BreadcrumbItem[]): Record<string, unknown> {
  const base = SITE_URL.replace(/\/+$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${base}${item.url.startsWith("/") ? "" : "/"}${item.url}`,
    })),
  };
}

/**
 * Build schema.org FAQPage JSON-LD object.
 */
export function buildFaqPageJsonLd(items: FaqItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/**
 * Build schema.org ItemList JSON-LD object.
 */
export function buildItemListJsonLd(name: string, items: ItemListEntry[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: ensureAbsoluteUrl(item.url),
      name: item.name,
      ...(item.description ? { description: item.description } : {}),
    })),
  };
}

/**
 * Build ItemList JSON-LD for informational commercial discovery pathways.
 */
export function buildCommercialPathwayItemListJsonLd(
  name: string,
  items: CommercialPathwayItemEntry[],
): Record<string, unknown> {
  const typedItems: ItemListEntry[] = items.map((item) => ({
    name: item.name,
    url: item.url,
    description: item.pathwayType
      ? `Informational ${item.pathwayType.replace(/-/g, " ")} pathway`
      : "Informational commercial discovery pathway",
  }));
  return buildItemListJsonLd(name, typedItems);
}
