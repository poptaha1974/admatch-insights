export type Decision = "KILL" | "FIX" | "SCALE";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type IntegrationMode = "demo" | "manual_csv" | "live_api" | "error";

const API_BASE_URL = import.meta.env.VITE_THINC_API_URL ?? "http://localhost:8000";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = `THINC API error ${res.status}`;
    try {
      const body = await res.json();
      message = body?.error?.message ?? body?.detail?.[0]?.msg ?? body?.detail ?? message;
    } catch {
      // Keep default message.
    }
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }

  return (await res.json()) as T;
}

export type HealthResponse = {
  status: string;
  service: string;
  engine: string;
  mode: string;
};

export type ProductInput = {
  name: string;
  cost: number;
  price: number;
  inventory_units: number;
  category?: string;
  positioning?: string;
  target_market?: string;
};

export type CampaignInput = {
  name: string;
  spend: number;
  meta_leads: number;
  confirmed_orders: number;
  delivered_orders: number;
  returned_orders?: number;
  time_window_days?: number;
  channel?: string;
  objective?: string;
};

export type EconomicsInput = {
  shipping_success_cost?: number;
  shipping_return_cost?: number;
  packaging_cost_per_order?: number;
  overhead?: number;
  vat_rate?: number;
};

export type CampaignAnalysisRequest = {
  product: ProductInput;
  campaign: CampaignInput;
  economics?: EconomicsInput;
};

export type CampaignAnalysisResponse = {
  campaign_name: string;
  product_name: string;
  meta_cpa: number | null;
  real_cpa: number | null;
  confirmation_rate: number;
  delivery_rate: number;
  attribution_gap_pct: number | null;
  revenue: number;
  cogs: number;
  shipping_cost: number;
  packaging_cost: number;
  tax: number;
  total_expenses: number;
  net_profit: number;
  roas: number;
  roi: number;
  thinc_score: number;
  decision: Decision;
  risk_level: RiskLevel;
  blind_spots: string[];
  recommendations: string[];
  mode: "decision_support";
};

export type TheorySummaryResponse = {
  count: number;
  domains: Record<string, number>;
  watermark: string;
};

export type IntegrationStatusItem = {
  integration: string;
  mode: IntegrationMode;
  connected: boolean;
  last_sync_at: string | null;
  message: string;
};

export type IntegrationStatusResponse = {
  items: IntegrationStatusItem[];
};

export type FounderReadinessRequest = {
  execution_score: number;
  discipline_score: number;
  learning_speed_score: number;
  resilience_score: number;
  focus_score: number;
  financial_discipline_score: number;
};

export type FounderReadinessResponse = {
  score: number;
  verdict: string;
  recommendations: string[];
};

export const thincApi = {
  getHealth: () => requestJson<HealthResponse>("/health"),
  getTheorySummary: () => requestJson<TheorySummaryResponse>("/api/theories/summary"),
  getIntegrationStatus: () => requestJson<IntegrationStatusResponse>("/api/integrations/status"),
  analyzeCampaign: (payload: CampaignAnalysisRequest) =>
    requestJson<CampaignAnalysisResponse>("/api/campaign/analyze", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getFounderReadiness: (payload: FounderReadinessRequest) =>
    requestJson<FounderReadinessResponse>("/api/founder/readiness", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
