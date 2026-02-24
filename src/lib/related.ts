import { STATES } from "@/data/states";
import { GUIDES } from "@/data/guides";
import { getRegionByStateSlug } from "@/data/regions";
import { getQuestionSlugs, parseQuestionSlug } from "@/lib/questions";

// ── New deterministic Related Content Graph types ────────────

export type RelatedLinkType =
  | "state"
  | "tool"
  | "research"
  | "ranking"
  | "regulatory"
  | "drivers"
  | "offers"
  | "vertical"
  | "guide"
  | "question"
  | "data";

export type RelatedLink = { title: string; href: string; type: RelatedLinkType | string };

export type RelatedContext =
  | { kind: "state"; state: string; from?: "regulatory" | "drivers" | "offers" }
  | { kind: "guide"; slug: string; state?: string }
  | { kind: "question"; slug: string; state?: string }
  | { kind: "tool"; tool: string }
  | { kind: "hub"; hub: "national" | "research" | "regulatory" | "drivers" | "offers" | "alerts" | "ai-energy" };

// ── Deterministic related engine ─────────────────────────────

function dedupe(links: RelatedLink[], excludeHref?: string): RelatedLink[] {
  const seen = new Set<string>();
  const out: RelatedLink[] = [];
  for (const link of links) {
    if (excludeHref && link.href === excludeHref) continue;
    if (seen.has(link.href)) continue;
    seen.add(link.href);
    out.push(link);
  }
  return out;
}

function forState(state: string): RelatedLink[] {
  const s = STATES[state];
  if (!s) return [];
  const links: RelatedLink[] = [
    { title: `Offers in ${s.name}`, href: `/offers/${state}`, type: "offers" },
    { title: `Plans in ${s.name}`, href: `/${state}/plans`, type: "tool" },
    { title: `Price drivers for ${s.name}`, href: `/drivers/${state}`, type: "drivers" },
    { title: `${s.name} regulatory overview`, href: `/regulatory/${state}`, type: "regulatory" },
    { title: `Alerts for ${s.name}`, href: `/alerts/${state}`, type: "offers" },
    { title: "National rankings", href: "/national/rankings", type: "ranking" },
    { title: "Methodology", href: "/methodology", type: "research" },
    { title: "Data downloads", href: "/datasets", type: "data" },
    { title: "AI & Energy overview", href: "/v/ai-energy/overview", type: "vertical" },
  ];
  return dedupe(links, `/${state}`);
}

function forRegulatoryState(state: string): RelatedLink[] {
  const s = STATES[state];
  if (!s) return [];
  const links: RelatedLink[] = [
    { title: `${s.name} electricity rates`, href: `/${state}`, type: "state" },
    { title: `Price drivers for ${s.name}`, href: `/drivers/${state}`, type: "drivers" },
    { title: `Alerts for ${s.name}`, href: `/alerts/${state}`, type: "offers" },
    { title: `Offers in ${s.name}`, href: `/offers/${state}`, type: "offers" },
    { title: `Rate cases in ${s.name}`, href: `/regulatory/${state}/rate-cases`, type: "regulatory" },
    { title: `Regulatory timeline for ${s.name}`, href: `/regulatory/${state}/timeline`, type: "regulatory" },
    { title: "Methodology", href: "/methodology", type: "research" },
    { title: "National rankings", href: "/national/rankings", type: "ranking" },
  ];
  return dedupe(links, `/regulatory/${state}`);
}

function forDriversState(state: string): RelatedLink[] {
  const s = STATES[state];
  if (!s) return [];
  const links: RelatedLink[] = [
    { title: `${s.name} electricity rates`, href: `/${state}`, type: "state" },
    { title: `${s.name} regulatory overview`, href: `/regulatory/${state}`, type: "regulatory" },
    { title: `Offers in ${s.name}`, href: `/offers/${state}`, type: "offers" },
    { title: `Alerts for ${s.name}`, href: `/alerts/${state}`, type: "offers" },
    { title: "All price drivers", href: "/drivers", type: "drivers" },
    { title: "National rankings", href: "/national/rankings", type: "ranking" },
    { title: "Methodology", href: "/methodology", type: "research" },
    { title: "Data downloads", href: "/datasets", type: "data" },
  ];
  return dedupe(links, `/drivers/${state}`);
}

function forOffersState(state: string): RelatedLink[] {
  const s = STATES[state];
  if (!s) return [];
  const links: RelatedLink[] = [
    { title: `${s.name} electricity rates`, href: `/${state}`, type: "state" },
    { title: `Plans in ${s.name}`, href: `/${state}/plans`, type: "tool" },
    { title: `Price drivers for ${s.name}`, href: `/drivers/${state}`, type: "drivers" },
    { title: `${s.name} regulatory overview`, href: `/regulatory/${state}`, type: "regulatory" },
    { title: `Alerts for ${s.name}`, href: `/alerts/${state}`, type: "offers" },
    { title: "Compare all states", href: "/compare", type: "tool" },
    { title: "Methodology", href: "/methodology", type: "research" },
    { title: "Disclosures", href: "/disclosures", type: "research" },
  ];
  return dedupe(links, `/offers/${state}`);
}

function forHubNational(): RelatedLink[] {
  return dedupe([
    { title: "National price rankings", href: "/national/rankings", type: "ranking" },
    { title: "Affordability distribution", href: "/national/affordability", type: "ranking" },
    { title: "Price extremes", href: "/national/extremes", type: "ranking" },
    { title: "Value Score™ ranking", href: "/value-ranking", type: "ranking" },
    { title: "Price Index™ ranking", href: "/index-ranking", type: "ranking" },
    { title: "Methodology", href: "/methodology", type: "research" },
    { title: "Data downloads", href: "/datasets", type: "data" },
    { title: "Research & insights", href: "/research", type: "research" },
  ], "/national");
}

function forHubAiEnergy(): RelatedLink[] {
  return dedupe([
    { title: "AI Data Center Watchlist", href: "/v/ai-energy/watchlist", type: "vertical" },
    { title: "How to Monitor Impacts", href: "/v/ai-energy/monitoring", type: "vertical" },
    { title: "AI Energy alerts", href: "/alerts/ai-energy", type: "offers" },
    { title: "National trends", href: "/national/trends", type: "ranking" },
    { title: "Regulatory hub", href: "/regulatory", type: "regulatory" },
    { title: "Price drivers", href: "/drivers", type: "drivers" },
    { title: "Methodology", href: "/methodology", type: "research" },
    { title: "Data downloads", href: "/datasets", type: "data" },
  ], "/v/ai-energy");
}

function forHubRegulatory(): RelatedLink[] {
  return dedupe([
    { title: "National overview", href: "/national", type: "ranking" },
    { title: "Price drivers", href: "/drivers", type: "drivers" },
    { title: "AI & Energy overview", href: "/v/ai-energy/overview", type: "vertical" },
    { title: "Regulatory alerts", href: "/alerts/regulatory", type: "offers" },
    { title: "Methodology", href: "/methodology", type: "research" },
    { title: "Data downloads", href: "/datasets", type: "data" },
    { title: "Compare all states", href: "/compare", type: "tool" },
    { title: "Sources", href: "/sources", type: "data" },
  ], "/regulatory");
}

function forHubDrivers(): RelatedLink[] {
  return dedupe([
    { title: "National overview", href: "/national", type: "ranking" },
    { title: "Regulatory hub", href: "/regulatory", type: "regulatory" },
    { title: "AI & Energy overview", href: "/v/ai-energy/overview", type: "vertical" },
    { title: "Methodology", href: "/methodology", type: "research" },
    { title: "Data downloads", href: "/datasets", type: "data" },
    { title: "Compare all states", href: "/compare", type: "tool" },
    { title: "Research & insights", href: "/research", type: "research" },
    { title: "Sources", href: "/sources", type: "data" },
  ], "/drivers");
}

function forHubOffers(): RelatedLink[] {
  return dedupe([
    { title: "Compare all states", href: "/compare", type: "tool" },
    { title: "Bill calculator", href: "/calculator", type: "tool" },
    { title: "Disclosures", href: "/disclosures", type: "research" },
    { title: "National overview", href: "/national", type: "ranking" },
    { title: "Methodology", href: "/methodology", type: "research" },
    { title: "Data downloads", href: "/datasets", type: "data" },
  ], "/offers");
}

function forHubAlerts(): RelatedLink[] {
  return dedupe([
    { title: "Regulatory hub", href: "/regulatory", type: "regulatory" },
    { title: "AI & Energy overview", href: "/v/ai-energy/overview", type: "vertical" },
    { title: "Price drivers", href: "/drivers", type: "drivers" },
    { title: "National overview", href: "/national", type: "ranking" },
    { title: "Compare all states", href: "/compare", type: "tool" },
    { title: "Methodology", href: "/methodology", type: "research" },
  ], "/alerts");
}

function forHubResearch(): RelatedLink[] {
  return dedupe([
    { title: "National overview", href: "/national", type: "ranking" },
    { title: "Methodology", href: "/methodology", type: "research" },
    { title: "AI & Energy", href: "/v/ai-energy", type: "vertical" },
    { title: "Data downloads", href: "/datasets", type: "data" },
    { title: "Price drivers", href: "/drivers", type: "drivers" },
    { title: "Regulatory hub", href: "/regulatory", type: "regulatory" },
    { title: "Compare all states", href: "/compare", type: "tool" },
    { title: "Sources", href: "/sources", type: "data" },
  ], "/research");
}

export function getRelatedLinks(ctx: RelatedContext): RelatedLink[] {
  switch (ctx.kind) {
    case "state": {
      if (ctx.from === "regulatory") return forRegulatoryState(ctx.state);
      if (ctx.from === "drivers") return forDriversState(ctx.state);
      if (ctx.from === "offers") return forOffersState(ctx.state);
      return forState(ctx.state);
    }
    case "guide":
      return forGuideCtx(ctx.slug, ctx.state);
    case "question":
      return forQuestionCtx(ctx.slug, ctx.state);
    case "tool":
      return forToolCtx(ctx.tool);
    case "hub": {
      switch (ctx.hub) {
        case "national":
          return forHubNational();
        case "ai-energy":
          return forHubAiEnergy();
        case "regulatory":
          return forHubRegulatory();
        case "drivers":
          return forHubDrivers();
        case "offers":
          return forHubOffers();
        case "alerts":
          return forHubAlerts();
        case "research":
          return forHubResearch();
        default:
          return [];
      }
    }
    default:
      return [];
  }
}

// ── Context-specific helpers (guide / question / tool) ───────

function forGuideCtx(slug: string, _state?: string): RelatedLink[] {
  const links: RelatedLink[] = [];
  const otherGuides = GUIDES.filter((g) => g.slug !== slug);
  const words = new Set(slug.split("-"));
  const scored = otherGuides
    .map((g) => ({ guide: g, score: g.slug.split("-").filter((w) => words.has(w)).length }))
    .sort((a, b) => b.score - a.score);
  for (const { guide } of scored.slice(0, 2)) {
    links.push({ title: guide.title, href: `/guides/${guide.slug}`, type: "guide" });
  }
  links.push(
    { title: "Bill calculator", href: "/calculator", type: "tool" },
    { title: "Compare rates", href: "/compare", type: "tool" },
    { title: "National overview", href: "/national", type: "ranking" },
    { title: "Methodology", href: "/methodology", type: "research" },
    { title: "Data downloads", href: "/datasets", type: "data" },
  );
  return dedupe(links, `/guides/${slug}`);
}

function forQuestionCtx(slug: string, _state?: string): RelatedLink[] {
  const links: RelatedLink[] = [];
  const parsed = parseQuestionSlug(slug);
  if (parsed) {
    const state = STATES[parsed.stateSlug];
    if (state) {
      links.push({ title: `${state.name} electricity rates`, href: `/${parsed.stateSlug}`, type: "state" });
      links.push({ title: `Offers in ${state.name}`, href: `/offers/${parsed.stateSlug}`, type: "offers" });
    }
  }
  links.push(
    { title: "Bill calculator", href: "/calculator", type: "tool" },
    { title: "Compare rates", href: "/compare", type: "tool" },
    { title: "National overview", href: "/national", type: "ranking" },
    { title: "Methodology", href: "/methodology", type: "research" },
    { title: "Data downloads", href: "/datasets", type: "data" },
  );
  return dedupe(links, `/questions/${slug}`);
}

function forToolCtx(tool: string): RelatedLink[] {
  const links: RelatedLink[] = [];
  const guideMap: Record<string, string[]> = {
    compare: ["how-electricity-bills-work", "why-electricity-prices-vary-by-state"],
    calculator: ["how-electricity-bills-work", "what-is-kwh"],
    affordability: ["why-electricity-prices-vary-by-state", "how-to-lower-your-electric-bill"],
    "value-ranking": ["why-electricity-prices-vary-by-state", "how-electricity-bills-work"],
    "index-ranking": ["why-electricity-prices-vary-by-state", "fixed-vs-variable-electricity-rates"],
  };
  for (const guideSlug of guideMap[tool] ?? []) {
    const guide = GUIDES.find((g) => g.slug === guideSlug);
    if (guide) links.push({ title: guide.title, href: `/guides/${guide.slug}`, type: "guide" });
  }
  links.push(
    { title: "National overview", href: "/national", type: "ranking" },
    { title: "Methodology", href: "/methodology", type: "research" },
    { title: "Data downloads", href: "/datasets", type: "data" },
    { title: "Price drivers", href: "/drivers", type: "drivers" },
    { title: "Regulatory hub", href: "/regulatory", type: "regulatory" },
    { title: "Sources", href: "/sources", type: "data" },
  );
  return dedupe(links, `/${tool}`);
}

// ── Legacy exports (used by existing pages) ──────────────────

let _questionSlugCache: string[] | null = null;
function allQuestionSlugs(): string[] {
  if (!_questionSlugCache) _questionSlugCache = getQuestionSlugs(STATES);
  return _questionSlugCache;
}

let _sortedByRate: string[] | null = null;
function statesSortedByRate(): string[] {
  if (!_sortedByRate) {
    _sortedByRate = Object.values(STATES)
      .sort((a, b) => b.avgRateCentsPerKwh - a.avgRateCentsPerKwh)
      .map((s) => s.slug);
  }
  return _sortedByRate;
}

function questionSlugsForState(stateSlug: string): string[] {
  return allQuestionSlugs().filter((s) => s.endsWith(`-${stateSlug}`));
}

function relatedStates(stateSlug: string, count: number): string[] {
  const region = getRegionByStateSlug(stateSlug);
  const sameRegion = region
    ? region.states.filter((s) => s !== stateSlug)
    : [];

  if (sameRegion.length >= count) return sameRegion.slice(0, count);

  const rate = STATES[stateSlug]?.avgRateCentsPerKwh ?? 0;
  const byDistance = statesSortedByRate()
    .filter((s) => s !== stateSlug && !sameRegion.includes(s))
    .sort(
      (a, b) =>
        Math.abs(STATES[a].avgRateCentsPerKwh - rate) -
        Math.abs(STATES[b].avgRateCentsPerKwh - rate),
    );

  return [...sameRegion, ...byDistance].slice(0, count);
}

function questionTitleFromSlug(slug: string): string {
  const parsed = parseQuestionSlug(slug);
  if (!parsed) return slug;
  const state = STATES[parsed.stateSlug];
  if (!state) return slug;
  return parsed.template.titleTemplate(state.name);
}

function isExpensiveState(stateSlug: string): boolean {
  const sorted = statesSortedByRate();
  return sorted.indexOf(stateSlug) < 10;
}

export function getRelatedForState(stateSlug: string): RelatedLink[] {
  const links: RelatedLink[] = [];

  links.push(
    { title: "Bill calculator", href: "/calculator", type: "tool" },
    { title: "Compare rates", href: "/compare", type: "tool" },
    { title: "Affordability index", href: "/affordability", type: "tool" },
    { title: "Value ranking", href: "/value-ranking", type: "tool" },
    { title: "Price Index™", href: "/index-ranking", type: "tool" },
  );

  links.push(
    {
      title: "Why Electricity Prices Vary by State",
      href: "/guides/why-electricity-prices-vary-by-state",
      type: "guide",
    },
    { title: "What Is kWh?", href: "/guides/what-is-kwh", type: "guide" },
  );

  const qSlugs = questionSlugsForState(stateSlug);
  const billQ = qSlugs.find((s) => s.startsWith("average-electric-bill-in-"));
  if (billQ) {
    links.push({
      title: questionTitleFromSlug(billQ),
      href: `/questions/${billQ}`,
      type: "question",
    });
  }
  const priceQ = isExpensiveState(stateSlug)
    ? qSlugs.find((s) => s.startsWith("why-electricity-expensive-in-"))
    : qSlugs.find((s) => s.startsWith("why-electricity-cheaper-in-"));
  if (priceQ) {
    links.push({
      title: questionTitleFromSlug(priceQ),
      href: `/questions/${priceQ}`,
      type: "question",
    });
  }

  for (const rs of relatedStates(stateSlug, 3)) {
    const name = STATES[rs]?.name ?? rs;
    links.push({ title: `${name} rates`, href: `/${rs}`, type: "state" });
  }

  return links;
}

export function getRelatedForGuide(guideSlug: string): RelatedLink[] {
  const links: RelatedLink[] = [];

  const otherGuides = GUIDES.filter((g) => g.slug !== guideSlug);
  const words = new Set(guideSlug.split("-"));
  const scored = otherGuides
    .map((g) => ({
      guide: g,
      score: g.slug.split("-").filter((w) => words.has(w)).length,
    }))
    .sort((a, b) => b.score - a.score);

  for (const { guide } of scored.slice(0, 3)) {
    links.push({
      title: guide.title,
      href: `/guides/${guide.slug}`,
      type: "guide",
    });
  }

  links.push(
    { title: "Bill calculator", href: "/calculator", type: "tool" },
    { title: "Compare rates", href: "/compare", type: "tool" },
  );

  const popularSlugs = statesSortedByRate().slice(0, 3);
  for (const slug of popularSlugs) {
    const billQ = `average-electric-bill-in-${slug}`;
    if (allQuestionSlugs().includes(billQ)) {
      links.push({
        title: questionTitleFromSlug(billQ),
        href: `/questions/${billQ}`,
        type: "question",
      });
    }
  }

  return links;
}

export function getRelatedForQuestion(questionSlug: string): RelatedLink[] {
  const links: RelatedLink[] = [];
  const parsed = parseQuestionSlug(questionSlug);

  if (parsed) {
    const state = STATES[parsed.stateSlug];
    if (state) {
      links.push({
        title: `${state.name} electricity rates`,
        href: `/${parsed.stateSlug}`,
        type: "state",
      });
    }
  }

  links.push(
    { title: "Bill calculator", href: "/calculator", type: "tool" },
    { title: "Compare rates", href: "/compare", type: "tool" },
  );

  const all = allQuestionSlugs().filter((s) => s !== questionSlug);
  const stateSlug = parsed?.stateSlug;
  const sameState = stateSlug ? all.filter((s) => s.endsWith(`-${stateSlug}`)) : [];
  const others = stateSlug ? all.filter((s) => !s.endsWith(`-${stateSlug}`)) : all;
  const picks = [...sameState.slice(0, 1), ...others.slice(0, 1)];
  for (const s of picks) {
    links.push({
      title: questionTitleFromSlug(s),
      href: `/questions/${s}`,
      type: "question",
    });
  }

  const bestGuide = questionSlug.includes("bill")
    ? "how-electricity-bills-work"
    : questionSlug.includes("expensive") || questionSlug.includes("cheaper")
      ? "why-electricity-prices-vary-by-state"
      : "what-is-kwh";
  const guide = GUIDES.find((g) => g.slug === bestGuide) ?? GUIDES[0];
  links.push({
    title: guide.title,
    href: `/guides/${guide.slug}`,
    type: "guide",
  });

  return links;
}

export function getRelatedForTool(
  toolSlug:
    | "compare"
    | "calculator"
    | "affordability"
    | "value-ranking"
    | "index-ranking",
): RelatedLink[] {
  const links: RelatedLink[] = [];

  const guidePool = [
    "how-electricity-bills-work",
    "why-electricity-prices-vary-by-state",
    "what-is-kwh",
    "how-to-lower-your-electric-bill",
    "fixed-vs-variable-electricity-rates",
    "regulated-vs-deregulated-electricity-markets",
  ];

  const guideMap: Record<string, string[]> = {
    compare: guidePool.slice(0, 3),
    calculator: [guidePool[0], guidePool[2], guidePool[3]],
    affordability: [guidePool[1], guidePool[3], guidePool[4]],
    "value-ranking": [guidePool[1], guidePool[0], guidePool[5]],
    "index-ranking": [guidePool[1], guidePool[4], guidePool[2]],
  };

  for (const slug of guideMap[toolSlug] ?? guidePool.slice(0, 3)) {
    const guide = GUIDES.find((g) => g.slug === slug);
    if (guide) {
      links.push({
        title: guide.title,
        href: `/guides/${guide.slug}`,
        type: "guide",
      });
    }
  }

  const popular = statesSortedByRate();
  const exampleSlugs = [popular[0], popular[Math.floor(popular.length / 2)], popular[popular.length - 1]];
  for (const s of exampleSlugs) {
    const billQ = `average-electric-bill-in-${s}`;
    if (allQuestionSlugs().includes(billQ)) {
      links.push({
        title: questionTitleFromSlug(billQ),
        href: `/questions/${billQ}`,
        type: "question",
      });
    }
  }

  links.push(
    { title: "Data downloads", href: "/datasets", type: "resource" },
    { title: "Sources", href: "/sources", type: "resource" },
  );

  return links;
}
