export type WatchlistItem = {
  id: string;
  title: string;
  description: string;
  whyItMatters: string;
  howToMonitor: string[];
  relatedLinks: { title: string; href: string }[];
};

export type GlossaryTerm = {
  term: string;
  definition: string;
  related?: string[];
};

export type MonitoringSource = {
  id: string;
  name: string;
  description: string;
  cadence: "daily" | "weekly" | "monthly" | "quarterly";
  whatToLookFor: string[];
};

// ── Watchlist ──────────────────────────────────────────────────────────────

export const AI_ENERGY_WATCHLIST: WatchlistItem[] = [
  {
    id: "interconnection-queue",
    title: "Interconnection Queue Length and Backlog",
    description:
      "The interconnection queue tracks requests by generators and large loads seeking to connect to the transmission grid. Long queues and extended processing timelines can signal that the grid is approaching capacity constraints in a given region.",
    whyItMatters:
      "When the interconnection queue is heavily backlogged, both new generation and new large loads—including data centers—face delays. This can constrain how quickly supply can respond to demand growth, potentially affecting prices.",
    howToMonitor: [
      "Review periodic interconnection queue reports published by regional grid operators (ISOs and RTOs)",
      "Track the number and size of new data center interconnection requests by region",
      "Monitor average queue processing timelines for changes",
      "Watch for regulatory proceedings that may reform interconnection rules",
    ],
    relatedLinks: [
      { title: "AI energy overview", href: "/v/ai-energy/overview" },
      { title: "Monitoring resources", href: "/v/ai-energy/monitoring" },
      { title: "Glossary: Interconnection", href: "/v/ai-energy/glossary" },
    ],
  },
  {
    id: "transformer-supply",
    title: "Large Power Transformer Supply Constraints",
    description:
      "Large power transformers are critical to transmitting electricity from generation sources to load centers. Supply chains for these components can be limited, and lead times have extended in recent years as demand has grown.",
    whyItMatters:
      "If transformer availability constrains the pace at which new grid infrastructure can be built, it may slow the ability of utilities to accommodate rapid load growth from data centers, potentially creating grid reliability concerns in affected areas.",
    howToMonitor: [
      "Follow utility capital expenditure plans and comments on equipment procurement timelines",
      "Watch for references to transformer lead times in utility regulatory filings",
      "Monitor industry trade publications covering grid infrastructure supply chains",
    ],
    relatedLinks: [
      { title: "Load growth analysis", href: "/v/ai-energy/load-growth" },
      { title: "Monitoring resources", href: "/v/ai-energy/monitoring" },
    ],
  },
  {
    id: "peak-demand-forecasts",
    title: "Peak Demand Forecast Revisions",
    description:
      "Grid operators publish long-term load forecasts that inform generation and transmission planning. When these forecasts are revised upward—particularly due to data center growth—it signals that the grid may need to expand faster than previously planned.",
    whyItMatters:
      "Upward revisions to peak demand forecasts can trigger new generation procurement, transmission upgrades, and capacity market price changes. They can also indicate that reserve margins may tighten in the near term before new supply comes online.",
    howToMonitor: [
      "Review annual reliability assessments from NERC and regional grid operators",
      "Track integrated resource plans (IRPs) filed by utilities with state regulators",
      "Compare successive forecast editions to identify regions with accelerating revisions",
      "Watch for publicly disclosed data center load studies from utilities",
    ],
    relatedLinks: [
      { title: "Where prices may rise", href: "/v/ai-energy/where-prices-rise" },
      { title: "Glossary: IRP", href: "/v/ai-energy/glossary" },
      { title: "Compare state rates", href: "/compare" },
    ],
  },
  {
    id: "capacity-market-prices",
    title: "Capacity Market Prices and Auction Results",
    description:
      "Capacity markets, used in certain regions, compensate generators for being available to produce electricity during peak demand periods. Prices in these markets can rise when demand growth exceeds available supply commitments.",
    whyItMatters:
      "Rising capacity prices can flow through to consumer electricity bills over time, depending on the regional market structure and how utilities recover costs. Significant increases may indicate that the market expects supply to be tight relative to demand.",
    howToMonitor: [
      "Review capacity auction results published by ISOs such as PJM, ISO-NE, and NYISO",
      "Track trends in clearing prices across multiple auction cycles",
      "Watch for changes in capacity market rules that may affect price formation",
      "Monitor state regulatory proceedings on capacity cost recovery",
    ],
    relatedLinks: [
      { title: "Glossary: Capacity market", href: "/v/ai-energy/glossary" },
      { title: "Glossary: LMP", href: "/v/ai-energy/glossary" },
      { title: "State electricity rates", href: "/compare" },
    ],
  },
  {
    id: "transmission-congestion",
    title: "Transmission Congestion and Bottlenecks",
    description:
      "Transmission congestion occurs when electricity cannot flow freely from low-cost generation areas to high-demand areas due to physical line constraints. Congestion raises the cost of delivering electricity in affected regions.",
    whyItMatters:
      "When data centers cluster in a region with limited transmission access to low-cost generation, congestion costs can increase. These costs may be reflected in locational marginal prices (LMPs) and eventually in consumer rates.",
    howToMonitor: [
      "Review LMP data published by ISOs and RTOs, particularly for congestion components",
      "Monitor transmission planning studies for identified constraints",
      "Watch for transmission upgrade proposals in utility filings and FERC proceedings",
      "Track congestion revenue rights (CRR) auction prices as a market signal",
    ],
    relatedLinks: [
      { title: "Glossary: LMP", href: "/v/ai-energy/glossary" },
      { title: "Glossary: Transmission congestion", href: "/v/ai-energy/glossary" },
      { title: "Load growth analysis", href: "/v/ai-energy/load-growth" },
    ],
  },
  {
    id: "data-center-clustering",
    title: "Data Center Geographic Clustering",
    description:
      "Data centers tend to concentrate in specific regions due to land availability, fiber connectivity, water resources, tax incentives, and existing power infrastructure. This clustering can create localized demand pressure.",
    whyItMatters:
      "A high density of data centers in a single region can stress local grid infrastructure more than dispersed development would. Monitoring clustering patterns can help identify which grid regions may face near-term capacity challenges.",
    howToMonitor: [
      "Track commercial real estate data center market reports for major metros",
      "Review utility interconnection filings and load growth disclosures by service territory",
      "Monitor state-level economic development announcements for large data center projects",
      "Watch for utility infrastructure upgrade announcements in specific counties or regions",
    ],
    relatedLinks: [
      { title: "Where prices may rise", href: "/v/ai-energy/where-prices-rise" },
      { title: "AI energy overview", href: "/v/ai-energy/overview" },
    ],
  },
  {
    id: "rate-cases",
    title: "Utility Rate Cases and Cost Allocation Proceedings",
    description:
      "Rate cases are regulatory proceedings in which utilities request permission to change the rates charged to customers. They often include proposals about how large commercial and industrial loads—including data centers—are charged for grid infrastructure.",
    whyItMatters:
      "Rate case outcomes can determine how costs associated with data center-driven grid upgrades are allocated between large industrial customers and smaller residential customers. They may directly affect how much residential consumers pay.",
    howToMonitor: [
      "Follow state public utility commission dockets for pending rate cases",
      "Watch for proposals related to large load tariffs, demand charges, or cost allocation",
      "Track utility press releases and investor disclosures about rate proceedings",
      "Monitor advocacy group filings and interventions in rate cases",
    ],
    relatedLinks: [
      { title: "State electricity rates", href: "/compare" },
      { title: "Data policy", href: "/data-policy" },
      { title: "Glossary: Rate case", href: "/v/ai-energy/glossary" },
    ],
  },
  {
    id: "reserve-margin-trends",
    title: "Reserve Margin Trends",
    description:
      "The reserve margin is the percentage by which available generation capacity exceeds expected peak demand. It serves as a measure of grid reliability. Declining reserve margins can indicate that the grid is becoming tighter.",
    whyItMatters:
      "When reserve margins fall below planning thresholds, grid operators may need to procure additional capacity or implement demand-side measures. Low reserve margins can also lead to higher wholesale prices during peak periods.",
    howToMonitor: [
      "Review annual resource adequacy reports from NERC and regional reliability coordinators",
      "Track IRP filings for changes in projected reserve margins",
      "Watch for emergency measures or demand response activations during extreme weather",
      "Monitor capacity market results as a market-based signal of tightness",
    ],
    relatedLinks: [
      { title: "Load growth analysis", href: "/v/ai-energy/load-growth" },
      { title: "Glossary: Reserve margin", href: "/v/ai-energy/glossary" },
    ],
  },
  {
    id: "renewable-deployment-pace",
    title: "Renewable Energy Deployment Pace",
    description:
      "The rate at which new renewable generation—particularly solar and wind—comes online can affect how quickly additional electricity supply is added to the grid in response to growing demand from data centers.",
    whyItMatters:
      "If renewable deployment keeps pace with or exceeds data center demand growth, the net pressure on prices may be limited. If development lags due to siting, permitting, or interconnection barriers, demand growth may not be offset by new supply.",
    howToMonitor: [
      "Track EIA and grid operator data on new generation capacity additions",
      "Monitor state renewable portfolio standard (RPS) compliance reports",
      "Review solar and wind capacity factor and generation data",
      "Watch for policy changes that may accelerate or slow permitting timelines",
    ],
    relatedLinks: [
      { title: "AI energy overview", href: "/v/ai-energy/overview" },
      { title: "Affordability index", href: "/affordability" },
    ],
  },
  {
    id: "demand-response",
    title: "Demand Response Program Activity",
    description:
      "Demand response programs allow grid operators and utilities to reduce or shift electricity consumption during peak periods by incentivizing participating customers to cut back usage. Data centers may be eligible participants.",
    whyItMatters:
      "Active demand response programs can help manage peak demand without building additional generation capacity, potentially moderating price spikes. Conversely, data centers that opt out or cannot participate may reduce the effectiveness of demand response as a grid management tool.",
    howToMonitor: [
      "Review ISO and utility demand response program enrollment and performance data",
      "Track regulatory proceedings related to demand response rules for large commercial loads",
      "Watch for announcements from large technology companies about demand flexibility programs",
      "Monitor FERC rulemakings on demand response compensation",
    ],
    relatedLinks: [
      { title: "Glossary: Demand response", href: "/v/ai-energy/glossary" },
      { title: "Load growth analysis", href: "/v/ai-energy/load-growth" },
    ],
  },
  {
    id: "ppa-pricing",
    title: "Power Purchase Agreement (PPA) Pricing Trends",
    description:
      "Large technology companies increasingly procure electricity directly through power purchase agreements (PPAs) with generators. PPA prices reflect market expectations about long-term electricity costs and can signal trends in wholesale markets.",
    whyItMatters:
      "Rising PPA prices may indicate that the market expects higher long-term electricity costs due to demand growth. They can also reflect scarcity of certain generation types or geographic constraints in specific markets.",
    howToMonitor: [
      "Follow announcements from major technology companies regarding new PPA signings",
      "Track industry reports on corporate PPA market activity and pricing",
      "Review financial disclosures from independent power producers about contract terms",
      "Watch for changes in PPA tenor and structure as market conditions evolve",
    ],
    relatedLinks: [
      { title: "Glossary: PPA", href: "/v/ai-energy/glossary" },
      { title: "Where prices may rise", href: "/v/ai-energy/where-prices-rise" },
    ],
  },
  {
    id: "load-forecast-revisions",
    title: "Grid Operator Load Forecast Revisions",
    description:
      "Grid operators periodically update their long-range load forecasts. When these forecasts are revised upward more significantly than in previous cycles, it may signal accelerating demand growth in that region.",
    whyItMatters:
      "Larger-than-expected forecast revisions can affect resource planning timelines, potentially creating gaps between demand and supply that pressure prices in the near term.",
    howToMonitor: [
      "Compare successive editions of ISO and RTO load forecasting reports",
      "Watch for explicit references to data center load contributions in forecast methodology notes",
      "Track load forecast assumptions in utility IRP filings",
      "Monitor NERC long-term reliability assessments for load forecast trend changes",
    ],
    relatedLinks: [
      { title: "Peak demand forecasts", href: "/v/ai-energy/watchlist" },
      { title: "Monitoring resources", href: "/v/ai-energy/monitoring" },
    ],
  },
  {
    id: "grid-upgrade-timelines",
    title: "Transmission and Distribution Upgrade Timelines",
    description:
      "Upgrades to transmission and distribution infrastructure are necessary to accommodate new load growth. These projects can take years to complete due to permitting, right-of-way acquisition, and equipment procurement.",
    whyItMatters:
      "When upgrade timelines extend relative to the pace of data center development, the gap between demand growth and infrastructure capacity can widen, potentially creating reliability or cost pressures in specific areas.",
    howToMonitor: [
      "Track utility transmission project timelines in rate case and IRP filings",
      "Watch for state or federal permitting actions on major transmission projects",
      "Review regional transmission planning organization (RTO) project lists",
      "Monitor news coverage of project delays or accelerations",
    ],
    relatedLinks: [
      { title: "Transmission congestion", href: "/v/ai-energy/watchlist" },
      { title: "Load growth analysis", href: "/v/ai-energy/load-growth" },
    ],
  },
];

// ── Glossary ───────────────────────────────────────────────────────────────

export const AI_ENERGY_GLOSSARY: GlossaryTerm[] = [
  {
    term: "Ancillary Services",
    definition:
      "Services used by grid operators to maintain the reliability and stability of the power system, including frequency regulation, spinning reserves, and voltage support. These services have their own markets and pricing.",
    related: ["Reserve margin", "ISO/RTO"],
  },
  {
    term: "Baseload",
    definition:
      "The minimum level of electricity demand over a given period, or the generation that runs continuously to meet that demand. Data centers are often described as baseload loads due to their high, consistent power consumption.",
    related: ["Load factor", "Peaker plant"],
  },
  {
    term: "Behind-the-Meter Generation",
    definition:
      "Electricity generation installed on the customer side of the utility meter, such as rooftop solar or on-site natural gas generators. Data centers increasingly use behind-the-meter generation as backup or to reduce grid exposure.",
  },
  {
    term: "Capacity Market",
    definition:
      "A forward market in which generators are paid to be available to produce electricity during peak demand periods, typically one to three years in advance. Used in certain regions (e.g., PJM, ISO-NE) to ensure resource adequacy.",
    related: ["ISO/RTO", "Reserve margin", "Resource adequacy"],
  },
  {
    term: "Carbon Intensity",
    definition:
      "The amount of carbon dioxide emitted per unit of electricity generated, typically expressed in grams of CO₂ per kilowatt-hour. Varies by region based on generation mix.",
    related: ["Generation mix", "PPA"],
  },
  {
    term: "Co-location Facility",
    definition:
      "A data center that leases rack space, power, and cooling infrastructure to multiple tenants. Co-location facilities can be very large electricity consumers and may be treated as a single large load by utilities.",
    related: ["Hyperscale data center", "Interconnection"],
  },
  {
    term: "Curtailment",
    definition:
      "The reduction or shutoff of electricity generation output, often applied to renewable sources when supply exceeds demand. Can also refer to instructed reductions in large load consumption during grid emergencies.",
    related: ["Demand response", "Reserve margin"],
  },
  {
    term: "Demand Response",
    definition:
      "Programs that incentivize electricity consumers to reduce or shift their usage in response to grid conditions or price signals. Can help grid operators manage peak demand without building additional generation capacity.",
    related: ["Baseload", "Peak demand", "TOU"],
  },
  {
    term: "Deregulation",
    definition:
      "The restructuring of electricity markets to introduce competition among generators and, in some states, among retail electricity suppliers. Affects how electricity prices are set and who can offer service to consumers.",
    related: ["Retail electricity market", "Wholesale electricity market"],
  },
  {
    term: "Dispatchable Generation",
    definition:
      "Generation sources that can be turned on or off or adjusted in output on demand, such as natural gas plants or hydropower. Contrasted with variable renewable generation (solar, wind) whose output depends on weather.",
    related: ["Peaker plant", "Reserve margin"],
  },
  {
    term: "FERC",
    definition:
      "The Federal Energy Regulatory Commission, the U.S. federal agency that regulates interstate transmission of electricity and natural gas, wholesale electricity markets, and hydroelectric licensing.",
    related: ["ISO/RTO", "Interconnection"],
  },
  {
    term: "Generation Mix",
    definition:
      "The combination of fuel sources (coal, natural gas, nuclear, wind, solar, hydro, etc.) used to generate electricity in a region. Affects both the carbon intensity and the cost structure of electricity.",
    related: ["Carbon intensity", "Dispatchable generation"],
  },
  {
    term: "Hyperscale Data Center",
    definition:
      "A very large data center, typically operated by major cloud and technology companies, that can consume hundreds of megawatts of power. Hyperscale facilities often have a significant impact on local grid planning.",
    related: ["Co-location facility", "Load factor"],
  },
  {
    term: "Interconnection",
    definition:
      "The process by which a new generator or large load connects to the transmission or distribution grid. Requires engineering studies and often infrastructure upgrades, creating a queue that can cause significant delays.",
    related: ["Interconnection queue", "FERC", "Transmission congestion"],
  },
  {
    term: "Integrated Resource Plan (IRP)",
    definition:
      "A long-range planning document filed by utilities with state regulators that outlines projected electricity demand, planned generation resources, and infrastructure investments over a multi-year horizon. A key source for tracking load forecast revisions.",
    related: ["Reserve margin", "Peak demand", "FERC"],
  },
  {
    term: "ISO/RTO",
    definition:
      "Independent System Operator (ISO) or Regional Transmission Organization (RTO): entities that operate the transmission grid and wholesale electricity markets across large multi-state regions. Examples include PJM, MISO, CAISO, ERCOT, ISO-NE, NYISO, and SPP.",
    related: ["LMP", "Capacity market", "Wholesale electricity market"],
  },
  {
    term: "LMP",
    definition:
      "Locational Marginal Price: the cost of supplying one additional megawatt-hour of electricity at a specific location on the grid at a given time. Reflects energy, congestion, and transmission loss components. Used in wholesale markets to set prices.",
    related: ["Transmission congestion", "Wholesale electricity market", "ISO/RTO"],
  },
  {
    term: "Load Factor",
    definition:
      "The ratio of average electricity consumption to peak consumption over a given period, expressed as a percentage. A high load factor (close to 100%) indicates consistent, near-constant demand. Data centers typically have very high load factors.",
    related: ["Baseload", "Hyperscale data center"],
  },
  {
    term: "Peaker Plant",
    definition:
      "A power plant that operates only during periods of high demand, often natural gas turbines that can start quickly. Peaker plants tend to have higher operating costs and are a key driver of electricity prices during peak periods.",
    related: ["Baseload", "Dispatchable generation", "Reserve margin"],
  },
  {
    term: "Peak Demand",
    definition:
      "The maximum level of electricity consumption in a region during a given period. Grid infrastructure is often sized to meet peak demand. Rising peak demand from data centers can require new generation and transmission capacity.",
    related: ["Reserve margin", "Demand response", "Capacity market"],
  },
  {
    term: "PPA (Power Purchase Agreement)",
    definition:
      "A long-term contract in which a buyer agrees to purchase electricity directly from a generator at a set price. Large technology companies use PPAs to secure electricity, often from renewable sources, at predictable costs.",
    related: ["Carbon intensity", "Generation mix"],
  },
  {
    term: "PUE (Power Usage Effectiveness)",
    definition:
      "A metric used to measure data center energy efficiency, calculated as total facility power divided by IT equipment power. A PUE of 1.0 would mean all energy goes directly to computing; values above 1.0 reflect cooling and overhead.",
    related: ["Hyperscale data center", "Demand response"],
  },
  {
    term: "Rate Case",
    definition:
      "A formal proceeding before a state public utility commission in which a regulated utility requests approval to change its rates. Determines how costs—including those from grid upgrades needed for large loads—are allocated among customer classes.",
    related: ["Retail electricity market", "FERC"],
  },
  {
    term: "Reserve Margin",
    definition:
      "The percentage by which total available generating capacity exceeds expected peak demand. Grid operators and regulators maintain reserve margin targets (often 15–20%) to ensure reliability. Declining margins can increase price volatility.",
    related: ["Peak demand", "Capacity market", "Dispatchable generation"],
  },
  {
    term: "Resource Adequacy",
    definition:
      "The ability of the electricity system to supply enough power to meet demand at all times, including during peak periods. Resource adequacy planning is a primary function of grid operators and utilities.",
    related: ["Reserve margin", "Capacity market", "IRP"],
  },
  {
    term: "Retail Electricity Market",
    definition:
      "The market in which electricity is sold to end-use customers (residential, commercial, industrial). In deregulated states, multiple suppliers may compete for customers. In regulated states, a single utility typically serves all customers in its territory.",
    related: ["Deregulation", "Wholesale electricity market"],
  },
  {
    term: "TOU (Time of Use)",
    definition:
      "A pricing structure in which electricity rates vary based on the time of day or season, with higher rates during peak demand periods. TOU pricing is sometimes used with large commercial customers, including data centers.",
    related: ["Demand response", "Peak demand"],
  },
  {
    term: "Transmission Congestion",
    definition:
      "A condition in which the physical limits of transmission lines prevent electricity from flowing freely from low-cost generation areas to high-demand areas. Causes divergence in LMPs across locations and can raise electricity costs in constrained regions.",
    related: ["LMP", "ISO/RTO", "Interconnection"],
  },
  {
    term: "VPP (Virtual Power Plant)",
    definition:
      "An aggregation of distributed energy resources (batteries, solar, demand response assets) that can be coordinated to act like a conventional power plant from the grid's perspective. An emerging tool for managing grid demand flexibility.",
    related: ["Demand response", "Behind-the-meter generation"],
  },
  {
    term: "Wholesale Electricity Market",
    definition:
      "The market in which electricity is bought and sold between generators, utilities, and large traders, typically through organized markets run by ISOs/RTOs or through bilateral contracts. Wholesale prices influence but do not directly equal retail rates.",
    related: ["LMP", "Retail electricity market", "ISO/RTO"],
  },
];

// ── Monitoring Sources ─────────────────────────────────────────────────────

export const AI_ENERGY_MONITORING_SOURCES: MonitoringSource[] = [
  {
    id: "grid-operator-forecasts",
    name: "Grid Operator Load Forecasts and Reliability Assessments",
    description:
      "ISOs and RTOs publish regular long-term load forecasts and annual reliability assessments. These are primary sources for understanding how grid operators expect demand to evolve, including contributions from large loads such as data centers.",
    cadence: "quarterly",
    whatToLookFor: [
      "Upward revisions to peak demand forecasts",
      "Changes in the assumed share of load from data centers or large industrials",
      "Reductions in projected reserve margins",
      "New transmission or generation needs identified to maintain reliability",
    ],
  },
  {
    id: "utility-irp-filings",
    name: "Utility Integrated Resource Plans (IRPs)",
    description:
      "Regulated utilities file IRPs with state public utility commissions on a scheduled basis (often every two to three years). IRPs contain detailed projections of load growth, planned resources, and infrastructure investment.",
    cadence: "quarterly",
    whatToLookFor: [
      "Load forecast changes attributed to economic development or large customer additions",
      "New generation procurement plans triggered by demand growth",
      "References to data center service agreements or large load studies",
      "Changes in projected distribution infrastructure investment needs",
    ],
  },
  {
    id: "ferc-filings",
    name: "FERC Electronic Filing Databases",
    description:
      "The Federal Energy Regulatory Commission maintains public databases of filings related to interstate transmission, wholesale markets, and interconnection. These include transmission planning submissions, capacity market filings, and tariff amendments.",
    cadence: "weekly",
    whatToLookFor: [
      "Large interconnection requests for new load near existing data center clusters",
      "Transmission upgrade proposals for congested corridors",
      "Capacity market tariff changes affecting demand response or large loads",
      "Cost allocation proceedings related to large load infrastructure",
    ],
  },
  {
    id: "eia-statistics",
    name: "Federal Energy Statistics (EIA)",
    description:
      "The U.S. Energy Information Administration publishes comprehensive data on electricity generation, consumption, prices, and infrastructure. Regular releases include monthly electricity statistics, annual state-level data, and special reports.",
    cadence: "monthly",
    whatToLookFor: [
      "Changes in state-level commercial and industrial electricity consumption",
      "Generation capacity additions by fuel type and region",
      "Changes in average retail electricity prices by sector",
      "Wholesale market price trends",
    ],
  },
  {
    id: "capacity-auction-results",
    name: "ISO/RTO Capacity Auction Results",
    description:
      "ISOs and RTOs with capacity markets publish the results of periodic capacity auctions, including clearing prices and the volume of capacity procured. These results reflect the market's forward assessment of supply-demand balance.",
    cadence: "quarterly",
    whatToLookFor: [
      "Year-over-year changes in capacity clearing prices",
      "Changes in the capacity demand curve used in auctions",
      "Derating or removal of existing capacity resources",
      "Commentary on load growth drivers in auction filings",
    ],
  },
  {
    id: "state-puc-proceedings",
    name: "State Public Utility Commission Proceedings",
    description:
      "State PUCs oversee rate cases, IRP approvals, and other proceedings affecting retail electricity prices. Their dockets contain filings, testimony, and orders that directly affect what consumers pay.",
    cadence: "monthly",
    whatToLookFor: [
      "New rate cases with infrastructure cost recovery proposals",
      "Proceedings related to large load service agreements or special tariffs",
      "Cost allocation decisions for transmission upgrades",
      "Approval or denial of IRP-related resource additions",
    ],
  },
  {
    id: "utility-investor-disclosures",
    name: "Utility Earnings Calls and Investor Disclosures",
    description:
      "Publicly traded utilities discuss load growth, capital expenditure plans, and regulatory proceedings with investors on a quarterly basis. These disclosures often contain forward-looking commentary on data center demand.",
    cadence: "quarterly",
    whatToLookFor: [
      "References to data center demand as a load growth driver",
      "Changes in capital expenditure guidance for grid infrastructure",
      "Commentary on interconnection queue status and timelines",
      "Discussion of pending rate cases or regulatory outcomes",
    ],
  },
  {
    id: "nerc-assessments",
    name: "NERC Long-Term Reliability Assessments",
    description:
      "The North American Electric Reliability Corporation publishes annual long-term reliability assessments covering generation adequacy, transmission, and emerging risks across all regions of North America.",
    cadence: "quarterly",
    whatToLookFor: [
      "Changes in assessed risk levels for specific regions",
      "References to accelerating demand growth as a reliability factor",
      "Identification of regions at elevated risk of capacity shortfalls",
      "Discussion of infrastructure investment gaps",
    ],
  },
  {
    id: "wholesale-price-data",
    name: "Wholesale Electricity Market Price Data",
    description:
      "Real-time and day-ahead LMP data is published by ISOs and RTOs. Historical LMP data enables analysis of congestion patterns, price spikes, and regional price differentials over time.",
    cadence: "daily",
    whatToLookFor: [
      "Persistent congestion in corridors serving high data center density areas",
      "Increasing frequency or severity of price spikes during peak periods",
      "Growing divergence in LMPs between low-cost generation areas and load centers",
      "Seasonal patterns that may reflect tightening reserve margins",
    ],
  },
  {
    id: "transmission-planning",
    name: "Regional Transmission Planning Studies",
    description:
      "RTOs and FERC-directed processes produce regional transmission plans that identify needed infrastructure upgrades and their associated costs. These plans reflect anticipated load growth and generation changes.",
    cadence: "quarterly",
    whatToLookFor: [
      "New transmission projects identified to serve load growth in data center regions",
      "Cost estimates for planned upgrades and their proposed allocation",
      "Changes in the urgency or timeline of previously identified needs",
      "Identification of new constraints not present in prior planning cycles",
    ],
  },
  {
    id: "energy-research",
    name: "Academic and Think Tank Energy Research",
    description:
      "Research institutions, think tanks, and university energy centers publish analysis on electricity market dynamics, including the impacts of data center growth, renewable integration, and grid modernization.",
    cadence: "monthly",
    whatToLookFor: [
      "Studies quantifying the electricity demand impact of AI and data centers",
      "Analysis of cost allocation fairness between large and small customers",
      "Research on grid resilience and reliability under high load growth scenarios",
      "Policy proposals related to data center siting, tariffs, or efficiency standards",
    ],
  },
  {
    id: "energy-news",
    name: "Regional Energy Trade Publications and News",
    description:
      "Trade publications and energy-focused news outlets cover developments in electricity markets, utility operations, and regulatory proceedings that may not yet appear in official data sources.",
    cadence: "weekly",
    whatToLookFor: [
      "Reports of new large data center project announcements in specific regions",
      "Coverage of utility service territory capacity concerns",
      "Reporting on rate case proceedings and regulatory decisions",
      "Analysis of the relationship between AI growth and electricity demand",
    ],
  },
];
