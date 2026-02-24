export type ContentBlock = {
  heading: string;
  body: string;
};

export type PillarPage = {
  slug: string;
  title: string;
  description: string;
  contentBlocks: ContentBlock[];
};

export type Vertical = {
  slug: string;
  name: string;
  description: string;
  pillarPages: PillarPage[];
};

export const VERTICALS: Vertical[] = [
  {
    slug: "electricity",
    name: "Electricity Prices",
    description:
      "The core vertical — compare average residential electricity rates by state, explore affordability, and use bill estimation tools.",
    pillarPages: [],
  },

  {
    slug: "ai-energy",
    name: "AI Data Centers & Electricity Prices",
    description:
      "Exploring how the rapid expansion of AI infrastructure may affect electricity demand, grid capacity, and consumer prices across the United States.",
    pillarPages: [
      {
        slug: "overview",
        title: "AI Data Centers and Electricity Prices",
        description:
          "An overview of how AI data center growth is associated with rising electricity demand and what it may mean for consumer electricity prices.",
        contentBlocks: [
          {
            heading: "What is happening",
            body: "Large-scale AI workloads — training foundation models, running inference at scale, and powering generative AI services — require substantial computing resources. These resources are concentrated in data centers that can each consume hundreds of megawatts of power. The pace of new data center construction has accelerated in recent years, driven by investment from major technology companies and growing enterprise demand for AI capabilities.",
          },
          {
            heading: "Why electricity demand matters",
            body: "Data centers are among the most electricity-intensive facilities in operation. Unlike traditional commercial buildings, they run at high utilization around the clock, creating sustained baseload demand rather than cyclical peaks. When multiple large facilities cluster in a single region, the cumulative load can represent a meaningful share of local generation capacity. Grid operators and utilities have noted that forecasted demand growth from data centers may exceed historical planning assumptions in some regions.",
          },
          {
            heading: "How this may affect consumer prices",
            body: "When demand for electricity grows faster than new generation and transmission capacity can be built, wholesale prices can rise. These increases may eventually be passed through to residential and commercial ratepayers, depending on the regulatory structure of the state. The degree of impact depends on many factors including the local fuel mix, the pace of renewable energy deployment, transmission constraints, and how costs are allocated among customer classes.",
          },
          {
            heading: "What to watch",
            body: "Key indicators include utility integrated resource plans (IRPs) that revise load forecasts upward, state regulatory proceedings on cost allocation for data center interconnections, and regional transmission organization (RTO) capacity auction results. States with concentrated data center development — particularly in the mid-Atlantic, the Southeast, and parts of the Midwest — may experience these dynamics sooner than others.",
          },
          {
            heading: "Context and limitations",
            body: "It is important to note that electricity pricing is influenced by many variables simultaneously. Attributing price changes to a single cause is rarely straightforward. The relationship between data center growth and consumer electricity prices is an emerging area of analysis, and outcomes will vary significantly by region, regulatory framework, and market structure.",
          },
          {
            heading: "Sources & evidence",
            body: "This analysis is based on publicly available information and does not introduce proprietary data claims. For the data foundations behind PriceOfElectricity.com, see our sources page, data policy, and research section.",
          },
        ],
      },
      {
        slug: "load-growth",
        title: "Data Center Load Growth: What It Means for Grid Prices",
        description:
          "How sustained load growth from data centers can affect grid planning, transmission, peak pricing, and regional electricity markets.",
        contentBlocks: [
          {
            heading: "Understanding load growth",
            body: "Electricity load growth refers to the increase in total electricity demand over time. For decades, U.S. electricity demand growth was relatively flat due to efficiency gains offsetting economic growth. The emergence of large-scale data centers — particularly those supporting AI training and inference — represents a potential shift in this trend. Some grid operators have revised near-term demand forecasts upward to account for expected data center interconnections.",
          },
          {
            heading: "How data centers differ from other loads",
            body: "Unlike most commercial and industrial facilities, data centers typically operate at high capacity factors — often 80% or more — around the clock. This creates persistent baseload demand rather than the variable, peaky demand patterns seen in most other sectors. A single hyperscale data center campus can consume as much electricity as a small city. When multiple campuses develop in close geographic proximity, the effect on local grid infrastructure can be significant.",
          },
          {
            heading: "Transmission and interconnection constraints",
            body: "New load often requires upgrades to the transmission and distribution infrastructure that connects generation to consumption. These upgrades can take years to plan and build. In regions where data center development outpaces infrastructure expansion, grid congestion may increase. Congestion can raise wholesale electricity prices in affected areas, and those costs may flow through to consumer bills depending on the market structure.",
          },
          {
            heading: "Peak pricing dynamics",
            body: "While data centers primarily add baseload demand, they can still affect peak pricing. When sustained high demand reduces the margin between available supply and total demand, the grid operates closer to its limits. This reduced reserve margin can cause price spikes during peak periods, particularly during extreme weather or unplanned generation outages. The combination of data center demand and climate-driven load increases (such as summer cooling demand) may compound these effects in certain regions.",
          },
          {
            heading: "Regional differences",
            body: "The impact of data center load growth is not uniform across the country. Regions with abundant, low-cost generation and available transmission capacity may absorb new demand with relatively little price impact. Regions that are already constrained — whether by limited generation, aging infrastructure, or regulatory complexity around new builds — may see more pronounced effects. The geographic distribution of data centers depends on factors like land availability, fiber connectivity, water resources, tax incentives, and electricity costs.",
          },
          {
            heading: "Sources & evidence",
            body: "For background data on state-level electricity pricing, see our sources page. For methodology information, visit our research hub. This page does not introduce new datasets and relies on publicly available grid planning documents and industry reporting.",
          },
        ],
      },
      {
        slug: "where-prices-rise",
        title:
          "Where AI Data Centers Could Push Electricity Prices Higher",
        description:
          "Which regions may experience upward pressure on electricity prices due to data center concentration, and what variables to monitor.",
        contentBlocks: [
          {
            heading: "The concept of demand hotspots",
            body: "A demand hotspot occurs when a concentration of new electricity load develops in a geographic area faster than the grid infrastructure can accommodate it. Data centers tend to cluster due to shared infrastructure advantages: proximity to fiber networks, availability of large land parcels, favorable tax or regulatory environments, and access to water for cooling. This clustering effect can create localized demand pressure that exceeds what was anticipated in utility planning cycles.",
          },
          {
            heading: "Variables that affect price sensitivity",
            body: "Not all regions respond to demand growth in the same way. Key variables that determine how data center development may affect electricity prices include: the current reserve margin (how much excess generation capacity exists), the fuel mix (regions dependent on natural gas may see more price volatility), the regulatory structure (whether the state has a regulated monopoly or a competitive market), the pace of renewable energy development, and the availability of transmission capacity to import power from adjacent regions.",
          },
          {
            heading: "Regions to watch",
            body: "Industry and utility filings suggest that the mid-Atlantic region (particularly Virginia and surrounding states), parts of the Southeast, the greater Dallas–Fort Worth area in Texas, and portions of the Midwest have seen or are expected to see significant data center load growth. In some of these areas, utilities have publicly disclosed that data center interconnection requests are reshaping their long-term resource plans. However, the actual price impact depends on how quickly new generation and transmission can be developed to meet the demand.",
          },
          {
            heading: "How to monitor these dynamics",
            body: "Consumers and analysts can track several publicly available indicators: utility integrated resource plans (IRPs), which are filed with state regulators; regional transmission organization (RTO) capacity and reliability reports; state public utility commission proceedings on cost allocation; and wholesale electricity price trends from organizations like the EIA. Changes in any of these can signal emerging price pressure in a given region.",
          },
          {
            heading: "Why certainty is limited",
            body: "Predicting electricity price outcomes involves numerous interacting variables, many of which are themselves uncertain. Data center projects may be announced but not built, or built on different timelines than expected. New generation sources — particularly renewables and battery storage — may come online faster than projected, offsetting demand growth. Regulatory decisions on cost allocation can shift price impacts between customer classes. For these reasons, this analysis describes possible dynamics rather than making specific price forecasts.",
          },
          {
            heading: "Sources & evidence",
            body: "This page draws on publicly reported utility filings and industry trends. PriceOfElectricity.com does not produce original demand forecasts. For our data foundations, see the sources page, data policy, and research section.",
          },
        ],
      },
    ],
  },

  {
    slug: "solar",
    name: "Solar Energy & Electricity Savings",
    description:
      "How residential and commercial solar adoption relates to electricity costs and grid dynamics across U.S. states.",
    pillarPages: [],
  },

  {
    slug: "efficiency",
    name: "Energy Efficiency & Demand Reduction",
    description:
      "Exploring the role of energy efficiency programs and demand-side management in reducing electricity costs for consumers.",
    pillarPages: [],
  },
];

export function getVertical(slug: string): Vertical | undefined {
  return VERTICALS.find((v) => v.slug === slug);
}

export function getVerticalPillar(
  verticalSlug: string,
  pillarSlug: string,
): PillarPage | undefined {
  const vertical = getVertical(verticalSlug);
  if (!vertical) return undefined;
  return vertical.pillarPages.find((p) => p.slug === pillarSlug);
}

export function getAllVerticalPillarParams(): {
  vertical: string;
  pillar: string;
}[] {
  const params: { vertical: string; pillar: string }[] = [];
  for (const v of VERTICALS) {
    for (const p of v.pillarPages) {
      params.push({ vertical: v.slug, pillar: p.slug });
    }
  }
  return params;
}
