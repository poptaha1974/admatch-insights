import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { AlertCircle, Info, ShieldAlert, CheckCircle } from "lucide-react";
import {
  runDiagnostics,
  fmt,
  fmtInt,
  fmtPct,
  DEFAULT_THRESHOLDS,
} from "@/lib/diagnosticEngine";
import type { AdMetrics, DiagnosticResult } from "@/lib/diagnosticEngine";

export const Route = createFileRoute("/karseell")({ component: KarseellDiagnostic });

// ─────────────────────────────────────────────────────────────────────────────
// Field-verified data — source: karseell_committee_final_verdict.docx
// Period: 21–23 June 2026
// Campaign: Karseell Sales Diagnostic | ID: 120252073443580166
// Ad Account Timezone: Africa/Cairo
// Dataset (Optimization Pixel): AllHomz Shopify — 1104597594349134
// Legacy Pixel (dual pixel suspected): egypioneer — 621203567143136
// Data fetched: field-verified report (not live API — live API requires META_ACCESS_TOKEN env var)
// ─────────────────────────────────────────────────────────────────────────────

const PROVENANCE = {
  accountId: "— (غير متاح بدون توكن)",
  campaignId: "120252073443580166",
  campaignName: "Karseell Sales Diagnostic",
  adsetId: "— (غير متاح بدون توكن)",
  adsetName: "Broad Egypt 18-45 | IC",
  objective: "Sales",
  optimizationGoal: "InitiateCheckout",
  attributionWindow: "غير مؤكد — يجب فحص إعداد Campaign Dataset",
  datasetPixelId: "1104597594349134",
  datasetPixelName: "AllHomz Shopify",
  legacyPixelId: "621203567143136",
  legacyPixelName: "egypioneer",
  dateStart: "2026-06-21",
  dateStop: "2026-06-23",
  timezone: "Africa/Cairo",
  dataFetchedAt: "field-verified — karseell_committee_final_verdict.docx",
  apiVersion: "لا يتوفر — بيانات ميدانية وليس Meta API مباشر",
};

const ADS_DATA: AdMetrics[] = [
  {
    adId: "ad-A1",
    adName: "A1 — الأصلي مش مغشوش",
    spend: 90.34,
    impressions: 815,
    reach: 625,
    frequency: null, // derive from impressions/reach if needed: 815/625 = 1.30
    cpm: null,
    clicksAll: null, // not in field report breakdown
    ctrAll: null, // field report has link CTR not CTR(All)
    linkClicks: 91,
    linkCtr: 11.2,
    cpcLink: null,
    outboundClicks: null,
    outboundCtr: null,
    costPerOutboundClick: null,
    landingPageViews: 62,
    costPerLpv: null,
    viewContent: 64,
    addToCart: 4,
    costPerAtc: null,
    initiateCheckout: 1, // campaign-attributed
    costPerIc: null,
    purchases: 0,
    costPerPurchase: null,
    purchaseValue: null,
    roas: null,
  },
  {
    adId: "ad-A2",
    adName: "A2 — الثقة + COD",
    spend: 5.47,
    impressions: 68,
    reach: 61,
    frequency: null,
    cpm: null,
    clicksAll: null,
    ctrAll: null,
    linkClicks: 6,
    linkCtr: 8.8,
    cpcLink: null,
    outboundClicks: null,
    outboundCtr: null,
    costPerOutboundClick: null,
    landingPageViews: 4,
    costPerLpv: null,
    viewContent: 5,
    addToCart: 0,
    costPerAtc: null,
    initiateCheckout: 0,
    costPerIc: null,
    purchases: 0,
    costPerPurchase: null,
    purchaseValue: null,
    roas: null,
  },
  {
    adId: "ad-C1",
    adName: "C1 — مقارنة البندل",
    spend: 15.89,
    impressions: 237,
    reach: 190,
    frequency: null,
    cpm: null,
    clicksAll: null,
    ctrAll: null,
    linkClicks: 9,
    linkCtr: 3.8,
    cpcLink: null,
    outboundClicks: null,
    outboundCtr: null,
    costPerOutboundClick: null,
    landingPageViews: 7,
    costPerLpv: null,
    viewContent: 7,
    addToCart: 3,
    costPerAtc: null,
    initiateCheckout: 0,
    costPerIc: null,
    purchases: 0,
    costPerPurchase: null,
    purchaseValue: null,
    roas: null,
  },
  {
    adId: "ad-C2",
    adName: "C2 — قيمة البندل",
    spend: 90.41,
    impressions: 953,
    reach: 717,
    frequency: null,
    cpm: null,
    clicksAll: null,
    ctrAll: null,
    linkClicks: 56,
    linkCtr: 5.9,
    cpcLink: null,
    outboundClicks: null,
    outboundCtr: null,
    costPerOutboundClick: null,
    landingPageViews: 32,
    costPerLpv: null,
    viewContent: 34,
    addToCart: 1,
    costPerAtc: null,
    initiateCheckout: 0,
    costPerIc: null,
    purchases: 0,
    costPerPurchase: null,
    purchaseValue: null,
    roas: null,
  },
];

// Campaign-attributed IC: 1 | Dataset total IC: 6 (per Events Manager)
const CAMPAIGN_IC_ATTRIBUTED = 1;
const DATASET_IC_TOTAL = 6;

const DIAGNOSTICS = runDiagnostics(ADS_DATA, {
  ...DEFAULT_THRESHOLDS,
  trackingFrictionMinLpv: 50, // A1 has 62 LPV with ATC=4, so not exact zero — but C2 has 32 LPV, A2 has 4
  minSpendForEvidence: 10, // lower threshold for this campaign
});

const LABEL_STYLE: Record<string, string> = {
  ATTENTION_WINNER_AND_IC_LEADER: "bg-[oklch(0.72_0.18_145_/_0.15)] text-[oklch(0.72_0.18_145)] border border-[oklch(0.72_0.18_145_/_0.3)]",
  ATTENTION_WINNER_ONLY: "bg-[oklch(0.76_0.16_295_/_0.15)] text-[oklch(0.76_0.16_295)] border border-[oklch(0.76_0.16_295_/_0.3)]",
  PROMISING_INTENT_SMALL_SAMPLE: "bg-[oklch(0.72_0.18_55_/_0.15)] text-[oklch(0.72_0.18_55)] border border-[oklch(0.72_0.18_55_/_0.3)]",
  HIGH_SPEND_WEAK_INTENT_CANDIDATE: "bg-[oklch(0.65_0.22_25_/_0.15)] text-[oklch(0.65_0.22_25)] border border-[oklch(0.65_0.22_25_/_0.3)]",
  INSUFFICIENT_DATA: "bg-muted text-muted-foreground border border-border",
  SALES_WINNER: "bg-[oklch(0.72_0.18_145_/_0.2)] text-[oklch(0.72_0.18_145)] border border-[oklch(0.72_0.18_145_/_0.4)]",
  TRAFFIC_WINNER: "bg-[oklch(0.76_0.16_295_/_0.15)] text-[oklch(0.76_0.16_295)] border border-[oklch(0.76_0.16_295_/_0.3)]",
  INTENT_WINNER: "bg-[oklch(0.72_0.18_55_/_0.15)] text-[oklch(0.72_0.18_55)] border border-[oklch(0.72_0.18_55_/_0.3)]",
};

const LABEL_ARABIC: Record<string, string> = {
  ATTENTION_WINNER_AND_IC_LEADER: "Attention Winner + IC Leader",
  ATTENTION_WINNER_ONLY: "Attention Winner فقط",
  PROMISING_INTENT_SMALL_SAMPLE: "Intent واعد / عينة صغيرة",
  HIGH_SPEND_WEAK_INTENT_CANDIDATE: "إنفاق عالٍ / Intent ضعيف — مرشح للإيقاف",
  INSUFFICIENT_DATA: "بيانات غير كافية",
  SALES_WINNER: "Sales Winner",
  TRAFFIC_WINNER: "Traffic Winner",
  INTENT_WINNER: "Intent Winner",
};

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium num ${value === "—" ? "text-muted-foreground" : ""}`}>{value}</span>
    </div>
  );
}

function AdCard({ ad, diag }: { ad: AdMetrics; diag: DiagnosticResult }) {
  const freq = ad.impressions && ad.reach ? (ad.impressions / ad.reach).toFixed(2) : "—";
  const cpmCalc = ad.impressions && ad.spend ? ((ad.spend / ad.impressions) * 1000).toFixed(2) : "—";
  const cpcLinkCalc = ad.linkClicks && ad.spend && ad.linkClicks > 0 ? (ad.spend / ad.linkClicks).toFixed(2) : "—";
  const costPerLpvCalc = ad.landingPageViews && ad.spend && ad.landingPageViews > 0 ? (ad.spend / ad.landingPageViews).toFixed(2) : "—";
  const lpvRate = ad.linkClicks && ad.landingPageViews && ad.linkClicks > 0
    ? ((ad.landingPageViews / ad.linkClicks) * 100).toFixed(1) + "%"
    : "—";
  const atcRate = ad.landingPageViews && ad.addToCart !== null && ad.landingPageViews > 0
    ? ((ad.addToCart / ad.landingPageViews) * 100).toFixed(1) + "%"
    : "—";
  const vcRate = ad.landingPageViews && ad.viewContent !== null && ad.landingPageViews > 0
    ? ((ad.viewContent / ad.landingPageViews) * 100).toFixed(1) + "%"
    : "—";

  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <div className="flex items-start justify-between mb-4 gap-2">
        <div>
          <div className="font-semibold text-sm">{ad.adName}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Ad ID: {ad.adId}</div>
        </div>
        <span className={`text-[11px] px-2 py-1 rounded whitespace-nowrap shrink-0 ${LABEL_STYLE[diag.label] ?? ""}`}>
          {LABEL_ARABIC[diag.label] ?? diag.label}
        </span>
      </div>

      {/* Stage 1 — Delivery */}
      <div className="mb-4">
        <div className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Stage 1 — Delivery</div>
        <div className="grid grid-cols-3 gap-3">
          <MetricCell label="Spend (ج.م)" value={fmt(ad.spend, 2)} />
          <MetricCell label="Impressions" value={fmtInt(ad.impressions)} />
          <MetricCell label="Reach" value={fmtInt(ad.reach)} />
          <MetricCell label="Frequency" value={freq} />
          <MetricCell label="CPM (ج.م)" value={cpmCalc} />
        </div>
      </div>

      {/* Stage 3 — Traffic Quality (skip Stage 2 as CTR(All) not available from field report) */}
      <div className="mb-4">
        <div className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Stage 3 — Traffic Quality</div>
        <div className="grid grid-cols-3 gap-3">
          <MetricCell label="Link Clicks" value={fmtInt(ad.linkClicks)} />
          <MetricCell label="Link CTR" value={fmtPct(ad.linkCtr)} />
          <MetricCell label="CPC(Link) (ج.م)" value={cpcLinkCalc} />
          <MetricCell label="Outbound CTR" value={fmtPct(ad.outboundCtr)} />
          <MetricCell label="LPV" value={fmtInt(ad.landingPageViews)} />
          <MetricCell label="Cost/LPV (ج.م)" value={costPerLpvCalc} />
          <MetricCell label="LPV Rate" value={lpvRate} />
        </div>
      </div>

      {/* Stage 4 — Intent */}
      <div className="mb-4">
        <div className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Stage 4 — Intent</div>
        <div className="grid grid-cols-3 gap-3">
          <MetricCell label="ViewContent" value={fmtInt(ad.viewContent)} />
          <MetricCell label="VC Rate" value={vcRate} />
          <MetricCell label="AddToCart" value={fmtInt(ad.addToCart)} />
          <MetricCell label="ATC Rate/LPV" value={atcRate} />
          <MetricCell label="InitiateCheckout (attributed)" value={fmtInt(ad.initiateCheckout)} />
        </div>
      </div>

      {/* Stage 5 — Conversion */}
      <div className="mb-4">
        <div className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Stage 5 — Conversion</div>
        <div className="grid grid-cols-3 gap-3">
          <MetricCell label="Purchase" value={fmtInt(ad.purchases)} />
          <MetricCell label="CPA (ج.م)" value={fmtInt(ad.costPerPurchase)} />
          <MetricCell label="ROAS" value={fmt(ad.roas)} />
        </div>
      </div>

      {/* Diagnostic Notes */}
      {diag.notes.length > 0 && (
        <div className="mt-4 space-y-2">
          {diag.notes.map((note, i) => (
            <div
              key={i}
              className="rounded-lg bg-[oklch(0.72_0.18_55_/_0.08)] border border-[oklch(0.72_0.18_55_/_0.2)] p-3 text-[11px] leading-relaxed text-muted-foreground"
            >
              <Info className="size-3 inline ml-1 text-[oklch(0.72_0.18_55)]" />
              {note}
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground">Confidence:</span>
        <span className={`text-[10px] font-medium ${
          diag.confidence === "High" ? "text-[oklch(0.72_0.18_145)]" :
          diag.confidence === "Medium" ? "text-[oklch(0.72_0.18_55)]" :
          diag.confidence === "Low" ? "text-[oklch(0.65_0.22_25)]" :
          "text-muted-foreground"
        }`}>
          {diag.confidence}
        </span>
      </div>
    </div>
  );
}

function KarseellDiagnostic() {
  const totalSpend = ADS_DATA.reduce((s, a) => s + (a.spend ?? 0), 0);
  const totalLinkClicks = ADS_DATA.reduce((s, a) => s + (a.linkClicks ?? 0), 0);
  const totalLpv = ADS_DATA.reduce((s, a) => s + (a.landingPageViews ?? 0), 0);
  const totalVc = ADS_DATA.reduce((s, a) => s + (a.viewContent ?? 0), 0);
  const totalAtc = ADS_DATA.reduce((s, a) => s + (a.addToCart ?? 0), 0);
  const totalIcAttributed = ADS_DATA.reduce((s, a) => s + (a.initiateCheckout ?? 0), 0);
  const totalImpressions = ADS_DATA.reduce((s, a) => s + (a.impressions ?? 0), 0);
  const totalReach = ADS_DATA.reduce((s, a) => s + (a.reach ?? 0), 0);

  // Funnel drop-offs
  const lpvFromClicks = totalLinkClicks > 0 ? ((totalLpv / totalLinkClicks) * 100).toFixed(1) : "—";
  const atcFromLpv = totalLpv > 0 ? ((totalAtc / totalLpv) * 100).toFixed(1) : "—";
  const icFromAtc = totalAtc > 0 ? ((totalIcAttributed / totalAtc) * 100).toFixed(1) : "—";

  return (
    <>
      <TopBar
        title="تشخيص Karseell — حملة Sales Diagnostic"
        subtitle={`الفترة: ${PROVENANCE.dateStart} → ${PROVENANCE.dateStop} | التوقيت: ${PROVENANCE.timezone}`}
      />

      {/* P0 — Price Mismatch Banner */}
      <div className="mb-4 rounded-xl border-2 border-[oklch(0.65_0.22_25)] bg-[oklch(0.65_0.22_25_/_0.1)] p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="size-5 text-[oklch(0.65_0.22_25)] mt-0.5 shrink-0" />
          <div>
            <div className="font-bold text-sm mb-1 text-[oklch(0.65_0.22_25)]">
              P0 — PRICE-MESSAGE MISMATCH (غير محلول)
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed space-y-1">
              <div>سعر الإعلان المُعلَن: <strong>899 ج.م (قطعة واحدة)</strong></div>
              <div>الـVariant الافتراضي على الصفحة: <strong>1,599 ج.م (قطعتان)</strong></div>
              <div className="mt-2 font-medium text-foreground">
                R-LP-PRICE-01 — مشكلة موثقة ميدانياً: العميل يضغط على إعلان بسعر 899 ج.م ويجد الصفحة تعرض 1,599 ج.م كافتراضي.
              </div>
              <div>الإجراء المطلوب قبل أي توصية إعلانية: تغيير الـVariant الافتراضي إلى 899 ج.م وإضافة نص COD واضح فوق CTA.</div>
              <div className="mt-1 text-[oklch(0.65_0.22_25)]">الحالة: غير محلول — يجب الحل قبل أي قرار إعلاني.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Provenance */}
      <div className="mb-4 rounded-xl bg-card border border-border p-4">
        <div className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Info className="size-4 text-muted-foreground" />
          مصدر البيانات وتوثيقها (Data Provenance)
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {[
            ["Campaign ID", PROVENANCE.campaignId],
            ["Campaign", PROVENANCE.campaignName],
            ["Ad Set", PROVENANCE.adsetName],
            ["Objective", PROVENANCE.objective],
            ["Optimization Goal", PROVENANCE.optimizationGoal],
            ["Attribution Window", PROVENANCE.attributionWindow],
            ["Dataset Pixel", `${PROVENANCE.datasetPixelName} (${PROVENANCE.datasetPixelId})`],
            ["Legacy Pixel (مشتبه)", `${PROVENANCE.legacyPixelName} (${PROVENANCE.legacyPixelId})`],
            ["Timezone", PROVENANCE.timezone],
            ["Date Range", `${PROVENANCE.dateStart} → ${PROVENANCE.dateStop}`],
            ["Data Source", PROVENANCE.dataFetchedAt],
            ["API Version", PROVENANCE.apiVersion],
          ].map(([key, val]) => (
            <div key={key}>
              <div className="text-muted-foreground mb-0.5">{key}</div>
              <div className="font-medium">{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Dual Pixel Warning */}
      <div className="mb-4 rounded-xl border border-[oklch(0.72_0.18_55_/_0.4)] bg-[oklch(0.72_0.18_55_/_0.08)] p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="size-5 text-[oklch(0.72_0.18_55)] mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold text-sm mb-2">DUAL PIXELS PRESENT — فحص مطلوب</div>
            <div className="text-xs text-muted-foreground space-y-2 leading-relaxed">
              <div>
                <strong>Pixel 1 (Dataset الحالي):</strong> AllHomz Shopify — {PROVENANCE.datasetPixelId}
              </div>
              <div>
                <strong>Pixel 2 (Legacy مشتبه):</strong> egypioneer — {PROVENANCE.legacyPixelId}
              </div>
              <div className="mt-2 p-2 rounded bg-[oklch(0.72_0.18_55_/_0.1)] border border-[oklch(0.72_0.18_55_/_0.2)]">
                <div className="font-medium text-foreground mb-1">Attribution Gap موثق:</div>
                <div>Events Manager: <strong>6 IC events</strong> في Dataset</div>
                <div>Campaign Attribution: <strong>1 IC event</strong> فقط</div>
                <div className="mt-1 text-[oklch(0.72_0.18_55)]">
                  تحذير: لا تُصنِّف هذا الفارق كـ"attribution gap طبيعي" قبل فحص:
                  attribution window، event source، event time، campaign dataset association.
                </div>
              </div>
              <div className="mt-2">
                <div className="font-medium text-foreground mb-1">فحص الـPixel المطلوب:</div>
                <ul className="space-y-0.5 list-disc list-inside">
                  <li>مصدر كل Pixel (Shopify channel / theme / GTM / custom app)</li>
                  <li>Events fired من كل pixel</li>
                  <li>Browser vs Server source + event_id presence</li>
                  <li>هل يوجد deduplication بـ event_name + event_id؟</li>
                  <li>Ad accounts/campaigns المستخدمة لكل dataset</li>
                </ul>
              </div>
              <div className="text-[oklch(0.65_0.22_25)] font-medium">
                لا تحذف Legacy Pixel قبل إتمام هذا الفحص. الحذف الخاطئ قد يؤثر على Audiences تاريخية.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Summary */}
      <div className="mb-4 rounded-xl bg-card border border-border p-5">
        <div className="font-semibold text-sm mb-4">ملخص الحملة — إجمالي 4 إعلانات</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {[
            ["Spend", `${totalSpend.toFixed(2)} ج.م`],
            ["Impressions", totalImpressions.toLocaleString("ar-EG")],
            ["Reach", totalReach.toLocaleString("ar-EG")],
            ["Link Clicks", totalLinkClicks.toLocaleString("ar-EG")],
            ["LPV", totalLpv.toLocaleString("ar-EG")],
            ["ViewContent", totalVc.toLocaleString("ar-EG")],
            ["AddToCart", totalAtc.toLocaleString("ar-EG")],
            ["IC (attributed)", totalIcAttributed.toLocaleString("ar-EG")],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-muted/40 p-3">
              <div className="text-[10px] text-muted-foreground">{label}</div>
              <div className="text-lg font-semibold num mt-0.5">{value}</div>
            </div>
          ))}
        </div>

        {/* Funnel visualization */}
        <div className="mt-4">
          <div className="text-xs font-semibold text-muted-foreground mb-3">Funnel Drop-off (بناءً على البيانات المتاحة)</div>
          <div className="space-y-2">
            {[
              { label: "Link Clicks", value: totalLinkClicks, width: 100, note: null },
              { label: `LPV (${lpvFromClicks}% من Link Clicks)`, value: totalLpv, width: (totalLpv / totalLinkClicks) * 100, note: totalLpv < totalLinkClicks * 0.7 ? "⚠️ LPV rate منخفضة — فحص تحميل الصفحة" : null },
              { label: `ViewContent (من LPV)`, value: totalVc, width: (totalVc / totalLinkClicks) * 100, note: null },
              { label: `AddToCart (${atcFromLpv}% من LPV)`, value: totalAtc, width: (totalAtc / totalLinkClicks) * 100, note: null },
              { label: `InitiateCheckout/attributed (${icFromAtc}% من ATC)`, value: totalIcAttributed, width: (totalIcAttributed / totalLinkClicks) * 100, note: null },
              { label: "Purchase (campaign)", value: 0, width: 0, note: "⚠️ Purchase = 0. لا يُعلَن عن Sales Winner." },
            ].map((stage, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between text-xs mb-1">
                  <span className="font-medium">{stage.label}</span>
                  <span className="num font-semibold">{stage.value.toLocaleString("ar-EG")}</span>
                </div>
                <div className="h-6 rounded bg-muted/40 overflow-hidden">
                  <div
                    className="h-full rounded bg-gradient-to-l from-primary to-primary/40"
                    style={{ width: `${Math.max(stage.width, stage.value > 0 ? 1 : 0)}%` }}
                  />
                </div>
                {stage.note && (
                  <div className="text-[10px] text-[oklch(0.72_0.18_55)] mt-1">{stage.note}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Attribution rows */}
        <div className="mt-4 p-3 rounded-lg border border-border bg-muted/20">
          <div className="text-xs font-semibold mb-2">Attribution Split — IC Events</div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-muted-foreground">Campaign-attributed IC</div>
              <div className="font-bold num text-lg">{CAMPAIGN_IC_ATTRIBUTED}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Dataset Total IC (Events Manager)</div>
              <div className="font-bold num text-lg">{DATASET_IC_TOTAL}</div>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            الفارق ({DATASET_IC_TOTAL - CAMPAIGN_IC_ATTRIBUTED} events) يحتاج تفسيراً —
            attribution window، event source، campaign dataset association.
          </div>
        </div>
      </div>

      {/* COD Reality Gap */}
      <div className="mb-4 rounded-xl bg-card border border-border p-5">
        <div className="font-semibold text-sm mb-3">COD Reality Gap — طبقات الطلب</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs text-center">
          {[
            { label: "Placed Orders", value: "—", note: "بيانات Shopify" },
            { label: "Confirmed Orders", value: "—", note: "كول سنتر" },
            { label: "Shipped", value: "—", note: "شركة شحن" },
            { label: "Delivered", value: "—", note: "تسليم فعلي" },
            { label: "Refused/Returned", value: "—", note: "إرجاع" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-muted/40 p-3">
              <div className="text-muted-foreground text-[10px] mb-1">{item.label}</div>
              <div className="text-xl font-bold num">{item.value}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{item.note}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[11px] text-muted-foreground">
          <strong>تحذير:</strong> Meta Purchase ≠ Cash Collected. CPA الحقيقي = Spend / Delivered Orders.
          البيانات أعلاه تحتاج Shopify + Bosta integration.
        </div>
      </div>

      {/* Ad-level cards */}
      <div className="mb-4">
        <div className="font-semibold text-sm mb-3">تفاصيل الإعلانات — مستوى Ad</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {ADS_DATA.map((ad, i) => (
            <AdCard key={ad.adId} ad={ad} diag={DIAGNOSTICS[i]} />
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="rounded-xl bg-card border border-border p-5">
        <div className="font-semibold text-sm mb-4">التوصيات — حسب Priority</div>
        <div className="space-y-3 text-xs">
          {[
            {
              id: "R-LP-PRICE-01",
              priority: "P0",
              borderClass: "border-[oklch(0.65_0.22_25_/_0.3)]",
              bgClass: "bg-[oklch(0.65_0.22_25_/_0.06)]",
              badgeBgClass: "bg-[oklch(0.65_0.22_25_/_0.15)]",
              badgeColorClass: "text-[oklch(0.65_0.22_25)]",
              title: "تصحيح Variant الافتراضي فوراً",
              body: "غيّر الـVariant الافتراضي على صفحة المنتج إلى قطعة واحدة — 899 ج.م. أضف نص COD واضح بجانب CTA. سجّل timestamp التغيير لتقسيم البيانات قبل وبعد.",
              confidence: "High — موثق ميدانياً",
            },
            {
              id: "R-PIXEL-01",
              priority: "P1",
              borderClass: "border-[oklch(0.72_0.18_55_/_0.3)]",
              bgClass: "bg-[oklch(0.72_0.18_55_/_0.06)]",
              badgeBgClass: "bg-[oklch(0.72_0.18_55_/_0.15)]",
              badgeColorClass: "text-[oklch(0.72_0.18_55)]",
              title: "فحص الـDual Pixel وتأكيد Campaign Dataset",
              body: "فحص مصادر injection لكل Pixel. تأكيد أن campaign 120252073443580166 تُحسَّن على dataset 1104597594349134. فحص deduplication بـ event_name + event_id. تشغيل Test Events من product view → ATC → checkout.",
              confidence: "High — مشتبه به ميدانياً",
            },
            {
              id: "R-TRACK-01",
              priority: "P1",
              borderClass: "border-[oklch(0.72_0.18_55_/_0.3)]",
              bgClass: "bg-[oklch(0.72_0.18_55_/_0.06)]",
              badgeBgClass: "bg-[oklch(0.72_0.18_55_/_0.15)]",
              badgeColorClass: "text-[oklch(0.72_0.18_55)]",
              title: "فحص Tracking — IC event (A1: LPV=62, ATC=4, IC=1)",
              body: "A1 لديه LPV=62 وATC=4 لكن IC attributed=1 فقط مقابل 6 في Events Manager. فحص attribution window وevent source قبل أي قرار.",
              confidence: "Medium",
            },
            {
              id: "R-MEDIA-01",
              priority: "P2",
              borderClass: "border-[oklch(0.76_0.16_295_/_0.3)]",
              bgClass: "bg-[oklch(0.76_0.16_295_/_0.06)]",
              badgeBgClass: "bg-[oklch(0.76_0.16_295_/_0.15)]",
              badgeColorClass: "text-[oklch(0.76_0.16_295)]",
              title: "خطة الإعلانات — بعد إصلاح P0 وP1",
              body: "A1: يُحتفَظ به كـControl. C2: مرشح للإيقاف/التقليل (إنفاق ~A1 لكن ATC=1). C1: يُحتفَظ به كـChallenger (ATC/LPV=42.9% لكن عينة صغيرة جداً — LPV=7). A2: بيانات غير كافية — لا قرار.",
              confidence: "Medium — لا تنفيذ بدون موافقة",
            },
          ].map((rec) => (
            <div
              key={rec.id}
              className={`rounded-lg p-3 border ${rec.borderClass} ${rec.bgClass}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${rec.badgeBgClass} ${rec.badgeColorClass}`}
                >
                  {rec.priority}
                </span>
                <span className="font-semibold text-foreground">{rec.id}</span>
                <span className="text-muted-foreground">{rec.title}</span>
              </div>
              <div className="text-muted-foreground leading-relaxed">{rec.body}</div>
              <div className="mt-1.5 flex items-center gap-1">
                <CheckCircle className="size-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Confidence: {rec.confidence}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border text-xs text-muted-foreground">
          <strong>تحذير:</strong> النظام في وضع Read + Recommend فقط.
          أي فعل (Pause Ad / Increase Budget / Create Campaign) يتطلب موافقة صريحة ومراجعة Impact estimate.
          لا يتم تنفيذ أي فعل تلقائياً.
        </div>
      </div>
    </>
  );
}
