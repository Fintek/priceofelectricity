export type ApplianceCategory =
  | "kitchen"
  | "climate"
  | "laundry"
  | "electronics"
  | "transport"
  | "personal";

export type ApplianceConfig = {
  slug: string;
  displayName: string;
  category: ApplianceCategory;
  wattageRange: {
    min: number;
    max: number;
  };
  averageWattage: number;
  typicalUsageHoursPerDay: number;
  introFragment: string;
  usageNote: string;
  variabilityFactors: string[];
};

export const APPLIANCE_CONFIGS = [
  {
    slug: "refrigerator",
    displayName: "Refrigerator",
    category: "kitchen",
    wattageRange: { min: 100, max: 250 },
    averageWattage: 180,
    typicalUsageHoursPerDay: 8,
    introFragment: "a typical compressor-cycle refrigerator",
    usageNote: "Refrigerators cycle on and off during the day, so the average running load is lower than peak startup wattage.",
    variabilityFactors: ["appliance age", "door-opening frequency", "garage vs indoor placement"],
  },
  {
    slug: "space-heater",
    displayName: "Space Heater",
    category: "climate",
    wattageRange: { min: 750, max: 1500 },
    averageWattage: 1500,
    typicalUsageHoursPerDay: 4,
    introFragment: "a plug-in electric resistance space heater",
    usageNote: "Most space heaters draw close to their rated wattage when actively heating, which makes them one of the more expensive household appliances to run.",
    variabilityFactors: ["thermostat cycling", "room insulation", "outdoor temperature"],
  },
  {
    slug: "window-ac",
    displayName: "Window AC",
    category: "climate",
    wattageRange: { min: 500, max: 1500 },
    averageWattage: 900,
    typicalUsageHoursPerDay: 8,
    introFragment: "a standard window air conditioner",
    usageNote: "Window AC units cycle based on thermostat demand, so real-world daily cost depends heavily on weather and setpoint.",
    variabilityFactors: ["BTU size", "climate", "thermostat setting"],
  },
  {
    slug: "portable-ac",
    displayName: "Portable AC",
    category: "climate",
    wattageRange: { min: 700, max: 1400 },
    averageWattage: 1100,
    typicalUsageHoursPerDay: 6,
    introFragment: "a portable air conditioner",
    usageNote: "Portable AC units often consume more electricity per room cooled than window units, especially in hotter climates.",
    variabilityFactors: ["hose configuration", "room size", "daily runtime"],
  },
  {
    slug: "central-ac",
    displayName: "Central AC",
    category: "climate",
    wattageRange: { min: 2000, max: 5000 },
    averageWattage: 3500,
    typicalUsageHoursPerDay: 8,
    introFragment: "a central air conditioning system",
    usageNote: "Central AC cost depends on home size, system efficiency, and climate, but the statewide electricity rate still strongly affects total operating cost.",
    variabilityFactors: ["home square footage", "SEER rating", "humidity and summer temperatures"],
  },
  {
    slug: "clothes-dryer",
    displayName: "Clothes Dryer",
    category: "laundry",
    wattageRange: { min: 1800, max: 5000 },
    averageWattage: 3000,
    typicalUsageHoursPerDay: 0.75,
    introFragment: "an electric clothes dryer",
    usageNote: "Dryers use high wattage for shorter periods, so cost depends more on frequency of loads than continuous runtime.",
    variabilityFactors: ["load size", "moisture sensor efficiency", "vent cleanliness"],
  },
  {
    slug: "washing-machine",
    displayName: "Washing Machine",
    category: "laundry",
    wattageRange: { min: 400, max: 1400 },
    averageWattage: 700,
    typicalUsageHoursPerDay: 0.5,
    introFragment: "a typical household washing machine",
    usageNote: "Washing machines generally use less electricity than dryers, but hot-water wash cycles can raise total energy cost indirectly.",
    variabilityFactors: ["wash temperature", "load frequency", "machine efficiency"],
  },
  {
    slug: "dishwasher",
    displayName: "Dishwasher",
    category: "kitchen",
    wattageRange: { min: 1200, max: 1800 },
    averageWattage: 1500,
    typicalUsageHoursPerDay: 1,
    introFragment: "a standard dishwasher",
    usageNote: "Dishwasher energy use depends on cycle length and whether the unit heats water internally.",
    variabilityFactors: ["heated dry setting", "eco mode", "number of cycles per week"],
  },
  {
    slug: "electric-oven",
    displayName: "Electric Oven",
    category: "kitchen",
    wattageRange: { min: 2000, max: 5000 },
    averageWattage: 3000,
    typicalUsageHoursPerDay: 1,
    introFragment: "an electric oven",
    usageNote: "Electric ovens use high wattage while preheating and then cycle to maintain temperature, so cooking time changes the final cost materially.",
    variabilityFactors: ["preheat duration", "temperature setting", "self-clean cycle usage"],
  },
  {
    slug: "microwave",
    displayName: "Microwave",
    category: "kitchen",
    wattageRange: { min: 600, max: 1500 },
    averageWattage: 1200,
    typicalUsageHoursPerDay: 0.25,
    introFragment: "a household microwave",
    usageNote: "Microwaves draw meaningful power when running, but short cooking times keep total monthly cost relatively low.",
    variabilityFactors: ["daily use frequency", "power setting", "meal prep habits"],
  },
  {
    slug: "gaming-pc",
    displayName: "Gaming PC",
    category: "electronics",
    wattageRange: { min: 300, max: 700 },
    averageWattage: 450,
    typicalUsageHoursPerDay: 4,
    introFragment: "a gaming desktop PC",
    usageNote: "Gaming PC electricity use varies widely with GPU load, monitor setup, and idle time versus active gameplay.",
    variabilityFactors: ["graphics card load", "monitor count", "idle vs gaming time"],
  },
  {
    slug: "electric-vehicle-charger",
    displayName: "Electric Vehicle Charger",
    category: "transport",
    wattageRange: { min: 1400, max: 7600 },
    averageWattage: 7200,
    typicalUsageHoursPerDay: 2,
    introFragment: "a Level 2 home EV charger",
    usageNote: "EV charging cost depends on vehicle efficiency and miles driven, but the underlying electricity rate remains the main lever for charging cost by state.",
    variabilityFactors: ["charger level", "miles driven", "charging schedule"],
  },
  {
    slug: "air-purifier",
    displayName: "Air Purifier",
    category: "climate",
    wattageRange: { min: 25, max: 100 },
    averageWattage: 50,
    typicalUsageHoursPerDay: 8,
    introFragment: "a typical HEPA air purifier",
    usageNote: "Air purifiers run continuously when in use, so daily cost scales with hours of operation. Many models have multiple fan speeds that affect power draw.",
    variabilityFactors: ["fan speed setting", "room size", "filter condition"],
  },
  {
    slug: "dehumidifier",
    displayName: "Dehumidifier",
    category: "climate",
    wattageRange: { min: 300, max: 700 },
    averageWattage: 500,
    typicalUsageHoursPerDay: 6,
    introFragment: "a standard residential dehumidifier",
    usageNote: "Dehumidifiers cycle based on humidity levels, so actual runtime varies by season and climate. Basement and crawl-space units often run longer.",
    variabilityFactors: ["humidity setpoint", "room size", "ambient humidity"],
  },
  {
    slug: "ceiling-fan",
    displayName: "Ceiling Fan",
    category: "climate",
    wattageRange: { min: 50, max: 100 },
    averageWattage: 75,
    typicalUsageHoursPerDay: 12,
    introFragment: "a typical ceiling fan",
    usageNote: "Ceiling fans use relatively low wattage but often run for many hours in summer. Cost is low compared to AC but adds up over cooling season.",
    variabilityFactors: ["fan speed", "blade size", "summer vs winter use"],
  },
  {
    slug: "box-fan",
    displayName: "Box Fan",
    category: "climate",
    wattageRange: { min: 60, max: 150 },
    averageWattage: 100,
    typicalUsageHoursPerDay: 8,
    introFragment: "a standard box fan",
    usageNote: "Box fans draw modest power and are often used for room ventilation or supplementing AC. Runtime varies by season.",
    variabilityFactors: ["fan speed", "room ventilation needs", "seasonal use"],
  },
  {
    slug: "laptop",
    displayName: "Laptop",
    category: "electronics",
    wattageRange: { min: 30, max: 120 },
    averageWattage: 65,
    typicalUsageHoursPerDay: 6,
    introFragment: "a typical laptop computer",
    usageNote: "Laptops use far less power than desktops. Charging cycles and screen brightness affect actual draw; many users leave them plugged in continuously.",
    variabilityFactors: ["screen brightness", "charging vs battery mode", "workload intensity"],
  },
  {
    slug: "television",
    displayName: "Television",
    category: "electronics",
    wattageRange: { min: 50, max: 400 },
    averageWattage: 150,
    typicalUsageHoursPerDay: 5,
    introFragment: "a typical LED/LCD television",
    usageNote: "TV power use depends on screen size and brightness. Modern LED sets use less than older LCD or plasma models. Standby draw adds a small constant load.",
    variabilityFactors: ["screen size", "brightness setting", "streaming vs cable"],
  },
  {
    slug: "toaster-oven",
    displayName: "Toaster Oven",
    category: "kitchen",
    wattageRange: { min: 1200, max: 1800 },
    averageWattage: 1500,
    typicalUsageHoursPerDay: 0.25,
    introFragment: "a standard toaster oven",
    usageNote: "Toaster ovens use high wattage during use but typically run for short periods. More efficient than full-size ovens for small meals.",
    variabilityFactors: ["preheat time", "temperature setting", "daily use frequency"],
  },
  {
    slug: "electric-kettle",
    displayName: "Electric Kettle",
    category: "kitchen",
    wattageRange: { min: 1200, max: 1800 },
    averageWattage: 1500,
    typicalUsageHoursPerDay: 0.25,
    introFragment: "an electric kettle",
    usageNote: "Electric kettles draw high power but run for only a few minutes per use. Very efficient for boiling water compared to stovetop.",
    variabilityFactors: ["boil frequency", "water volume", "keep-warm feature"],
  },
  {
    slug: "coffee-maker",
    displayName: "Coffee Maker",
    category: "kitchen",
    wattageRange: { min: 600, max: 1500 },
    averageWattage: 1000,
    typicalUsageHoursPerDay: 0.5,
    introFragment: "a drip coffee maker",
    usageNote: "Coffee makers use most power during the brew cycle. Models with warming plates add continuous draw; programmable units may have standby consumption.",
    variabilityFactors: ["warming plate use", "brew frequency", "carafe size"],
  },
  {
    slug: "hair-dryer",
    displayName: "Hair Dryer",
    category: "personal",
    wattageRange: { min: 1200, max: 2200 },
    averageWattage: 1800,
    typicalUsageHoursPerDay: 0.25,
    introFragment: "a typical hair dryer",
    usageNote: "Hair dryers use high wattage for short periods. Cost depends on daily use frequency and heat setting.",
    variabilityFactors: ["heat setting", "daily use frequency", "hair length and thickness"],
  },
] as const satisfies readonly ApplianceConfig[];

export type ApplianceSlug = (typeof APPLIANCE_CONFIGS)[number]["slug"];

export const SUPPORTED_APPLIANCE_SLUGS = APPLIANCE_CONFIGS.map((appliance) => appliance.slug) as ApplianceSlug[];

export const FEATURED_APPLIANCE_SLUGS = [
  "refrigerator",
  "space-heater",
  "window-ac",
] as const satisfies readonly ApplianceSlug[];

export function isSupportedApplianceSlug(value: string): value is ApplianceSlug {
  return SUPPORTED_APPLIANCE_SLUGS.includes(value as ApplianceSlug);
}

export function getApplianceConfig(slug: ApplianceSlug): ApplianceConfig {
  const appliance = APPLIANCE_CONFIGS.find((item) => item.slug === slug);
  if (!appliance) {
    throw new Error(`Unsupported appliance slug: ${slug}`);
  }
  return appliance;
}
