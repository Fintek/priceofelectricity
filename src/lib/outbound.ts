export type OutboundLink = {
  id: string;
  label: string;
  href: string;
  rel?: string;
  target?: string;
};

export const OUTBOUND_UTM_SOURCE = "priceofelectricity.com";
export const OUTBOUND_UTM_MEDIUM = "referral";

function appendParamsToSearchParams(
  searchParams: URLSearchParams,
  params: Record<string, string>,
) {
  for (const [key, value] of Object.entries(params)) {
    if (!value) {
      continue;
    }
    searchParams.set(key, value);
  }
}

export function buildOutboundHref(href: string, params: Record<string, string>): string {
  try {
    const url = new URL(href);
    appendParamsToSearchParams(url.searchParams, params);
    return url.toString();
  } catch {
    const [beforeHash, hashFragment = ""] = href.split("#");
    const [pathname, queryString = ""] = beforeHash.split("?");
    const searchParams = new URLSearchParams(queryString);
    appendParamsToSearchParams(searchParams, params);
    const nextQueryString = searchParams.toString();
    const hashSuffix = hashFragment ? `#${hashFragment}` : "";
    const querySuffix = nextQueryString ? `?${nextQueryString}` : "";
    return `${pathname}${querySuffix}${hashSuffix}`;
  }
}

type PartnerLinkOptions = {
  campaign: string;
  stateSlug?: string;
  term?: string;
  content?: string;
  extraParams?: Record<string, string>;
};

export function createPartnerLink(
  link: OutboundLink,
  options: PartnerLinkOptions,
): OutboundLink {
  const params: Record<string, string> = {
    utm_source: OUTBOUND_UTM_SOURCE,
    utm_medium: OUTBOUND_UTM_MEDIUM,
    utm_campaign: options.campaign,
    ...(options.stateSlug ? { utm_term: options.stateSlug } : {}),
    ...(options.term ? { utm_term: options.term } : {}),
    ...(options.content ? { utm_content: options.content } : {}),
    ...(options.extraParams ?? {}),
  };

  return {
    ...link,
    href: buildOutboundHref(link.href, params),
    target: link.target ?? "_blank",
    rel: link.rel ?? "noopener noreferrer",
  };
}
