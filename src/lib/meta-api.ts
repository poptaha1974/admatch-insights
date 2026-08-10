/**
 * Meta Marketing API handler — server-side only.
 * Called from server.ts to handle /api/meta/* requests.
 * Access tokens are read from Cloudflare Worker env vars, never returned to the client.
 */

export const META_API_VERSION = "v21.0";
export const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

/** Regex for a valid YYYY-MM-DD date string */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type MetaEnv = {
  META_ACCESS_TOKEN?: string;
  META_ACCOUNT_ID?: string;
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function metaFetchOptions(token: string): RequestInit {
  return {
    headers: { Authorization: ["Bearer", token].join(" ") },
    signal: AbortSignal.timeout(20000),
  };
}

type ActionItem = { action_type: string; value: string };

function parseAction(arr: ActionItem[] | undefined, type: string): number | undefined {
  const item = arr?.find((a) => a.action_type === type);
  return item ? parseFloat(item.value) : undefined;
}

function numOrUndef(v: string | undefined): number | undefined {
  if (v == null || v === "") return undefined;
  const n = parseFloat(v);
  return isNaN(n) ? undefined : n;
}

function outboundVal(
  arr: Array<{ action_type: string; value: string }> | undefined,
): number | undefined {
  const item = arr?.find(
    (x) => x.action_type === "outbound_click" || x.action_type === "link_click",
  );
  return item ? parseFloat(item.value) : undefined;
}

const AD_INSIGHT_FIELDS = [
  "ad_id","ad_name","adset_id","adset_name","campaign_id","campaign_name",
  "account_id","account_currency","date_start","date_stop",
  "spend","impressions","reach","frequency","cpm",
  "clicks","ctr",
  "inline_link_clicks","inline_link_click_ctr","cost_per_inline_link_click",
  "outbound_clicks","outbound_clicks_ctr","cost_per_outbound_click",
  "landing_page_views","cost_per_landing_page_view",
  "actions","action_values","cost_per_action_type","website_purchase_roas",
].join(",");

type RawInsight = Record<string, unknown>;

function normalizeInsight(raw: RawInsight, fetchedAt: string) {
  const actions = raw.actions as ActionItem[] | undefined;
  const actionValues = raw.action_values as ActionItem[] | undefined;
  const costPerAction = raw.cost_per_action_type as ActionItem[] | undefined;
  const roas = raw.website_purchase_roas as Array<{ action_type: string; value: string }> | undefined;

  return {
    id: (raw.ad_id as string) ?? "",
    name: (raw.ad_name as string) ?? "",
    adset_id: raw.adset_id as string | undefined,
    adset_name: raw.adset_name as string | undefined,
    campaign_id: raw.campaign_id as string | undefined,
    campaign_name: raw.campaign_name as string | undefined,
    account_id: raw.account_id as string | undefined,
    date_start: raw.date_start as string | undefined,
    date_stop: raw.date_stop as string | undefined,
    spend: numOrUndef(raw.spend as string | undefined),
    impressions: numOrUndef(raw.impressions as string | undefined),
    reach: numOrUndef(raw.reach as string | undefined),
    frequency: numOrUndef(raw.frequency as string | undefined),
    cpm: numOrUndef(raw.cpm as string | undefined),
    clicks: numOrUndef(raw.clicks as string | undefined),
    ctr: numOrUndef(raw.ctr as string | undefined),
    inline_link_clicks: numOrUndef(raw.inline_link_clicks as string | undefined),
    inline_link_click_ctr: numOrUndef(raw.inline_link_click_ctr as string | undefined),
    cost_per_inline_link_click: numOrUndef(raw.cost_per_inline_link_click as string | undefined),
    outbound_clicks: outboundVal(raw.outbound_clicks as Array<{ action_type: string; value: string }> | undefined),
    outbound_clicks_ctr: outboundVal(raw.outbound_clicks_ctr as Array<{ action_type: string; value: string }> | undefined),
    cost_per_outbound_click: outboundVal(raw.cost_per_outbound_click as Array<{ action_type: string; value: string }> | undefined),
    landing_page_views: numOrUndef(raw.landing_page_views as string | undefined),
    cost_per_landing_page_view: numOrUndef(raw.cost_per_landing_page_view as string | undefined),
    view_content: parseAction(actions, "view_content"),
    add_to_cart: parseAction(actions, "add_to_cart"),
    cost_per_add_to_cart: parseAction(costPerAction, "add_to_cart"),
    initiate_checkout: parseAction(actions, "initiate_checkout"),
    cost_per_initiate_checkout: parseAction(costPerAction, "initiate_checkout"),
    purchases: parseAction(actions, "purchase"),
    purchase_conversion_value: parseAction(actionValues, "purchase"),
    cost_per_purchase: parseAction(costPerAction, "purchase"),
    purchase_roas: roas?.[0] ? parseFloat(roas[0].value) : undefined,
    data_fetched_at: fetchedAt,
  };
}

/**
 * Deterministic ad classification based on full-funnel evidence.
 * Rule: No commercial winner without ATC/IC/Purchase evidence (see Rule 2 in issue).
 */
function classifyAd(insight: ReturnType<typeof normalizeInsight>): string {
  const spend = insight.spend ?? 0;
  const lpv = insight.landing_page_views ?? 0;
  const atc = insight.add_to_cart ?? 0;
  const ic = insight.initiate_checkout ?? 0;
  const purchases = insight.purchases ?? 0;

  if (spend < 20) return "INSUFFICIENT_DATA";
  // Require both ATC and IC corroboration before declaring SALES_WINNER_CANDIDATE
  if (purchases > 0 && atc > 0 && ic > 0) return "SALES_WINNER_CANDIDATE";
  if (purchases > 0) return "PURCHASE_WITHOUT_FULL_FUNNEL_EVIDENCE";
  if (ic > 0 && atc > 0) return "INTENT_LEADER";
  if (atc > 0 && lpv >= 10) {
    if (lpv >= 50 && ic === 0) return "TRACKING_SUSPECTED_HIGH_ATC";
    return "PROMISING_INTENT_INSUFFICIENT_SAMPLE";
  }
  if (lpv >= 50 && atc === 0) return "TRACKING_OR_PAGE_FRICTION";
  if (lpv > 0 && atc === 0) return "ATTENTION_WINNER_ONLY";
  return "INSUFFICIENT_DATA";
}

async function handleStatus(env: MetaEnv): Promise<Response> {
  const token = env.META_ACCESS_TOKEN;
  const accountId = env.META_ACCOUNT_ID;
  const checkedAt = new Date().toISOString();

  if (!token) {
    return json({ meta: { connected: false, error: "META_ACCESS_TOKEN not configured", checkedAt } });
  }

  try {
    const endpoint = accountId
      ? `${META_API_BASE}/act_${accountId}?fields=id,name,account_status`
      : `${META_API_BASE}/me`;

    const res = await fetch(endpoint, { ...metaFetchOptions(token), signal: AbortSignal.timeout(8000) });
    const data = await res.json() as { error?: { message: string } };

    if (!res.ok || data.error) {
      return json({ meta: { connected: false, error: data.error?.message ?? `HTTP ${res.status}`, checkedAt } });
    }
    return json({ meta: { connected: true, checkedAt, accountId } });
  } catch (err) {
    return json({ meta: { connected: false, error: err instanceof Error ? err.message : "Network error", checkedAt } });
  }
}

async function handleCampaigns(env: MetaEnv): Promise<Response> {
  const token = env.META_ACCESS_TOKEN;
  const accountId = env.META_ACCOUNT_ID;
  const fetchedAt = new Date().toISOString();

  if (!token || !accountId) {
    return json({ error: "META_ACCESS_TOKEN or META_ACCOUNT_ID not configured", fetchedAt }, 503);
  }

  const fields = "id,name,objective,effective_status,configured_status";
  const url = `${META_API_BASE}/act_${accountId}/campaigns?fields=${encodeURIComponent(fields)}&limit=50`;

  try {
    const res = await fetch(url, { ...metaFetchOptions(token), signal: AbortSignal.timeout(12000) });
    const data = await res.json() as {
      data?: Array<{ id: string; name: string; objective?: string; effective_status?: string; configured_status?: string }>;
      error?: { message: string };
    };

    if (!res.ok || data.error) {
      return json({ error: data.error?.message ?? `Meta API HTTP ${res.status}`, fetchedAt }, 502);
    }

    return json({
      campaigns: (data.data ?? []).map((c) => ({
        id: c.id, name: c.name, objective: c.objective,
        effective_status: c.effective_status, configured_status: c.configured_status,
      })),
      account_id: accountId,
      api_version: META_API_VERSION,
      fetched_at: fetchedAt,
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Network error", fetchedAt }, 502);
  }
}

async function handleCampaignInsights(
  campaignId: string,
  env: MetaEnv,
  reqUrl: URL,
): Promise<Response> {
  const token = env.META_ACCESS_TOKEN;
  const fetchedAt = new Date().toISOString();

  if (!token) {
    return json({ error: "META_ACCESS_TOKEN not configured", fetchedAt }, 503);
  }

  const datePreset = reqUrl.searchParams.get("date_preset") ?? "last_30d";
  const rawSince = reqUrl.searchParams.get("since") ?? "";
  const rawUntil = reqUrl.searchParams.get("until") ?? "";

  // Validate date params strictly before use to prevent injection
  const validSince = DATE_RE.test(rawSince) ? rawSince : null;
  const validUntil = DATE_RE.test(rawUntil) ? rawUntil : null;

  const timeParam =
    validSince && validUntil
      ? `time_range=${encodeURIComponent(JSON.stringify({ since: validSince, until: validUntil }))}`
      : `date_preset=${encodeURIComponent(datePreset)}`;

  const insightsUrl =
    `${META_API_BASE}/${encodeURIComponent(campaignId)}/insights` +
    `?level=ad` +
    `&fields=${encodeURIComponent(AD_INSIGHT_FIELDS)}` +
    `&${timeParam}` +
    `&limit=50`;

  try {
    const res = await fetch(insightsUrl, metaFetchOptions(token));
    const data = await res.json() as { data?: unknown[]; error?: { message: string } };

    if (!res.ok || data.error) {
      return json({ error: data.error?.message ?? `Meta API HTTP ${res.status}`, fetchedAt }, 502);
    }

    const normalized = (data.data ?? []).map((raw) => {
      const insight = normalizeInsight(raw as RawInsight, fetchedAt);
      return { ...insight, label: classifyAd(insight) };
    });
    const first = normalized[0];

    return json({
      campaign_id: campaignId,
      campaign_name: first?.campaign_name,
      account_id: env.META_ACCOUNT_ID ?? first?.account_id,
      date_start: first?.date_start,
      date_stop: first?.date_stop,
      account_timezone: "Africa/Cairo",
      api_version: META_API_VERSION,
      fetched_at: fetchedAt,
      ads: normalized,
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Network error", fetchedAt }, 502);
  }
}

async function handleAdInsights(adId: string, env: MetaEnv, reqUrl: URL): Promise<Response> {
  const token = env.META_ACCESS_TOKEN;
  const fetchedAt = new Date().toISOString();

  if (!token) {
    return json({ error: "META_ACCESS_TOKEN not configured", fetchedAt }, 503);
  }

  const datePreset = reqUrl.searchParams.get("date_preset") ?? "last_30d";
  const insightsUrl =
    `${META_API_BASE}/${encodeURIComponent(adId)}/insights` +
    `?fields=${encodeURIComponent(AD_INSIGHT_FIELDS)}` +
    `&date_preset=${encodeURIComponent(datePreset)}`;

  try {
    const res = await fetch(insightsUrl, metaFetchOptions(token));
    const data = await res.json() as { data?: unknown[]; error?: { message: string } };

    if (!res.ok || data.error) {
      return json({ error: data.error?.message ?? `Meta API HTTP ${res.status}`, fetchedAt }, 502);
    }

    const normalized = (data.data ?? []).map((raw) => {
      const insight = normalizeInsight(raw as RawInsight, fetchedAt);
      return { ...insight, label: classifyAd(insight) };
    });

    return json({ ad_id: adId, api_version: META_API_VERSION, fetched_at: fetchedAt, insights: normalized });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Network error", fetchedAt }, 502);
  }
}

/**
 * Main router for /api/meta/* requests.
 * Returns null if the path does not match — caller should fall through to SSR.
 */
export async function handleMetaApiRequest(
  request: Request,
  env: unknown,
): Promise<Response | null> {
  const metaEnv = env as MetaEnv;
  const url = new URL(request.url);
  const path = url.pathname;

  if (!path.startsWith("/api/meta/")) return null;

  if (path === "/api/meta/status") return handleStatus(metaEnv);
  if (path === "/api/meta/campaigns") return handleCampaigns(metaEnv);

  const campaignInsightsMatch = path.match(/^\/api\/meta\/campaigns\/([^/]+)\/insights$/);
  if (campaignInsightsMatch) return handleCampaignInsights(campaignInsightsMatch[1], metaEnv, url);

  const adInsightsMatch = path.match(/^\/api\/meta\/ads\/([^/]+)\/insights$/);
  if (adInsightsMatch) return handleAdInsights(adInsightsMatch[1], metaEnv, url);

  return json({ error: "Not found" }, 404);
}
