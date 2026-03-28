export type Utility = {
  stateSlug: string;
  slug: string;
  name: string;
  avgRateCentsPerKwh?: number;
};

export const UTILITIES: Utility[] = [
  // Alabama
  { stateSlug: "alabama", slug: "alabama-power", name: "Alabama Power" },
  { stateSlug: "alabama", slug: "huntsville-utilities", name: "Huntsville Utilities" },
  { stateSlug: "alabama", slug: "alagasco-electric", name: "PowerSouth Energy Cooperative" },

  // Alaska
  { stateSlug: "alaska", slug: "chugach-electric", name: "Chugach Electric Association" },
  { stateSlug: "alaska", slug: "matanuska-electric", name: "Matanuska Electric Association" },
  { stateSlug: "alaska", slug: "golden-valley-electric", name: "Golden Valley Electric Association" },

  // Arizona
  { stateSlug: "arizona", slug: "arizona-public-service", name: "Arizona Public Service (APS)" },
  { stateSlug: "arizona", slug: "salt-river-project", name: "Salt River Project (SRP)" },
  { stateSlug: "arizona", slug: "tucson-electric-power", name: "Tucson Electric Power (TEP)" },

  // Arkansas
  { stateSlug: "arkansas", slug: "entergy-arkansas", name: "Entergy Arkansas" },
  { stateSlug: "arkansas", slug: "ozarks-electric", name: "Ozarks Electric Cooperative" },
  { stateSlug: "arkansas", slug: "swepco-arkansas", name: "Southwestern Electric Power Company (SWEPCO)" },

  // California
  { stateSlug: "california", slug: "pg-e", name: "Pacific Gas and Electric (PG&E)", avgRateCentsPerKwh: 32.4 },
  { stateSlug: "california", slug: "southern-california-edison", name: "Southern California Edison (SCE)" },
  { stateSlug: "california", slug: "sdg-e", name: "San Diego Gas & Electric (SDG&E)", avgRateCentsPerKwh: 34.1 },
  { stateSlug: "california", slug: "ladwp", name: "Los Angeles Department of Water and Power (LADWP)" },

  // Colorado
  { stateSlug: "colorado", slug: "xcel-energy-colorado", name: "Xcel Energy (Colorado)" },
  { stateSlug: "colorado", slug: "colorado-springs-utilities", name: "Colorado Springs Utilities" },
  { stateSlug: "colorado", slug: "black-hills-energy-colorado", name: "Black Hills Energy (Colorado)" },

  // Connecticut
  { stateSlug: "connecticut", slug: "eversource-ct", name: "Eversource Energy (Connecticut)" },
  { stateSlug: "connecticut", slug: "united-illuminating", name: "United Illuminating (UI)" },

  // Delaware
  { stateSlug: "delaware", slug: "delmarva-power", name: "Delmarva Power" },
  { stateSlug: "delaware", slug: "delaware-electric-coop", name: "Delaware Electric Cooperative" },

  // Florida
  { stateSlug: "florida", slug: "florida-power-light", name: "Florida Power & Light (FPL)", avgRateCentsPerKwh: 15.0 },
  { stateSlug: "florida", slug: "duke-energy-florida", name: "Duke Energy Florida" },
  { stateSlug: "florida", slug: "tampa-electric", name: "Tampa Electric (TECO)" },
  { stateSlug: "florida", slug: "jea", name: "JEA" },

  // Georgia
  { stateSlug: "georgia", slug: "georgia-power", name: "Georgia Power", avgRateCentsPerKwh: 15.4 },
  { stateSlug: "georgia", slug: "savannah-electric-power", name: "Savannah Electric and Power" },
  { stateSlug: "georgia", slug: "greystone-power", name: "GreyStone Power Corporation" },
  { stateSlug: "georgia", slug: "jackson-emc", name: "Jackson EMC" },

  // Hawaii
  { stateSlug: "hawaii", slug: "hawaiian-electric", name: "Hawaiian Electric (HECO)" },
  { stateSlug: "hawaii", slug: "maui-electric", name: "Maui Electric Company" },
  { stateSlug: "hawaii", slug: "hawaii-electric-light", name: "Hawai'i Electric Light" },

  // Idaho
  { stateSlug: "idaho", slug: "idaho-power", name: "Idaho Power" },
  { stateSlug: "idaho", slug: "avista-idaho", name: "Avista Utilities (Idaho)" },
  { stateSlug: "idaho", slug: "rocky-mountain-power-idaho", name: "Rocky Mountain Power (Idaho)" },

  // Illinois
  { stateSlug: "illinois", slug: "comed", name: "Commonwealth Edison (ComEd)" },
  { stateSlug: "illinois", slug: "ameren-illinois", name: "Ameren Illinois" },
  { stateSlug: "illinois", slug: "midamerican-illinois", name: "MidAmerican Energy (Illinois)" },

  // Indiana
  { stateSlug: "indiana", slug: "duke-energy-indiana", name: "Duke Energy Indiana" },
  { stateSlug: "indiana", slug: "aes-indiana", name: "AES Indiana" },
  { stateSlug: "indiana", slug: "indiana-michigan-power", name: "Indiana Michigan Power (AEP)" },

  // Iowa
  { stateSlug: "iowa", slug: "midamerican-energy-iowa", name: "MidAmerican Energy (Iowa)" },
  { stateSlug: "iowa", slug: "alliant-energy-iowa", name: "Alliant Energy (Iowa)" },
  { stateSlug: "iowa", slug: "iowa-lakes-electric", name: "Iowa Lakes Electric Cooperative" },

  // Kansas
  { stateSlug: "kansas", slug: "evergy-kansas", name: "Evergy (Kansas)" },
  { stateSlug: "kansas", slug: "kansas-gas-electric", name: "Kansas Gas and Electric" },
  { stateSlug: "kansas", slug: "midwest-energy-kansas", name: "Midwest Energy (Kansas)" },

  // Kentucky
  { stateSlug: "kentucky", slug: "kentucky-utilities", name: "Kentucky Utilities (KU)" },
  { stateSlug: "kentucky", slug: "louisville-gas-electric", name: "Louisville Gas and Electric (LG&E)" },
  { stateSlug: "kentucky", slug: "duke-energy-kentucky", name: "Duke Energy Kentucky" },

  // Louisiana
  { stateSlug: "louisiana", slug: "entergy-louisiana", name: "Entergy Louisiana" },
  { stateSlug: "louisiana", slug: "cleco", name: "CLECO" },
  { stateSlug: "louisiana", slug: "swepco-louisiana", name: "Southwestern Electric Power Company (Louisiana)" },

  // Maine
  { stateSlug: "maine", slug: "versant-power", name: "Versant Power" },
  { stateSlug: "maine", slug: "central-maine-power", name: "Central Maine Power" },

  // Maryland
  { stateSlug: "maryland", slug: "bge", name: "Baltimore Gas and Electric (BGE)" },
  { stateSlug: "maryland", slug: "pepco-maryland", name: "Pepco (Maryland)" },
  { stateSlug: "maryland", slug: "delmarva-power-maryland", name: "Delmarva Power (Maryland)" },

  // Massachusetts
  { stateSlug: "massachusetts", slug: "eversource-ma", name: "Eversource Energy (Massachusetts)" },
  { stateSlug: "massachusetts", slug: "national-grid-ma", name: "National Grid (Massachusetts)" },
  { stateSlug: "massachusetts", slug: "unitil-ma", name: "Unitil (Massachusetts)" },

  // Michigan
  { stateSlug: "michigan", slug: "dte-energy", name: "DTE Energy" },
  { stateSlug: "michigan", slug: "consumers-energy", name: "Consumers Energy" },
  { stateSlug: "michigan", slug: "indiana-michigan-power-mi", name: "Indiana Michigan Power (Michigan)" },

  // Minnesota
  { stateSlug: "minnesota", slug: "xcel-energy-minnesota", name: "Xcel Energy (Minnesota)" },
  { stateSlug: "minnesota", slug: "minnesota-power", name: "Minnesota Power" },
  { stateSlug: "minnesota", slug: "otter-tail-power", name: "Otter Tail Power Company" },

  // Mississippi
  { stateSlug: "mississippi", slug: "entergy-mississippi", name: "Entergy Mississippi" },
  { stateSlug: "mississippi", slug: "mississippi-power", name: "Mississippi Power" },
  { stateSlug: "mississippi", slug: "coast-electric-power", name: "Coast Electric Power Association" },

  // Missouri
  { stateSlug: "missouri", slug: "ameren-missouri", name: "Ameren Missouri" },
  { stateSlug: "missouri", slug: "evergy-missouri", name: "Evergy (Missouri)" },
  { stateSlug: "missouri", slug: "empire-district-electric", name: "Empire District Electric (Liberty)" },

  // Montana
  { stateSlug: "montana", slug: "northwestern-energy-mt", name: "NorthWestern Energy (Montana)" },
  { stateSlug: "montana", slug: "flathead-electric", name: "Flathead Electric Cooperative" },
  { stateSlug: "montana", slug: "montana-dakota-utilities", name: "Montana-Dakota Utilities" },

  // Nebraska
  { stateSlug: "nebraska", slug: "oppd", name: "Omaha Public Power District (OPPD)" },
  { stateSlug: "nebraska", slug: "nppd", name: "Nebraska Public Power District (NPPD)" },
  { stateSlug: "nebraska", slug: "lincoln-electric-system", name: "Lincoln Electric System" },

  // Nevada
  { stateSlug: "nevada", slug: "nv-energy", name: "NV Energy" },
  { stateSlug: "nevada", slug: "valley-electric-association", name: "Valley Electric Association" },

  // New Hampshire
  { stateSlug: "new-hampshire", slug: "eversource-nh", name: "Eversource Energy (New Hampshire)" },
  { stateSlug: "new-hampshire", slug: "liberty-utilities-nh", name: "Liberty Utilities (New Hampshire)" },
  { stateSlug: "new-hampshire", slug: "unitil-nh", name: "Unitil (New Hampshire)" },

  // New Jersey
  { stateSlug: "new-jersey", slug: "pseg", name: "Public Service Electric and Gas (PSE&G)" },
  { stateSlug: "new-jersey", slug: "jcp-l", name: "Jersey Central Power & Light (JCP&L)" },
  { stateSlug: "new-jersey", slug: "atlantic-city-electric", name: "Atlantic City Electric" },

  // New Mexico
  { stateSlug: "new-mexico", slug: "pnm", name: "Public Service Company of New Mexico (PNM)" },
  { stateSlug: "new-mexico", slug: "el-paso-electric-nm", name: "El Paso Electric (New Mexico)" },
  { stateSlug: "new-mexico", slug: "xcel-energy-nm", name: "Xcel Energy (New Mexico)" },

  // New York
  { stateSlug: "new-york", slug: "con-edison", name: "Con Edison", avgRateCentsPerKwh: 24.6 },
  { stateSlug: "new-york", slug: "national-grid-ny", name: "National Grid (New York)" },
  { stateSlug: "new-york", slug: "nyseg", name: "NYSEG" },
  { stateSlug: "new-york", slug: "rge", name: "Rochester Gas and Electric (RG&E)" },

  // North Carolina
  { stateSlug: "north-carolina", slug: "duke-energy-carolinas", name: "Duke Energy Carolinas" },
  { stateSlug: "north-carolina", slug: "duke-energy-progress-nc", name: "Duke Energy Progress (North Carolina)" },
  { stateSlug: "north-carolina", slug: "dominion-energy-nc", name: "Dominion Energy North Carolina" },

  // North Dakota
  { stateSlug: "north-dakota", slug: "montana-dakota-utilities-nd", name: "Montana-Dakota Utilities (North Dakota)" },
  { stateSlug: "north-dakota", slug: "xcel-energy-nd", name: "Xcel Energy (North Dakota)" },
  { stateSlug: "north-dakota", slug: "nodak-electric", name: "Nodak Electric Cooperative" },

  // Ohio
  { stateSlug: "ohio", slug: "aep-ohio", name: "AEP Ohio" },
  { stateSlug: "ohio", slug: "duke-energy-ohio", name: "Duke Energy Ohio" },
  { stateSlug: "ohio", slug: "firstenergy-ohio-edison", name: "FirstEnergy Ohio Edison" },
  { stateSlug: "ohio", slug: "dayton-power-light", name: "Dayton Power & Light (AES Ohio)" },

  // Oklahoma
  { stateSlug: "oklahoma", slug: "oge-energy", name: "OG&E Energy (Oklahoma Gas and Electric)" },
  { stateSlug: "oklahoma", slug: "public-service-oklahoma", name: "Public Service Company of Oklahoma (PSO)" },
  { stateSlug: "oklahoma", slug: "oklahoma-electric-coop", name: "Oklahoma Electric Cooperative" },

  // Oregon
  { stateSlug: "oregon", slug: "portland-general-electric", name: "Portland General Electric (PGE)" },
  { stateSlug: "oregon", slug: "pacificorp-oregon", name: "PacifiCorp (Pacific Power Oregon)" },
  { stateSlug: "oregon", slug: "eugene-water-electric", name: "Eugene Water & Electric Board (EWEB)" },

  // Pennsylvania
  { stateSlug: "pennsylvania", slug: "penelec", name: "Penelec" },
  { stateSlug: "pennsylvania", slug: "duquesne-light", name: "Duquesne Light Company" },
  { stateSlug: "pennsylvania", slug: "peco", name: "PECO" },
  { stateSlug: "pennsylvania", slug: "ppl-electric", name: "PPL Electric Utilities" },

  // Rhode Island
  { stateSlug: "rhode-island", slug: "rhode-island-energy", name: "Rhode Island Energy" },
  { stateSlug: "rhode-island", slug: "block-island-power", name: "Block Island Power Company" },

  // South Carolina
  { stateSlug: "south-carolina", slug: "duke-energy-progress-sc", name: "Duke Energy Progress (South Carolina)" },
  { stateSlug: "south-carolina", slug: "dominion-energy-sc", name: "Dominion Energy South Carolina" },
  { stateSlug: "south-carolina", slug: "santee-cooper", name: "Santee Cooper" },

  // South Dakota
  { stateSlug: "south-dakota", slug: "northwestern-energy-sd", name: "NorthWestern Energy (South Dakota)" },
  { stateSlug: "south-dakota", slug: "xcel-energy-sd", name: "Xcel Energy (South Dakota)" },
  { stateSlug: "south-dakota", slug: "black-hills-energy-sd", name: "Black Hills Energy (South Dakota)" },

  // Tennessee
  { stateSlug: "tennessee", slug: "tva", name: "Tennessee Valley Authority (TVA)" },
  { stateSlug: "tennessee", slug: "nashville-electric-service", name: "Nashville Electric Service" },
  { stateSlug: "tennessee", slug: "memphis-light-gas-water", name: "Memphis Light, Gas and Water" },

  // Texas
  { stateSlug: "texas", slug: "oncor", name: "Oncor Electric Delivery" },
  { stateSlug: "texas", slug: "centerpoint-energy", name: "CenterPoint Energy (Texas Electric)" },
  { stateSlug: "texas", slug: "aep-texas", name: "AEP Texas" },
  { stateSlug: "texas", slug: "tnmp", name: "Texas-New Mexico Power (TNMP)" },

  // Utah
  { stateSlug: "utah", slug: "rocky-mountain-power-utah", name: "Rocky Mountain Power (Utah)" },
  { stateSlug: "utah", slug: "murray-city-power", name: "Murray City Power" },

  // Vermont
  { stateSlug: "vermont", slug: "green-mountain-power", name: "Green Mountain Power" },
  { stateSlug: "vermont", slug: "vermont-electric-coop", name: "Vermont Electric Cooperative" },

  // Virginia
  { stateSlug: "virginia", slug: "dominion-energy-virginia", name: "Dominion Energy Virginia" },
  { stateSlug: "virginia", slug: "appalachian-power-va", name: "Appalachian Power (Virginia)" },
  { stateSlug: "virginia", slug: "rappahannock-electric", name: "Rappahannock Electric Cooperative" },

  // Washington
  { stateSlug: "washington", slug: "puget-sound-energy", name: "Puget Sound Energy" },
  { stateSlug: "washington", slug: "seattle-city-light", name: "Seattle City Light" },
  { stateSlug: "washington", slug: "avista-washington", name: "Avista Utilities (Washington)" },

  // West Virginia
  { stateSlug: "west-virginia", slug: "appalachian-power-wv", name: "Appalachian Power (West Virginia)" },
  { stateSlug: "west-virginia", slug: "mon-power", name: "Mon Power" },
  { stateSlug: "west-virginia", slug: "wheeling-power", name: "Wheeling Power" },

  // Wisconsin
  { stateSlug: "wisconsin", slug: "we-energies", name: "We Energies" },
  { stateSlug: "wisconsin", slug: "alliant-energy-wisconsin", name: "Alliant Energy (Wisconsin)" },
  { stateSlug: "wisconsin", slug: "madison-gas-electric", name: "Madison Gas and Electric" },

  // Wyoming
  { stateSlug: "wyoming", slug: "rocky-mountain-power-wyoming", name: "Rocky Mountain Power (Wyoming)" },
  { stateSlug: "wyoming", slug: "black-hills-energy-wyoming", name: "Black Hills Energy (Wyoming)" },
  { stateSlug: "wyoming", slug: "lower-valley-energy", name: "Lower Valley Energy" },
];

export function getUtilitiesByState(stateSlug: string): Utility[] {
  return UTILITIES.filter((utility) => utility.stateSlug === stateSlug);
}

export function getUtility(stateSlug: string, utilitySlug: string): Utility | null {
  return UTILITIES.find(
    (utility) => utility.stateSlug === stateSlug && utility.slug === utilitySlug,
  ) ?? null;
}
