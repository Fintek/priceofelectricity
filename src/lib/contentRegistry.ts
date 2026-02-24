import { STATES } from "@/data/states";
import { UTILITIES } from "@/data/utilities";
import { CITIES } from "@/data/cities";
import { GUIDES } from "@/data/guides";
import { TOPICS } from "@/data/topics";
import { SOURCES } from "@/data/sources";
import { getActiveOffers } from "@/data/offers";
import { getQuestionSlugs, parseQuestionSlug, QUESTION_TEMPLATES } from "@/lib/questions";
import { SITE_URL } from "@/lib/site";
import { generateTemplatePages } from "@/lib/templateGenerator";
import { VERTICALS } from "@/content/verticals";

export type ContentNode = {
  id: string;
  type:
    | "state"
    | "utility"
    | "city"
    | "bill"
    | "guide"
    | "question"
    | "tool"
    | "research"
    | "ranking"
    | "offer"
    | "static"
    | "generated"
    | "vertical";
  title: string;
  url: string;
  parent?: string;
  related?: string[];
};

const BASE = SITE_URL;
const BILL_KWH_VALUES = [500, 750, 1000, 1250, 1500, 2000];

function questionTitle(slug: string): string {
  const parsed = parseQuestionSlug(slug);
  if (!parsed) return slug;
  const state = STATES[parsed.stateSlug];
  if (!state) return slug;
  return parsed.template.titleTemplate(state.name);
}

export function buildContentRegistry(): ContentNode[] {
  const nodes: ContentNode[] = [];

  // ── States ────────────────────────────────────────────────
  const stateSlugs = Object.keys(STATES).sort();
  for (const slug of stateSlugs) {
    const s = STATES[slug];
    nodes.push({
      id: `state:${slug}`,
      type: "state",
      title: `${s.name} Electricity Rates`,
      url: `${BASE}/${slug}`,
      related: [
        `state:${slug}:utilities`,
        `state:${slug}:plans`,
        `state:${slug}:history`,
        `state:${slug}:plan-types`,
        `offer:${slug}`,
      ],
    });
  }

  // ── State sub-pages (utilities, plans, history, plan-types) ─
  for (const slug of stateSlugs) {
    const s = STATES[slug];
    nodes.push({
      id: `state:${slug}:utilities`,
      type: "state",
      title: `Utilities in ${s.name}`,
      url: `${BASE}/${slug}/utilities`,
      parent: `state:${slug}`,
    });
    nodes.push({
      id: `state:${slug}:plans`,
      type: "state",
      title: `Plans in ${s.name}`,
      url: `${BASE}/${slug}/plans`,
      parent: `state:${slug}`,
    });
    nodes.push({
      id: `state:${slug}:history`,
      type: "state",
      title: `History in ${s.name}`,
      url: `${BASE}/${slug}/history`,
      parent: `state:${slug}`,
    });
    nodes.push({
      id: `state:${slug}:plan-types`,
      type: "state",
      title: `Plan Types in ${s.name}`,
      url: `${BASE}/${slug}/plan-types`,
      parent: `state:${slug}`,
    });
  }

  // ── Utilities ─────────────────────────────────────────────
  for (const u of UTILITIES) {
    nodes.push({
      id: `utility:${u.stateSlug}:${u.slug}`,
      type: "utility",
      title: u.name,
      url: `${BASE}/${u.stateSlug}/utility/${u.slug}`,
      parent: `state:${u.stateSlug}`,
    });
  }

  // ── Cities (city/ routes) ─────────────────────────────────
  for (const c of CITIES) {
    nodes.push({
      id: `city:${c.stateSlug}:${c.slug}`,
      type: "city",
      title: `${c.name} Electricity Rates`,
      url: `${BASE}/${c.stateSlug}/city/${c.slug}`,
      parent: `state:${c.stateSlug}`,
    });
  }

  // ── Cities (dual-slug [state]/[city] routes) ──────────────
  for (const c of CITIES) {
    nodes.push({
      id: `citydual:${c.stateSlug}:${c.slug}`,
      type: "city",
      title: `${c.name}, ${STATES[c.stateSlug]?.name ?? c.stateSlug}`,
      url: `${BASE}/${c.stateSlug}/${c.slug}`,
      parent: `state:${c.stateSlug}`,
    });
  }

  // ── Bill pages ────────────────────────────────────────────
  for (const slug of stateSlugs) {
    const s = STATES[slug];
    for (const kwh of BILL_KWH_VALUES) {
      nodes.push({
        id: `bill:${slug}:${kwh}`,
        type: "bill",
        title: `${kwh} kWh Electric Bill in ${s.name}`,
        url: `${BASE}/${slug}/bill/${kwh}`,
        parent: `state:${slug}`,
      });
    }
  }

  // ── Guides ────────────────────────────────────────────────
  for (const g of GUIDES) {
    nodes.push({
      id: `guide:${g.slug}`,
      type: "guide",
      title: g.title,
      url: `${BASE}/guides/${g.slug}`,
    });
  }

  // ── Questions ─────────────────────────────────────────────
  const qSlugs = getQuestionSlugs(STATES).sort();
  for (const qs of qSlugs) {
    const parsed = parseQuestionSlug(qs);
    nodes.push({
      id: `question:${qs}`,
      type: "question",
      title: questionTitle(qs),
      url: `${BASE}/questions/${qs}`,
      related: parsed ? [`state:${parsed.stateSlug}`] : undefined,
    });
  }

  // ── Tools ─────────────────────────────────────────────────
  const tools: { slug: string; title: string }[] = [
    { slug: "compare", title: "Compare Electricity Prices by State" },
    { slug: "calculator", title: "Electricity Bill Calculator" },
    { slug: "affordability", title: "Electricity Affordability by State" },
    { slug: "value-ranking", title: "Electricity Value Ranking by State" },
    { slug: "index-ranking", title: "Electricity Price Index™ by State" },
  ];
  for (const t of tools) {
    nodes.push({
      id: `tool:${t.slug}`,
      type: "tool",
      title: t.title,
      url: `${BASE}/${t.slug}`,
    });
  }

  // ── Rankings / Research ───────────────────────────────────
  const research: { slug: string; title: string }[] = [
    { slug: "research", title: "Research & Insights" },
    { slug: "research/annual-report", title: "Annual Report" },
    { slug: "research/state-trends", title: "State Trends" },
    { slug: "research/price-volatility", title: "Price Volatility" },
  ];
  for (const r of research) {
    nodes.push({
      id: `research:${r.slug}`,
      type: "research",
      title: r.title,
      url: `${BASE}/${r.slug}`,
    });
  }

  // ── Offers ────────────────────────────────────────────────
  nodes.push({
    id: "offer:hub",
    type: "offer",
    title: "Offers & Savings",
    url: `${BASE}/offers`,
  });
  for (const slug of stateSlugs) {
    const s = STATES[slug];
    nodes.push({
      id: `offer:${slug}`,
      type: "offer",
      title: `Offers in ${s.name}`,
      url: `${BASE}/offers/${slug}`,
      parent: "offer:hub",
    });
  }

  // ── Topics ────────────────────────────────────────────────
  for (const t of TOPICS) {
    nodes.push({
      id: `topic:${t.slug}`,
      type: "static",
      title: t.name,
      url: `${BASE}/topics/${t.slug}`,
    });
  }

  // ── Sources ───────────────────────────────────────────────
  for (const s of SOURCES) {
    nodes.push({
      id: `source:${s.slug}`,
      type: "static",
      title: s.name,
      url: `${BASE}/sources/${s.slug}`,
    });
  }

  // ── Regulatory ─────────────────────────────────────────
  nodes.push({
    id: "regulatory:hub",
    type: "research",
    title: "Regulatory & Rate-Case Intelligence",
    url: `${BASE}/regulatory`,
    related: ["regulatory:queue", ...stateSlugs.map((s) => `regulatory:${s}`)],
  });
  nodes.push({
    id: "regulatory:queue",
    type: "research",
    title: "Regulatory Update Queue",
    url: `${BASE}/regulatory/queue`,
    parent: "regulatory:hub",
  });
  for (const slug of stateSlugs) {
    const s = STATES[slug];
    const regStateId = `regulatory:${slug}`;
    nodes.push({
      id: regStateId,
      type: "research",
      title: `${s.name} Electricity Regulation Overview`,
      url: `${BASE}/regulatory/${slug}`,
      parent: "regulatory:hub",
      related: [`regulatory:${slug}:rate-cases`, `regulatory:${slug}:timeline`],
    });
    nodes.push({
      id: `regulatory:${slug}:rate-cases`,
      type: "research",
      title: `Rate Cases in ${s.name}`,
      url: `${BASE}/regulatory/${slug}/rate-cases`,
      parent: regStateId,
    });
    nodes.push({
      id: `regulatory:${slug}:timeline`,
      type: "research",
      title: `Regulatory Timeline for ${s.name}`,
      url: `${BASE}/regulatory/${slug}/timeline`,
      parent: regStateId,
    });
  }

  // ── Drivers ────────────────────────────────────────────
  nodes.push({
    id: "drivers:hub",
    type: "research",
    title: "Electricity Price Drivers",
    url: `${BASE}/drivers`,
    related: stateSlugs.map((s) => `drivers:${s}`),
  });
  for (const slug of stateSlugs) {
    const s = STATES[slug];
    nodes.push({
      id: `drivers:${slug}`,
      type: "research",
      title: `${s.name} Electricity Price Drivers`,
      url: `${BASE}/drivers/${slug}`,
      parent: `state:${slug}`,
      related: ["drivers:hub", `regulatory:${slug}`],
    });
  }

  // ── National dashboard ──────────────────────────────────
  const nationalPages = [
    {
      id: "national:hub",
      title: "U.S. Electricity Price Overview",
      url: `${BASE}/national`,
    },
    {
      id: "national:rankings",
      title: "National Electricity Price Rankings",
      url: `${BASE}/national/rankings`,
    },
    {
      id: "national:trends",
      title: "Electricity Rate Change Trends",
      url: `${BASE}/national/trends`,
    },
    {
      id: "national:affordability",
      title: "Electricity Affordability Distribution",
      url: `${BASE}/national/affordability`,
    },
    {
      id: "national:extremes",
      title: "Electricity Price Extremes",
      url: `${BASE}/national/extremes`,
    },
  ];
  for (const np of nationalPages) {
    nodes.push({
      id: np.id,
      type: "research",
      title: np.title,
      url: np.url,
      ...(np.id !== "national:hub" ? { parent: "national:hub" } : {}),
      ...(np.id === "national:hub"
        ? {
            related: nationalPages
              .filter((p) => p.id !== "national:hub")
              .map((p) => p.id),
          }
        : {}),
    });
  }

  // ── Verticals ───────────────────────────────────────────
  for (const v of VERTICALS) {
    const hubId = `vertical:${v.slug}`;
    const aiEnergyExtras =
      v.slug === "ai-energy"
        ? [
            `vertical:ai-energy:watchlist`,
            `vertical:ai-energy:monitoring`,
            `vertical:ai-energy:glossary`,
          ]
        : [];
    nodes.push({
      id: hubId,
      type: "vertical",
      title: v.name,
      url: `${BASE}/v/${v.slug}`,
      related: [
        ...v.pillarPages.map((p) => `vertical:${v.slug}:${p.slug}`),
        ...aiEnergyExtras,
      ],
    });
    for (const p of v.pillarPages) {
      nodes.push({
        id: `vertical:${v.slug}:${p.slug}`,
        type: "vertical",
        title: p.title,
        url: `${BASE}/v/${v.slug}/${p.slug}`,
        parent: hubId,
      });
    }
  }

  // ── AI Energy reference pages ────────────────────────────
  const aiEnergyHubId = "vertical:ai-energy";
  const aiEnergyRefPages = [
    {
      id: "vertical:ai-energy:watchlist",
      title: "AI Data Center Electricity Price Watchlist",
      url: `${BASE}/v/ai-energy/watchlist`,
    },
    {
      id: "vertical:ai-energy:monitoring",
      title: "How to Monitor AI Data Center Impacts on Electricity Prices",
      url: `${BASE}/v/ai-energy/monitoring`,
    },
    {
      id: "vertical:ai-energy:glossary",
      title: "AI, Data Centers, and Grid Pricing Glossary",
      url: `${BASE}/v/ai-energy/glossary`,
    },
  ];
  for (const ref of aiEnergyRefPages) {
    nodes.push({
      id: ref.id,
      type: "research",
      title: ref.title,
      url: ref.url,
      parent: aiEnergyHubId,
    });
  }

  // ── Generated template pages ─────────────────────────────
  for (const gp of generateTemplatePages()) {
    nodes.push({
      id: `generated:${gp.slug}`,
      type: "generated",
      title: gp.title,
      url: `${BASE}/generated/${gp.slug}`,
      parent: `state:${gp.stateSlug}`,
    });
  }

  // ── Alerts ───────────────────────────────────────────────
  nodes.push({
    id: "alerts:hub",
    type: "static",
    title: "Electricity Price Alerts",
    url: `${BASE}/alerts`,
    related: ["alerts:regulatory", "alerts:ai-energy"],
  });
  nodes.push({
    id: "alerts:regulatory",
    type: "static",
    title: "Regulatory Alerts",
    url: `${BASE}/alerts/regulatory`,
    parent: "alerts:hub",
  });
  nodes.push({
    id: "alerts:ai-energy",
    type: "static",
    title: "AI & Data Center Electricity Alerts",
    url: `${BASE}/alerts/ai-energy`,
    parent: "alerts:hub",
  });
  for (const slug of stateSlugs) {
    const s = STATES[slug];
    nodes.push({
      id: `alerts:state:${slug}`,
      type: "static",
      title: `${s.name} Electricity Alerts`,
      url: `${BASE}/alerts/${slug}`,
      parent: `state:${slug}`,
    });
  }

  // ── Static pages ──────────────────────────────────────────
  const staticPages: { slug: string; title: string }[] = [
    { slug: "about", title: "About" },
    { slug: "contact", title: "Contact" },
    { slug: "licensing", title: "Licensing" },
    { slug: "api-docs", title: "API Documentation" },
    { slug: "datasets", title: "Data Downloads" },
    { slug: "status", title: "Status" },
    { slug: "disclosures", title: "Disclosures" },
    { slug: "citations", title: "Citations & Media Mentions" },
    { slug: "press-kit", title: "Press Kit" },
    { slug: "attribution", title: "How to Cite PriceOfElectricity.com" },
    { slug: "knowledge", title: "Knowledge Pack" },
    { slug: "press", title: "Press & Media Kit" },
    { slug: "press/faq", title: "Press FAQ" },
    { slug: "press/brand", title: "Brand Guidelines" },
    { slug: "press/press-release", title: "Press Release" },
    { slug: "data-policy", title: "Data Policy" },
    { slug: "changelog", title: "Changelog" },
    { slug: "newsletter", title: "Newsletter" },
    { slug: "performance", title: "Performance" },
    { slug: "guides", title: "Electricity Guides" },
    { slug: "topics", title: "Topics" },
    { slug: "sources", title: "Sources" },
    { slug: "index", title: "Site Index" },
    { slug: "search", title: "Search" },
  ];
  for (const p of staticPages) {
    nodes.push({
      id: `static:${p.slug}`,
      type: "static",
      title: p.title,
      url: `${BASE}/${p.slug}`,
    });
  }

  return nodes;
}
