export const META_GRAPH_BASE = "https://graph.facebook.com";
export const DEFAULT_META_API_VERSION = "v21.0";

export type AppEnv = Record<string, unknown>;

export type DiagnosticsThresholds = {
  minEvidenceSpend: number;
  highCtrAllThreshold: number;
  lowOutboundCtrThreshold: number;
  lpvRateThreshold: number;
  minOutboundForLpvCheck: number;
  minLpvForTrackingCheck: number;
  minLpvForIntentCheck: number;
  minAtcRateFromLpv: number;
};

export type Provenance = {
  adAccountId: string | null;
  campaignId: string | null;
  adSetId: string | null;
  adIds: string[];
  timeRange: { since: string | null; until: string | null; preset: string | null };
  accountTimezone: string | null;
  dataFetchedAt: string;
  apiVersion: string;
  source: "meta_graph_api" | "meta_graph_api_unavailable";
  rawIncluded: boolean;
};

export type NormalizedInsights = {
  id: string;
  name: string | null;
  level: "campaign" | "adset" | "ad";
  effectiveStatus: string | null;
  configuredStatus: string | null;
  objective: string | null;
  optimizationGoal: string | null;
  attributionSetting: string | null;
  accountId: string | null;
  accountTimezoneName: string | null;
  dateStart: string | null;
  dateStop: string | null;
  dataFetchedAt: string;
  metrics: Record<string, number | null>;
  provenance: Provenance;
  raw: Record<string, unknown>;
};

const FALLBACK_THRESHOLDS: DiagnosticsThresholds = {
  minEvidenceSpend: 150,
  highCtrAllThreshold: 5,
  lowOutboundCtrThreshold: 1,
  lpvRateThreshold: 70,
  minOutboundForLpvCheck: 30,
  minLpvForTrackingCheck: 50,
  minLpvForIntentCheck: 100,
  minAtcRateFromLpv: 0.05,
};

function readEnv(env: AppEnv, key: string): string | undefined {
  const fromEnv = env[key];
  if (typeof fromEnv === "string" && fromEnv.length > 0) return fromEnv;
  if (typeof process !== "undefined" && process.env) {
    const fromProcess = process.env[key];
    if (typeof fromProcess === "string" && fromProcess.length > 0) return fromProcess;
  }
  return undefined;
}

export function getMetaConfig(env: AppEnv) {
  const apiVersion = readEnv(env, "META_API_VERSION") ?? DEFAULT_META_API_VERSION;
  const accessToken = readEnv(env, "META_ACCESS_TOKEN");
  const adAccountId = readEnv(env, "META_AD_ACCOUNT_ID") ?? null;
  const campaignId = readEnv(env, "META_CAMPAIGN_ID") ?? null;

  return {
    apiVersion,
    accessToken,
    adAccountId,
    campaignId,
    graphBase: `${META_GRAPH_BASE}/${apiVersion}`,
  };
}

export function getDiagnosticsThresholds(env: AppEnv): DiagnosticsThresholds {
  const raw = readEnv(env, "DIAGNOSTIC_THRESHOLDS_JSON");
  if (!raw) return FALLBACK_THRESHOLDS;
  try {
    const parsed = JSON.parse(raw) as Partial<DiagnosticsThresholds>;
    return { ...FALLBACK_THRESHOLDS, ...parsed };
  } catch {
    return FALLBACK_THRESHOLDS;
  }
}

export function getMetaDateRange(requestUrl: URL) {
  const since = requestUrl.searchParams.get("since");
  const until = requestUrl.searchParams.get("until");
  const preset = requestUrl.searchParams.get("date_preset") ?? "last_3d";
  return { since, until, preset };
}

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function firstNumeric(value: unknown): number | null {
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0] as Record<string, unknown>;
    return asNumber(first.value);
  }
  return null;
}

function firstByType(items: unknown, expected: string[]): number | null {
  if (!Array.isArray(items)) return null;
  const expectedSet = new Set(expected);
  const found = (items as Array<Record<string, unknown>>).find((item) => {
    const actionType = String(item.action_type ?? "");
    if (expectedSet.has(actionType)) return true;
    return expected.some((v) => actionType.endsWith(v));
  });
  return found ? asNumber(found.value) : null;
}

function metricMap(raw: Record<string, unknown>) {
  const actions = raw.actions;
  const actionValues = raw.action_values;
  const cpat = raw.cost_per_action_type;
  const roas = raw.website_purchase_roas;

  return {
    spend: asNumber(raw.spend),
    impressions: asNumber(raw.impressions),
    reach: asNumber(raw.reach),
    frequency: asNumber(raw.frequency),
    cpm: asNumber(raw.cpm),
    clicks: asNumber(raw.clicks),
    ctr: asNumber(raw.ctr),
    inline_link_clicks: asNumber(raw.inline_link_clicks),
    inline_link_click_ctr: asNumber(raw.inline_link_click_ctr),
    cost_per_inline_link_click: asNumber(raw.cost_per_inline_link_click),
    outbound_clicks: firstNumeric(raw.outbound_clicks),
    outbound_clicks_ctr: firstNumeric(raw.outbound_clicks_ctr),
    cost_per_outbound_click: asNumber(raw.cost_per_outbound_click),
    landing_page_views: firstByType(actions, ["landing_page_view"]),
    cost_per_landing_page_view: firstByType(cpat, ["landing_page_view"]),
    view_content: firstByType(actions, ["view_content"]),
    add_to_cart: firstByType(actions, ["add_to_cart", "offsite_conversion.fb_pixel_add_to_cart"]),
    cost_per_add_to_cart: firstByType(cpat, [
      "add_to_cart",
      "offsite_conversion.fb_pixel_add_to_cart",
    ]),
    initiate_checkout: firstByType(actions, [
      "initiate_checkout",
      "offsite_conversion.fb_pixel_initiate_checkout",
    ]),
    cost_per_initiate_checkout: firstByType(cpat, [
      "initiate_checkout",
      "offsite_conversion.fb_pixel_initiate_checkout",
    ]),
    purchases: firstByType(actions, ["purchase", "offsite_conversion.fb_pixel_purchase"]),
    cost_per_purchase: firstByType(cpat, ["purchase", "offsite_conversion.fb_pixel_purchase"]),
    purchase_conversion_value: firstByType(actionValues, ["purchase", "omni_purchase"]),
    purchase_roas: firstNumeric(roas),
  };
}

export async function fetchMetaGraph(
  env: AppEnv,
  endpoint: string,
  params: Record<string, string> = {},
): Promise<Record<string, unknown>> {
  const config = getMetaConfig(env);
  if (!config.accessToken) {
    throw new Error("META_ACCESS_TOKEN is not configured");
  }

  const url = new URL(`${config.graphBase}/${endpoint.replace(/^\//, "")}`);
  url.searchParams.set("access_token", config.accessToken);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok || payload.error) {
    const err = (payload.error as Record<string, unknown> | undefined) ?? {};
    const message =
      (typeof err.message === "string" && err.message) ||
      `Meta API request failed with HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export async function fetchMetaStatus(env: AppEnv) {
  const cfg = getMetaConfig(env);
  if (!cfg.accessToken) {
    return {
      connected: false,
      reason: "META_ACCESS_TOKEN missing",
      adAccountId: cfg.adAccountId,
      campaignId: cfg.campaignId,
      apiVersion: cfg.apiVersion,
    };
  }

  const me = await fetchMetaGraph(env, "me", { fields: "id,name" });
  return {
    connected: true,
    reason: null,
    adAccountId: cfg.adAccountId,
    campaignId: cfg.campaignId,
    apiVersion: cfg.apiVersion,
    actor: { id: me.id ?? null, name: me.name ?? null },
  };
}

export function normalizeInsights(
  level: "campaign" | "adset" | "ad",
  raw: Record<string, unknown>,
  requestUrl: URL,
  env: AppEnv,
  defaults?: Partial<NormalizedInsights>,
): NormalizedInsights {
  const fetchedAt = new Date().toISOString();
  const cfg = getMetaConfig(env);
  const dateRange = getMetaDateRange(requestUrl);

  return {
    id: String(raw[level === "campaign" ? "campaign_id" : "id"] ?? defaults?.id ?? ""),
    name:
      (raw[`${level}_name`] as string | undefined) ??
      (raw.name as string | undefined) ??
      defaults?.name ??
      null,
    level,
    effectiveStatus: (defaults?.effectiveStatus ?? raw.effective_status ?? null) as string | null,
    configuredStatus: (defaults?.configuredStatus ?? raw.configured_status ?? null) as
      string | null,
    objective: (defaults?.objective ?? raw.objective ?? null) as string | null,
    optimizationGoal: (defaults?.optimizationGoal ?? raw.optimization_goal ?? null) as
      string | null,
    attributionSetting: (defaults?.attributionSetting ?? raw.attribution_setting ?? null) as
      string | null,
    accountId: (defaults?.accountId ?? raw.account_id ?? cfg.adAccountId ?? null) as string | null,
    accountTimezoneName: (defaults?.accountTimezoneName ?? raw.account_timezone_name ?? null) as
      string | null,
    dateStart: (raw.date_start as string | undefined) ?? null,
    dateStop: (raw.date_stop as string | undefined) ?? null,
    dataFetchedAt: fetchedAt,
    metrics: metricMap(raw),
    provenance: {
      adAccountId: (defaults?.accountId ?? raw.account_id ?? cfg.adAccountId ?? null) as
        string | null,
      campaignId:
        level === "campaign"
          ? String(raw.campaign_id ?? defaults?.id ?? cfg.campaignId ?? "") || null
          : ((raw.campaign_id as string | null) ?? cfg.campaignId),
      adSetId:
        (raw.adset_id as string | null) ??
        (level === "adset" ? String(raw.id ?? defaults?.id ?? "") : null),
      adIds:
        level === "ad" ? [String(raw.ad_id ?? raw.id ?? defaults?.id ?? "")].filter(Boolean) : [],
      timeRange: {
        since: dateRange.since,
        until: dateRange.until,
        preset: dateRange.preset,
      },
      accountTimezone: (defaults?.accountTimezoneName ?? raw.account_timezone_name ?? null) as
        string | null,
      dataFetchedAt: fetchedAt,
      apiVersion: cfg.apiVersion,
      source: "meta_graph_api",
      rawIncluded: true,
    },
    raw,
  };
}

export type DiagnosticFlag = {
  ruleId: string;
  label: string;
  status: "verified" | "hypothesis";
  severity: "high" | "medium" | "low";
  reason: string;
};

export type DiagnosticResult = {
  confidence: "High Confidence" | "Medium Confidence" | "Low Confidence" | "Insufficient Data";
  adLabels: Array<{ adId: string; adName: string | null; labels: string[] }>;
  flags: DiagnosticFlag[];
};

export function runDiagnostics(
  campaign: NormalizedInsights | null,
  ads: NormalizedInsights[],
  thresholds: DiagnosticsThresholds,
): DiagnosticResult {
  const flags: DiagnosticFlag[] = [];
  const adLabels: Array<{ adId: string; adName: string | null; labels: string[] }> = [];

  for (const ad of ads) {
    const m = ad.metrics;
    const labels: string[] = [];

    const spend = m.spend ?? 0;
    if (spend < thresholds.minEvidenceSpend) {
      labels.push("INSUFFICIENT_DATA");
    }

    const ctrAll = m.ctr ?? 0;
    const outboundCtr = m.outbound_clicks_ctr ?? 0;
    if (
      ctrAll >= thresholds.highCtrAllThreshold &&
      outboundCtr <= thresholds.lowOutboundCtrThreshold
    ) {
      labels.push("CURIOSITY_NOT_SITE_INTENT");
      flags.push({
        ruleId: "R-CUR-01",
        label: "Curiosity Hook",
        status: "hypothesis",
        severity: "medium",
        reason: `Ad ${ad.name ?? ad.id}: CTR(All)=${ctrAll.toFixed(2)}% بينما Outbound CTR=${outboundCtr.toFixed(2)}%`,
      });
    }

    const outbound = m.outbound_clicks ?? 0;
    const lpv = m.landing_page_views ?? 0;
    const lpvRate = outbound > 0 ? (lpv / outbound) * 100 : null;
    if (
      outbound >= thresholds.minOutboundForLpvCheck &&
      lpvRate !== null &&
      lpvRate < thresholds.lpvRateThreshold
    ) {
      flags.push({
        ruleId: "R-LPV-01",
        label: "Landing Page Drop",
        status: "hypothesis",
        severity: "medium",
        reason: `Ad ${ad.name ?? ad.id}: LPV rate=${lpvRate.toFixed(1)}% من Outbound Clicks`,
      });
    }

    const atc = m.add_to_cart ?? 0;
    const ic = m.initiate_checkout ?? 0;
    if (lpv >= thresholds.minLpvForTrackingCheck && (atc === 0 || ic === 0)) {
      flags.push({
        ruleId: "R-TRACK-01",
        label: "Tracking/Page Friction Suspected",
        status: "hypothesis",
        severity: "high",
        reason: `Ad ${ad.name ?? ad.id}: LPV=${lpv}, ATC=${atc}, IC=${ic}. افحص Pixel/Test Events/Dedup/Checkout`,
      });
    }

    const atcRate = lpv > 0 ? atc / lpv : 0;
    if (lpv >= thresholds.minLpvForIntentCheck && atcRate < thresholds.minAtcRateFromLpv) {
      flags.push({
        ruleId: "R-OFFER-01",
        label: "Strong Traffic, Weak Intent",
        status: "hypothesis",
        severity: "medium",
        reason: `Ad ${ad.name ?? ad.id}: LPV=${lpv} مع ATC rate=${(atcRate * 100).toFixed(2)}%`,
      });
    }

    if ((m.purchases ?? 0) <= 0) {
      labels.push("NOT_SALES_WINNER_YET");
    }

    adLabels.push({ adId: ad.id, adName: ad.name, labels });
  }

  const campaignSpend = campaign?.metrics.spend ?? 0;
  const campaignPurchase = campaign?.metrics.purchases ?? 0;
  const confidence: DiagnosticResult["confidence"] =
    campaignSpend < thresholds.minEvidenceSpend
      ? "Insufficient Data"
      : campaignPurchase > 0
        ? "Medium Confidence"
        : "Low Confidence";

  return { confidence, adLabels, flags };
}

export function safeMetric(value: number | null): string {
  return value === null ? "—" : Number.isFinite(value) ? String(value) : "—";
}
