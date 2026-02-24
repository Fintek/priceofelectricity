export interface ApiStateSummary {
  slug: string;
  name: string;
  avgResidentialRate: number;
  avgMonthlyBill: number;
  affordabilityIndex: number;
  valueScore: number;
  lastUpdated: string;
}

export interface ApiStateDetail extends ApiStateSummary {
  drivers: string[];
  openRateCases: number;
  timelineEvents: number;
}

export interface ApiStatesResponse {
  version: "v1";
  generatedAt: string;
  states: ApiStateSummary[];
}

export interface ApiStateResponse {
  version: "v1";
  generatedAt: string;
  state: ApiStateDetail;
}
