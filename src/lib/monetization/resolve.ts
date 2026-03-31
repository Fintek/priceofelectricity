import {
  DEREGULATED_STATE_SLUGS,
  MONETIZATION_PARTNERS,
  MONETIZATION_PLACEMENTS,
  type MonetizationBlockKind,
  type MonetizationContext,
  type MonetizationPartner,
} from "@/lib/monetization/config";

type ActionLink = {
  href: string;
  label: string;
  external?: boolean;
};

export type ResolvedPartnerLink = {
  id: string;
  name: string;
  headline: string;
  description: string;
  href: string;
  ctaLabel: string;
  badges: string[];
  disclosureLabel: "affiliate" | "sponsored" | "lead";
};

export type ResolvedMonetizationBlock =
  | {
      kind: "provider-offers";
      title: string;
      intro: string;
      partners: ResolvedPartnerLink[];
    }
  | {
      kind: "plan-comparison";
      title: string;
      description: string;
      primary: ActionLink;
      secondary?: ActionLink;
    }
  | {
      kind: "cta";
      title: string;
      description: string;
      primary: ActionLink;
      secondary?: ActionLink;
    }
  | {
      kind: "lead-capture";
      title: string;
      description: string;
      primary: ActionLink;
      secondary?: ActionLink;
    }
  | {
      kind: "affiliate-links";
      title: string;
      intro: string;
      partners: ResolvedPartnerLink[];
    };

function partnerSupportsContext(partner: MonetizationPartner, context: MonetizationContext): boolean {
  if (!partner.enabled) return false;
  if (!partner.displayRules.pageTypes.includes(context.pageType)) return false;

  if (partner.supportedStates !== "all") {
    if (!context.state) return false;
    if (!partner.supportedStates.includes(context.state)) return false;
  }

  if (partner.displayRules.industries && partner.displayRules.industries.length > 0) {
    if (!context.industry || !partner.displayRules.industries.includes(context.industry)) return false;
  }

  if (partner.displayRules.minUsageKwh != null) {
    if (context.usageKwh == null || context.usageKwh < partner.displayRules.minUsageKwh) return false;
  }

  if (partner.displayRules.maxUsageKwh != null) {
    if (context.usageKwh == null || context.usageKwh > partner.displayRules.maxUsageKwh) return false;
  }

  return true;
}

function resolvePartnerHref(partner: MonetizationPartner, state?: string): string {
  if (state && partner.landingUrls.byState?.[state]) {
    return partner.landingUrls.byState[state] as string;
  }
  return partner.landingUrls.default;
}

function toResolvedPartnerLink(
  partner: MonetizationPartner,
  context: MonetizationContext,
): ResolvedPartnerLink {
  return {
    id: partner.id,
    name: partner.name,
    headline: partner.headline,
    description: partner.description,
    href: resolvePartnerHref(partner, context.state),
    ctaLabel: partner.ctaLabel,
    badges: partner.badges ?? [],
    disclosureLabel: partner.disclosureLabel ?? "affiliate",
  };
}

function getEligiblePartners(context: MonetizationContext): ResolvedPartnerLink[] {
  return MONETIZATION_PARTNERS
    .filter((partner) => partnerSupportsContext(partner, context))
    .map((partner) => toResolvedPartnerLink(partner, context));
}

function getStateDisplayName(context: MonetizationContext): string {
  return context.stateName ?? "your state";
}

function buildPlanComparisonBlock(context: MonetizationContext): ResolvedMonetizationBlock | null {
  const stateName = getStateDisplayName(context);
  const state = context.state;
  const isStateSpecific = Boolean(state);
  const supportsRetailPlanChoice = state ? DEREGULATED_STATE_SLUGS.has(state) : false;

  if (context.pageType === "longtail-industry" || context.pageType === "hub-industry-detail") {
    return null;
  }

  return {
    kind: "plan-comparison",
    title: isStateSpecific
      ? `Compare electricity options in ${stateName}`
      : "Compare electricity options by state",
    description: supportsRetailPlanChoice
      ? `Compare retail electricity plans and provider options available in ${stateName}.`
      : isStateSpecific
        ? `Explore savings options, plan types, and provider offers for ${stateName}.`
        : "Explore plans, providers, and savings opportunities by state.",
    primary: {
      href: supportsRetailPlanChoice && state ? `/${state}/plans` : state ? `/offers/${state}` : "/compare-electricity-plans/by-state",
      label: supportsRetailPlanChoice && state ? `View plans in ${stateName}` : state ? `View offers in ${stateName}` : "Compare plans by state",
    },
    secondary: {
      href: state ? `/electricity-cost-calculator/${state}` : "/offers",
      label: state ? `${stateName} calculator` : "Browse offers",
    },
  };
}

function buildCallToActionBlock(context: MonetizationContext): ResolvedMonetizationBlock | null {
  const stateName = getStateDisplayName(context);

  if (context.pageType === "longtail-industry" || context.pageType === "hub-industry-detail" || context.pageType === "hub-industry-index") {
    return {
      kind: "cta",
      title: "Need commercial electricity support?",
      description:
        "Get help with larger commercial or infrastructure energy needs.",
      primary: {
        href: "/contact",
        label: "Contact us",
      },
      secondary: {
        href: "/offers",
        label: "Browse current offers",
      },
    };
  }

  return {
    kind: "cta",
    title: context.state ? `Ways to save in ${stateName}` : "Ways to lower your bill",
    description: context.state
      ? `Explore offers, plan options, and bill-reduction tools for ${stateName}.`
      : "Explore plan comparisons, offers, and savings tools.",
    primary: {
      href: context.state ? `/offers/${context.state}` : "/offers",
      label: context.state ? `Browse ${stateName} offers` : "Browse offers",
    },
    secondary: {
      href: context.state ? `/${context.state}/plans` : "/compare-electricity-plans/by-state",
      label: context.state ? `Plans in ${stateName}` : "Compare plans by state",
    },
  };
}

function buildLeadCaptureBlock(context: MonetizationContext): ResolvedMonetizationBlock | null {
  const stateName = getStateDisplayName(context);
  const usageLabel = context.usageKwh != null ? `${context.usageKwh.toLocaleString()} kWh` : "electricity costs";

  return {
    kind: "lead-capture",
    title: context.state ? `Track ${stateName} electricity changes` : "Stay updated on electricity costs",
    description: context.state
      ? `Get notified about ${usageLabel} rate changes and savings opportunities in ${stateName}.`
      : "Get notified about electricity cost changes and new savings opportunities.",
    primary: {
      href: "/newsletter",
      label: "Join the newsletter",
    },
    secondary: {
      href: context.state ? `/alerts/${context.state}` : "/alerts",
      label: context.state ? `${stateName} alerts` : "Browse alerts",
    },
  };
}

function buildPartnerBlock(
  context: MonetizationContext,
  kind: Extract<MonetizationBlockKind, "provider-offers" | "affiliate-links">,
): ResolvedMonetizationBlock | null {
  const allPartners = getEligiblePartners(context);
  const filtered =
    kind === "provider-offers"
      ? allPartners.filter((partner) => partner.disclosureLabel !== "affiliate" || context.pageType === "longtail-usage" || context.pageType === "calculator-state")
      : allPartners.filter((partner) => partner.disclosureLabel === "affiliate");

  if (filtered.length === 0) return null;

  if (kind === "provider-offers") {
    return {
      kind,
      title: context.state ? `Partner offers for ${getStateDisplayName(context)}` : "Featured partner offers",
      intro: "These partner offers may help you compare plans or find savings opportunities.",
      partners: filtered.slice(0, 3),
    };
  }

  return {
    kind,
    title: "Related offers",
    intro: "Referral links related to savings and energy options for your area.",
    partners: filtered.slice(0, 4),
  };
}

export function resolveMonetizationBlocks(context: MonetizationContext): ResolvedMonetizationBlock[] {
  const placement = MONETIZATION_PLACEMENTS[context.pageType];
  if (!placement) return [];

  const blocks: ResolvedMonetizationBlock[] = [];

  for (const kind of placement.blockKinds) {
    let block: ResolvedMonetizationBlock | null = null;

    if (kind === "plan-comparison") {
      block = buildPlanComparisonBlock(context);
    } else if (kind === "cta") {
      block = buildCallToActionBlock(context);
    } else if (kind === "lead-capture") {
      block = buildLeadCaptureBlock(context);
    } else if (kind === "provider-offers" || kind === "affiliate-links") {
      block = buildPartnerBlock(context, kind);
    }

    if (block) {
      blocks.push(block);
    }

    if (blocks.length >= placement.maxBlocks) {
      break;
    }
  }

  return blocks;
}
