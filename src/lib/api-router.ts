import {
  fetchMetaGraph,
  fetchMetaStatus,
  getDiagnosticsThresholds,
  getMetaConfig,
  getMetaDateRange,
  normalizeInsights,
  runDiagnostics,
  safeMetric,
  type AppEnv,
  type NormalizedInsights,
} from "@/lib/meta-api";

type Json = Record<string, unknown>;

const INSIGHTS_FIELDS = [
  "account_id",
  "campaign_id",
  "campaign_name",
  "adset_id",
  "adset_name",
  "ad_id",
  "ad_name",
  "objective",
  "optimization_goal",
  "attribution_setting",
  "spend",
  "impressions",
  "reach",
  "frequency",
  "cpm",
  "clicks",
  "ctr",
  "inline_link_clicks",
  "inline_link_click_ctr",
  "cost_per_inline_link_click",
  "outbound_clicks",
  "outbound_clicks_ctr",
  "cost_per_outbound_click",
  "actions",
  "action_values",
  "cost_per_action_type",
  "website_purchase_roas",
  "date_start",
  "date_stop",
].join(",");

const API_STATE = {
  lastAttemptAt: null as string | null,
  lastSuccessAt: null as string | null,
  lastError: null as string | null,
};

function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    status: init?.status ?? 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init?.headers ?? {}),
    },
  });
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Unknown error";
}

function getBody(request: Request): Promise<Json> {
  return request
    .json()
    .then((v) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : {}))
    .catch(() => ({}));
}

async function fetchEntityDefaults(env: AppEnv, id: string) {
  const payload = await fetchMetaGraph(env, id, {
    fields:
      "id,name,effective_status,configured_status,objective,optimization_goal,attribution_setting,account_id,account_timezone_name,campaign_id,adset_id",
  });
  return payload;
}

function timeRangeParams(url: URL): Record<string, string> {
  const range = getMetaDateRange(url);
  if (range.since && range.until) {
    return { time_range: JSON.stringify({ since: range.since, until: range.until }) };
  }
  return { date_preset: range.preset ?? "last_3d" };
}

async function fetchInsights(
  env: AppEnv,
  requestUrl: URL,
  level: "campaign" | "adset" | "ad",
  id: string,
): Promise<NormalizedInsights> {
  const [entity, insightPayload] = await Promise.all([
    fetchEntityDefaults(env, id),
    fetchMetaGraph(env, `${id}/insights`, {
      level,
      fields: INSIGHTS_FIELDS,
      ...timeRangeParams(requestUrl),
    }),
  ]);

  const row = Array.isArray(insightPayload.data)
    ? (insightPayload.data[0] as Record<string, unknown> | undefined)
    : undefined;

  if (!row) {
    return normalizeInsights(
      level,
      {
        id,
        account_id: entity.account_id,
        campaign_id: entity.campaign_id ?? (level === "campaign" ? id : null),
      },
      requestUrl,
      env,
      {
        id: String(entity.id ?? id),
        name: (entity.name as string | undefined) ?? null,
        objective: (entity.objective as string | undefined) ?? null,
        optimizationGoal: (entity.optimization_goal as string | undefined) ?? null,
        attributionSetting: (entity.attribution_setting as string | undefined) ?? null,
        effectiveStatus: (entity.effective_status as string | undefined) ?? null,
        configuredStatus: (entity.configured_status as string | undefined) ?? null,
        accountId: (entity.account_id as string | undefined) ?? null,
        accountTimezoneName: (entity.account_timezone_name as string | undefined) ?? null,
      },
    );
  }

  return normalizeInsights(level, row, requestUrl, env, {
    id: String(entity.id ?? id),
    name: (entity.name as string | undefined) ?? null,
    objective: (entity.objective as string | undefined) ?? null,
    optimizationGoal: (entity.optimization_goal as string | undefined) ?? null,
    attributionSetting: (entity.attribution_setting as string | undefined) ?? null,
    effectiveStatus: (entity.effective_status as string | undefined) ?? null,
    configuredStatus: (entity.configured_status as string | undefined) ?? null,
    accountId: (entity.account_id as string | undefined) ?? null,
    accountTimezoneName: (entity.account_timezone_name as string | undefined) ?? null,
  });
}

async function fetchAdsForCampaign(
  env: AppEnv,
  campaignId: string,
  requestUrl: URL,
): Promise<NormalizedInsights[]> {
  const adsPayload = await fetchMetaGraph(env, `${campaignId}/ads`, {
    fields:
      "id,name,effective_status,configured_status,adset_id,campaign_id,account_id,objective,optimization_goal,attribution_setting,account_timezone_name",
    limit: "50",
  });
  const ads = Array.isArray(adsPayload.data)
    ? (adsPayload.data as Array<Record<string, unknown>>)
    : [];

  const insights = await Promise.all(
    ads.map(async (ad) => {
      const adId = String(ad.id ?? "");
      if (!adId) return null;
      try {
        return await fetchInsights(env, requestUrl, "ad", adId);
      } catch {
        return normalizeInsights("ad", ad, requestUrl, env, {
          id: adId,
          name: (ad.name as string | undefined) ?? null,
          effectiveStatus: (ad.effective_status as string | undefined) ?? null,
          configuredStatus: (ad.configured_status as string | undefined) ?? null,
          objective: (ad.objective as string | undefined) ?? null,
          optimizationGoal: (ad.optimization_goal as string | undefined) ?? null,
          attributionSetting: (ad.attribution_setting as string | undefined) ?? null,
          accountId: (ad.account_id as string | undefined) ?? null,
          accountTimezoneName: (ad.account_timezone_name as string | undefined) ?? null,
        });
      }
    }),
  );

  return insights.filter((item): item is NormalizedInsights => Boolean(item));
}

function formatAdvisorResponse(params: {
  statusConnected: boolean;
  statusReason: string | null;
  campaign: NormalizedInsights | null;
  ads: NormalizedInsights[];
  diagnostics: ReturnType<typeof runDiagnostics>;
}): string {
  const { statusConnected, statusReason, campaign, ads, diagnostics } = params;
  const dataFreshness = campaign?.provenance.dataFetchedAt ?? API_STATE.lastAttemptAt ?? "—";
  const timeRange = campaign
    ? `${campaign.provenance.timeRange.since ?? "—"} → ${campaign.provenance.timeRange.until ?? campaign.provenance.timeRange.preset ?? "—"}`
    : "—";

  const known = [
    statusConnected
      ? "Meta API connection is verified by backend call."
      : `Meta API is not connected: ${statusReason ?? "unknown reason"}`,
    campaign
      ? `Campaign ${campaign.id} was queried with API ${campaign.provenance.apiVersion}.`
      : "No campaign insight payload was available.",
  ];

  const unknown = [
    "No automatic claim is made about attribution gap normality without explicit attribution/window evidence.",
    "No claim is made about sales winner unless Purchase/ROAS evidence exists.",
  ];

  const risks = diagnostics.flags.length
    ? diagnostics.flags.map((f) => `${f.ruleId}: ${f.reason}`)
    : ["No deterministic risk flag fired with current data."];

  const actionsNotRecommended = [
    "Do not scale budget automatically.",
    "Do not pause/duplicate/create campaigns without explicit user approval.",
    "Do not infer purchase intent from CTR(All) only.",
  ];

  const adSummary = ads
    .map((ad) => {
      const labels = diagnostics.adLabels.find((l) => l.adId === ad.id)?.labels ?? [];
      return `- ${ad.name ?? ad.id}: LPV=${safeMetric(ad.metrics.landing_page_views)}, ATC=${safeMetric(ad.metrics.add_to_cart)}, IC=${safeMetric(ad.metrics.initiate_checkout)}, Purchase=${safeMetric(ad.metrics.purchases)}, Labels=${labels.join("+") || "NONE"}`;
    })
    .join("\n");

  return [
    "1) Data freshness",
    `- Last fetch: ${dataFreshness}`,
    `- Backend connection: ${statusConnected ? "Connected" : "Disconnected"}`,
    "",
    "2) Scope/time range",
    `- Campaign ID: ${campaign?.id ?? "—"}`,
    `- Time range: ${timeRange}`,
    `- Account timezone: ${campaign?.provenance.accountTimezone ?? "—"}`,
    "",
    "3) Raw metrics summary",
    `- Campaign spend=${safeMetric(campaign?.metrics.spend ?? null)}, LPV=${safeMetric(campaign?.metrics.landing_page_views ?? null)}, ATC=${safeMetric(campaign?.metrics.add_to_cart ?? null)}, IC=${safeMetric(campaign?.metrics.initiate_checkout ?? null)}, Purchase=${safeMetric(campaign?.metrics.purchases ?? null)}`,
    adSummary || "- No ad-level rows available.",
    "",
    "4) Funnel interpretation",
    "- CTR(All) is treated as engagement only, not purchase intent.",
    "- Traffic intent uses Link/Outbound/LPV progression.",
    "- Commercial winner is blocked unless down-funnel evidence exists.",
    "",
    "5) Confidence level",
    `- ${diagnostics.confidence}`,
    "",
    "6) What is known",
    ...known.map((v) => `- ${v}`),
    "",
    "7) What is unknown",
    ...unknown.map((v) => `- ${v}`),
    "",
    "8) Risks",
    ...risks.map((v) => `- ${v}`),
    "",
    "9) Recommended next action",
    "- Fix/verify landing variant price consistency, then validate post-fix IC/ATC progression windows (24h/48h/72h).",
    "",
    "10) Actions not recommended",
    ...actionsNotRecommended.map((v) => `- ${v}`),
  ].join("\n");
}

export async function tryHandleApiRequest(request: Request, env: AppEnv): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) return null;

  API_STATE.lastAttemptAt = new Date().toISOString();

  try {
    if (url.pathname === "/api/meta/status" && request.method === "GET") {
      const status = await fetchMetaStatus(env);
      API_STATE.lastSuccessAt = new Date().toISOString();
      API_STATE.lastError = null;

      return json({
        ...status,
        lastAttemptAt: API_STATE.lastAttemptAt,
        lastSuccessAt: API_STATE.lastSuccessAt,
        lastError: API_STATE.lastError,
        schedulerEnabled: false,
        schedulerReason: "Scheduler phase is not enabled yet in this deployment.",
        approvalMode: "read_recommend_only",
      });
    }

    if (url.pathname === "/api/meta/accounts" && request.method === "GET") {
      const cfg = getMetaConfig(env);
      const payload = await fetchMetaGraph(env, "me/adaccounts", {
        fields: "id,name,account_status,currency,timezone_name",
        limit: "25",
      });
      API_STATE.lastSuccessAt = new Date().toISOString();
      API_STATE.lastError = null;
      return json({
        data: payload.data ?? [],
        selectedAdAccountId: cfg.adAccountId,
        dataFetchedAt: API_STATE.lastSuccessAt,
        apiVersion: cfg.apiVersion,
      });
    }

    if (url.pathname === "/api/meta/campaigns" && request.method === "GET") {
      const cfg = getMetaConfig(env);
      if (!cfg.adAccountId) {
        return json({ error: "META_AD_ACCOUNT_ID missing" }, { status: 400 });
      }
      const payload = await fetchMetaGraph(env, `act_${cfg.adAccountId}/campaigns`, {
        fields:
          "id,name,effective_status,configured_status,objective,buying_type,status,special_ad_categories,start_time,stop_time",
        limit: "50",
      });

      const campaigns = Array.isArray(payload.data)
        ? (payload.data as Array<Record<string, unknown>>)
        : [];
      const filtered = cfg.campaignId
        ? campaigns.filter((c) => String(c.id ?? "") === cfg.campaignId)
        : campaigns;

      API_STATE.lastSuccessAt = new Date().toISOString();
      API_STATE.lastError = null;

      return json({
        data: filtered,
        selectedCampaignId: cfg.campaignId,
        dataFetchedAt: API_STATE.lastSuccessAt,
        apiVersion: cfg.apiVersion,
      });
    }

    if (
      url.pathname.match(/^\/api\/meta\/campaigns\/[^/]+\/insights$/) &&
      request.method === "GET"
    ) {
      const campaignId = url.pathname.split("/")[4];
      const insight = await fetchInsights(env, url, "campaign", campaignId);
      API_STATE.lastSuccessAt = new Date().toISOString();
      API_STATE.lastError = null;
      return json(insight);
    }

    if (url.pathname.match(/^\/api\/meta\/adsets\/[^/]+\/insights$/) && request.method === "GET") {
      const adsetId = url.pathname.split("/")[4];
      const insight = await fetchInsights(env, url, "adset", adsetId);
      API_STATE.lastSuccessAt = new Date().toISOString();
      API_STATE.lastError = null;
      return json(insight);
    }

    if (url.pathname.match(/^\/api\/meta\/ads\/[^/]+\/insights$/) && request.method === "GET") {
      const adId = url.pathname.split("/")[4];
      const insight = await fetchInsights(env, url, "ad", adId);
      API_STATE.lastSuccessAt = new Date().toISOString();
      API_STATE.lastError = null;
      return json(insight);
    }

    if (url.pathname === "/api/meta/campaign-diagnostics" && request.method === "GET") {
      const cfg = getMetaConfig(env);
      const campaignId = url.searchParams.get("campaign_id") ?? cfg.campaignId;
      if (!campaignId) return json({ error: "campaign_id missing" }, { status: 400 });

      const campaign = await fetchInsights(env, url, "campaign", campaignId);
      const ads = await fetchAdsForCampaign(env, campaignId, url);
      const thresholds = getDiagnosticsThresholds(env);
      const diagnostics = runDiagnostics(campaign, ads, thresholds);

      API_STATE.lastSuccessAt = new Date().toISOString();
      API_STATE.lastError = null;

      return json({
        campaign,
        ads,
        diagnostics,
        thresholds,
        incident: {
          id: "P0-PRICE-MISMATCH",
          adAnchorPriceEgp: 899,
          landingDefaultPriceEgp: 1599,
          status: (env.PRICE_MISMATCH_STATUS as string | undefined) ?? "unresolved",
          codTrustLine: "الدفع عند الاستلام — افحص بيانات طلبك قبل التأكيد",
          deployment: {
            timezone: "Africa/Cairo",
            timestamp: (env.PRICE_FIX_DEPLOYED_AT as string | undefined) ?? null,
            oldDefaultVariantId: (env.OLD_DEFAULT_VARIANT_ID as string | undefined) ?? null,
            newDefaultVariantId: (env.NEW_DEFAULT_VARIANT_ID as string | undefined) ?? null,
            releaseId: (env.PRICE_FIX_RELEASE_ID as string | undefined) ?? null,
          },
        },
        pixelAudit: {
          status: (env.PIXEL_AUDIT_STATUS as string | undefined) ?? "pending",
          detectedPixels: [
            {
              pixelId: "1104597594349134",
              source: null,
              datasetAssociationConfirmed: null,
              notes: "Fill from storefront audit.",
            },
            {
              pixelId: "621203567143136",
              source: null,
              datasetAssociationConfirmed: null,
              notes: "Fill from storefront audit.",
            },
          ],
          distinction:
            "UI must distinguish DUAL PIXELS PRESENT from DUPLICATE EVENTS WITHIN THE OPTIMIZATION DATASET.",
        },
      });
    }

    if (url.pathname === "/api/reports/generate" && request.method === "POST") {
      const cfg = getMetaConfig(env);
      const body = await getBody(request);
      const campaignId = typeof body.campaignId === "string" ? body.campaignId : cfg.campaignId;
      if (!campaignId) return json({ error: "campaignId missing" }, { status: 400 });

      const campaign = await fetchInsights(env, url, "campaign", campaignId);
      const ads = await fetchAdsForCampaign(env, campaignId, url);
      const thresholds = getDiagnosticsThresholds(env);
      const diagnostics = runDiagnostics(campaign, ads, thresholds);
      const pdfEnabled = String(env.REPORT_PDF_ENABLED ?? "false") === "true";

      API_STATE.lastSuccessAt = new Date().toISOString();
      API_STATE.lastError = null;

      return json({
        report: {
          title: "Karseell Diagnostic Report",
          accountId: campaign.provenance.adAccountId,
          campaignId: campaign.id,
          adSetId: campaign.provenance.adSetId,
          timeRange: campaign.provenance.timeRange,
          timezone: campaign.provenance.accountTimezone,
          lastSync: campaign.provenance.dataFetchedAt,
          confidence: diagnostics.confidence,
          recommendations: diagnostics.flags.map((f) => ({
            id: f.ruleId,
            recommendation: f.reason,
            severity: f.severity,
          })),
          adRows: ads,
        },
        pdf: {
          generated: false,
          enabled: pdfEnabled,
          reason: pdfEnabled
            ? "PDF generator integration is enabled but not implemented in this repository build."
            : "PDF export is disabled in this environment.",
        },
      });
    }

    if (url.pathname === "/api/automation/rules/preview" && request.method === "POST") {
      const body = await getBody(request);
      return json({
        mode: "preview_only",
        requiresApproval: true,
        request: body,
        impactEstimate: {
          confidence: "Low Confidence",
          summary: "No media-buying change is executed in preview mode.",
        },
        auditLogRequired: true,
      });
    }

    if (url.pathname === "/api/automation/actions/approve" && request.method === "POST") {
      const body = await getBody(request);
      const approved = body.approved === true;
      if (!approved) {
        return json({ error: "Explicit approval required (approved=true)." }, { status: 400 });
      }
      return json({
        accepted: true,
        executed: false,
        mode: "read_recommend_only",
        reason: "Sensitive actions are disabled in this phase.",
        approval: {
          approvedBy: body.approvedBy ?? "unknown",
          approvedAt: new Date().toISOString(),
          request: body,
        },
      });
    }

    if (url.pathname === "/api/advisor/chat" && request.method === "POST") {
      const cfg = getMetaConfig(env);
      const body = await getBody(request);
      const campaignId =
        typeof body.campaignId === "string"
          ? body.campaignId
          : typeof body?.plannerData?.campaignId === "string"
            ? (body.plannerData.campaignId as string)
            : cfg.campaignId;

      let statusConnected = false;
      let statusReason: string | null = null;
      let campaign: NormalizedInsights | null = null;
      let ads: NormalizedInsights[] = [];

      try {
        const status = await fetchMetaStatus(env);
        statusConnected = status.connected;
        statusReason = status.reason;
      } catch (error) {
        statusConnected = false;
        statusReason = toErrorMessage(error);
      }

      if (campaignId && statusConnected) {
        try {
          campaign = await fetchInsights(env, url, "campaign", campaignId);
          ads = await fetchAdsForCampaign(env, campaignId, url);
        } catch (error) {
          statusReason = toErrorMessage(error);
        }
      }

      const diagnostics = runDiagnostics(campaign, ads, getDiagnosticsThresholds(env));
      const content = formatAdvisorResponse({
        statusConnected,
        statusReason,
        campaign,
        ads,
        diagnostics,
      });

      return json({
        content,
        diagnostics,
        provenance: {
          apiVersion: getMetaConfig(env).apiVersion,
          generatedAt: new Date().toISOString(),
          campaignId,
          source: statusConnected ? "live_meta" : "backend_disconnected",
        },
      });
    }

    return json({ error: "Not Found" }, { status: 404 });
  } catch (error) {
    API_STATE.lastError = toErrorMessage(error);
    return json(
      {
        connected: false,
        error: API_STATE.lastError,
        lastAttemptAt: API_STATE.lastAttemptAt,
        lastSuccessAt: API_STATE.lastSuccessAt,
      },
      { status: 500 },
    );
  }
}
