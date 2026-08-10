/**
 * Meta Ads Diagnostic Engine — Deterministic Rules
 *
 * Rules fire based on raw metric values and produce structured flags/labels.
 * All thresholds are configurable. No AI inference happens here.
 */

export type MetricValue = number | null;

export interface AdMetrics {
  adId: string;
  adName: string;
  spend: MetricValue;
  impressions: MetricValue;
  reach: MetricValue;
  frequency: MetricValue;
  cpm: MetricValue;
  // Clicks
  clicksAll: MetricValue;
  ctrAll: MetricValue; // percentage
  linkClicks: MetricValue;
  linkCtr: MetricValue; // percentage
  cpcLink: MetricValue;
  outboundClicks: MetricValue;
  outboundCtr: MetricValue; // percentage
  costPerOutboundClick: MetricValue;
  // Traffic quality
  landingPageViews: MetricValue; // LPV
  costPerLpv: MetricValue;
  // Intent
  viewContent: MetricValue;
  addToCart: MetricValue;
  costPerAtc: MetricValue;
  initiateCheckout: MetricValue;
  costPerIc: MetricValue;
  // Conversion
  purchases: MetricValue;
  costPerPurchase: MetricValue;
  purchaseValue: MetricValue;
  roas: MetricValue;
}

export type DiagnosticFlag =
  | "TRACKING_OR_PAGE_FRICTION" // LPV high, ATC/IC = 0
  | "CURIOSITY_NOT_SITE_INTENT" // CTR(All) high, Outbound CTR low
  | "PAGE_LOAD_OR_REDIRECT_FRICTION" // Outbound clicks >= 30, LPV rate < 70%
  | "OFFER_PAGE_MISMATCH" // LPV >= 100, ATC rate low
  | "DUAL_PIXEL_SUSPECTED" // external annotation
  | "PRICE_MISMATCH_P0" // ad price != landing page price
  | "ATTRIBUTION_GAP" // dataset IC != campaign IC
  | "INSUFFICIENT_DATA"; // spend below threshold

export type AdLabel =
  | "ATTENTION_WINNER_ONLY" // best CTR/CPC but no ATC/IC/Purchase
  | "ATTENTION_WINNER_AND_IC_LEADER" // best CTR + has IC
  | "TRAFFIC_WINNER" // best LPV
  | "INTENT_WINNER" // best ATC/IC
  | "SALES_WINNER" // best Purchase/ROAS
  | "HIGH_SPEND_WEAK_INTENT_CANDIDATE" // high spend, low ATC
  | "PROMISING_INTENT_SMALL_SAMPLE" // good ATC rate but tiny sample
  | "INSUFFICIENT_DATA"; // not enough data

export interface DiagnosticResult {
  adId: string;
  adName: string;
  label: AdLabel;
  flags: DiagnosticFlag[];
  notes: string[];
  confidence: "High" | "Medium" | "Low" | "Insufficient Data";
}

export interface DiagnosticThresholds {
  minSpendForEvidence: number; // EGP — below this = INSUFFICIENT_DATA
  trackingFrictionMinLpv: number; // LPV threshold for tracking check
  curiosityOutboundCtrThreshold: number; // outbound CTR below this when CTR(All) is high
  ctrAllHighThreshold: number; // CTR(All) above this = "high"
  lpvRateLowThreshold: number; // LPV / Outbound Clicks below this = friction
  lpvRateOutboundMinClicks: number; // min outbound clicks before checking LPV rate
  offerMismatchMinLpv: number; // min LPV before checking ATC rate
  offerMismatchAtcRateThreshold: number; // ATC/LPV below this = offer/page mismatch
}

export const DEFAULT_THRESHOLDS: DiagnosticThresholds = {
  minSpendForEvidence: 20, // 20 EGP minimum
  trackingFrictionMinLpv: 50,
  curiosityOutboundCtrThreshold: 2.0, // %
  ctrAllHighThreshold: 5.0, // %
  lpvRateLowThreshold: 70, // %
  lpvRateOutboundMinClicks: 30,
  offerMismatchMinLpv: 100,
  offerMismatchAtcRateThreshold: 5, // %
};

function safeDiv(a: MetricValue, b: MetricValue): number | null {
  if (a === null || b === null || b === 0) return null;
  return (a / b) * 100;
}

export function runDiagnostics(
  ads: AdMetrics[],
  thresholds: DiagnosticThresholds = DEFAULT_THRESHOLDS
): DiagnosticResult[] {
  return ads.map((ad) => {
    const flags: DiagnosticFlag[] = [];
    const notes: string[] = [];

    const spend = ad.spend ?? 0;

    // INSUFFICIENT_DATA check
    if (spend < thresholds.minSpendForEvidence) {
      return {
        adId: ad.adId,
        adName: ad.adName,
        label: "INSUFFICIENT_DATA",
        flags: ["INSUFFICIENT_DATA"],
        notes: [`الإنفاق ${spend.toFixed(2)} ج.م — أقل من الحد الأدنى ${thresholds.minSpendForEvidence} ج.م لاستخلاص نتائج موثوقة.`],
        confidence: "Insufficient Data",
      };
    }

    // Rule 1 — Tracking/Page Friction
    // IF LPV >= threshold AND ATC = 0
    const lpv = ad.landingPageViews ?? 0;
    const atc = ad.addToCart ?? 0;
    const ic = ad.initiateCheckout ?? 0;
    if (lpv >= thresholds.trackingFrictionMinLpv && atc === 0) {
      flags.push("TRACKING_OR_PAGE_FRICTION");
      notes.push(
        `R-TRACK-01: LPV=${lpv} و ATC=0. يُشتبه في مشكلة Tracking أو احتكاك في الصفحة.` +
        ` افحص: Pixel event firing، Event deduplication، Shopify Meta integration، Test Events، Checkout flow.`
      );
    }

    // Rule 2 — Curiosity Not Site Intent
    // IF CTR(All) high AND Outbound CTR low
    const ctrAll = ad.ctrAll ?? 0;
    const outboundCtr = ad.outboundCtr ?? 0;
    if (
      ctrAll >= thresholds.ctrAllHighThreshold &&
      outboundCtr < thresholds.curiosityOutboundCtrThreshold
    ) {
      flags.push("CURIOSITY_NOT_SITE_INTENT");
      notes.push(
        `R-CTR-01: CTR(All)=${ctrAll.toFixed(2)}% مرتفع لكن Outbound CTR=${outboundCtr.toFixed(2)}% منخفض.` +
        ` الضغطات إجمالية لا تعكس نية فعلية للزيارة. CTR(All) لا يُستخدم كدليل شراء.`
      );
    }

    // Rule 3 — Page Load/Redirect Friction
    // IF Outbound Clicks >= 30 AND LPV rate < 70%
    const outboundClicks = ad.outboundClicks ?? 0;
    const lpvRate = safeDiv(lpv, outboundClicks);
    if (
      outboundClicks >= thresholds.lpvRateOutboundMinClicks &&
      lpvRate !== null &&
      lpvRate < thresholds.lpvRateLowThreshold
    ) {
      flags.push("PAGE_LOAD_OR_REDIRECT_FRICTION");
      notes.push(
        `R-LP-01: ${outboundClicks} Outbound Clicks لكن LPV rate = ${lpvRate.toFixed(1)}% (< ${thresholds.lpvRateLowThreshold}%).` +
        ` يُشتبه في مشكلة تحميل الصفحة أو Redirect.`
      );
    }

    // Rule 4 — Offer/Page Mismatch
    // IF LPV >= 100 AND ATC rate < threshold
    const atcRate = safeDiv(atc, lpv);
    if (
      lpv >= thresholds.offerMismatchMinLpv &&
      atcRate !== null &&
      atcRate < thresholds.offerMismatchAtcRateThreshold
    ) {
      flags.push("OFFER_PAGE_MISMATCH");
      notes.push(
        `R-OFFER-01: LPV=${lpv} لكن ATC rate = ${atcRate.toFixed(1)}% (< ${thresholds.offerMismatchAtcRateThreshold}%).` +
        ` يُشتبه في عدم تطابق العرض مع الصفحة.`
      );
    }

    // Determine label
    const hasPurchase = (ad.purchases ?? 0) > 0;
    const hasIc = ic > 0;
    const hasAtc = atc > 0;

    let label: AdLabel;
    let confidence: DiagnosticResult["confidence"];

    if (hasPurchase) {
      label = "SALES_WINNER";
      confidence = "High";
    } else if (hasIc && ctrAll >= thresholds.ctrAllHighThreshold) {
      label = "ATTENTION_WINNER_AND_IC_LEADER";
      confidence = "Medium";
      notes.push(`A1 label: ATTENTION_WINNER + CURRENT_IC_LEADER. Purchase=0 لذا لا يُعلن عنه Sales Winner بعد.`);
    } else if (hasAtc && lpv < 20) {
      // Small sample but has ATC
      label = "PROMISING_INTENT_SMALL_SAMPLE";
      confidence = "Low";
      notes.push(`عينة صغيرة (LPV=${lpv}). ATC=${atc} واعد لكن غير كافٍ للحكم النهائي. لا يُوقف هذا الإعلان تلقائياً.`);
    } else if (hasAtc) {
      label = "INTENT_WINNER";
      confidence = "Medium";
    } else if (ctrAll >= thresholds.ctrAllHighThreshold && !hasAtc && !hasIc) {
      label = "ATTENTION_WINNER_ONLY";
      confidence = "Medium";
      notes.push(
        `CTR(All) مرتفع لكن لا يوجد ATC/IC/Purchase. لا يُعلن عن هذا الإعلان Sales Winner.` +
        ` التصنيف: Attention Winner فقط.`
      );
    } else if (spend > 50 && atc <= 1) {
      label = "HIGH_SPEND_WEAK_INTENT_CANDIDATE";
      confidence = "Medium";
      notes.push(`إنفاق ${spend.toFixed(0)} ج.م مع ATC=${atc}. مرشح للإيقاف/التقليل بعد فحص delayed attribution.`);
    } else {
      label = "INSUFFICIENT_DATA";
      confidence = "Insufficient Data";
    }

    return {
      adId: ad.adId,
      adName: ad.adName,
      label,
      flags,
      notes,
      confidence,
    };
  });
}

/**
 * Format a metric value for display.
 * Returns "—" if null (not available), not "0.00" which implies a true zero from API.
 */
export function fmt(value: MetricValue, decimals = 2, suffix = ""): string {
  if (value === null) return "—";
  return `${value.toLocaleString("ar-EG", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
}

export function fmtInt(value: MetricValue): string {
  if (value === null) return "—";
  return value.toLocaleString("ar-EG");
}

export function fmtPct(value: MetricValue, decimals = 2): string {
  if (value === null) return "—";
  return `${value.toFixed(decimals)}%`;
}
