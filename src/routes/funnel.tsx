import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { useState, useEffect, useCallback } from "react";
import { AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/funnel")({ component: Funnel });


type AdInsight = {
  id: string;
  name: string;
  spend?: number;
  impressions?: number;
  reach?: number;
  frequency?: number;
  cpm?: number;
  clicks?: number;
  ctr?: number;
  inline_link_clicks?: number;
  inline_link_click_ctr?: number;
  outbound_clicks?: number;
  outbound_clicks_ctr?: number;
  landing_page_views?: number;
  view_content?: number;
  add_to_cart?: number;
  initiate_checkout?: number;
  purchases?: number;
  purchase_roas?: number;
  cost_per_landing_page_view?: number;
  cost_per_add_to_cart?: number;
  cost_per_initiate_checkout?: number;
  cost_per_purchase?: number;
  label?: string;
};

type FunnelResponse = {
  campaign_id: string;
  campaign_name?: string;
  account_id?: string;
  date_start?: string;
  date_stop?: string;
  account_timezone?: string;
  fetched_at: string;
  ads: AdInsight[];
};

import { KARSEELL_CAMPAIGN_ID } from "@/lib/constants";

function fmt(v: number | undefined, decimals = 0): string {
  if (v == null) return "—";
  return v.toLocaleString("ar-EG", { maximumFractionDigits: decimals });
}

function pct(num: number | undefined, den: number | undefined): string {
  if (!num || !den || den === 0) return "—";
  return ((num / den) * 100).toFixed(1) + "%";
}

function AdFunnelCard({ ad }: { ad: AdInsight }) {
  const funnelStages = [
    { label: "Impressions", value: ad.impressions },
    { label: "Link Clicks", value: ad.inline_link_clicks },
    { label: "LPV", value: ad.landing_page_views },
    { label: "ViewContent", value: ad.view_content },
    { label: "ATC", value: ad.add_to_cart },
    { label: "IC", value: ad.initiate_checkout },
    { label: "Purchase", value: ad.purchases },
  ];
  const maxVal = ad.impressions ?? 1;

  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-sm">{ad.name}</div>
        {ad.label && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary">{ad.label}</span>
        )}
      </div>

      {/* Stage 1: Delivery */}
      <div className="mb-3 text-xs">
        <div className="font-medium text-muted-foreground mb-1 uppercase tracking-wide">Stage 1 — Delivery</div>
        <div className="grid grid-cols-3 gap-2">
          <div><span className="text-muted-foreground">Spend</span><br /><span className="num font-semibold">{fmt(ad.spend, 2)} ج.م</span></div>
          <div><span className="text-muted-foreground">Impressions</span><br /><span className="num">{fmt(ad.impressions)}</span></div>
          <div><span className="text-muted-foreground">CPM</span><br /><span className="num">{fmt(ad.cpm, 2)}</span></div>
        </div>
      </div>

      {/* Stage 2: Engagement */}
      <div className="mb-3 text-xs">
        <div className="font-medium text-muted-foreground mb-1 uppercase tracking-wide">Stage 2 — Engagement (All)</div>
        <div className="grid grid-cols-2 gap-2">
          <div><span className="text-muted-foreground">Clicks (All)</span><br /><span className="num">{fmt(ad.clicks)}</span></div>
          <div><span className="text-muted-foreground">CTR (All)</span><br /><span className="num">{fmt(ad.ctr, 2)}%</span></div>
        </div>
      </div>

      {/* Stage 3: Traffic Quality */}
      <div className="mb-3 text-xs">
        <div className="font-medium text-muted-foreground mb-1 uppercase tracking-wide">Stage 3 — Traffic Quality</div>
        <div className="grid grid-cols-2 gap-2">
          <div><span className="text-muted-foreground">Link Clicks</span><br /><span className="num">{fmt(ad.inline_link_clicks)}</span></div>
          <div><span className="text-muted-foreground">Link CTR</span><br /><span className="num">{fmt(ad.inline_link_click_ctr, 2)}%</span></div>
          <div><span className="text-muted-foreground">Outbound Clicks</span><br /><span className="num">{fmt(ad.outbound_clicks)}</span></div>
          <div><span className="text-muted-foreground">Outbound CTR</span><br /><span className="num">{fmt(ad.outbound_clicks_ctr, 2)}%</span></div>
          <div><span className="text-muted-foreground">LPV</span><br /><span className="num">{fmt(ad.landing_page_views)}</span></div>
          <div><span className="text-muted-foreground">LPV Rate</span><br /><span className="num">{pct(ad.landing_page_views, ad.outbound_clicks)}</span></div>
          <div><span className="text-muted-foreground">Cost/LPV</span><br /><span className="num">{fmt(ad.cost_per_landing_page_view, 2)}</span></div>
        </div>
      </div>

      {/* Stage 4: Intent */}
      <div className="mb-3 text-xs">
        <div className="font-medium text-muted-foreground mb-1 uppercase tracking-wide">Stage 4 — Intent</div>
        <div className="grid grid-cols-2 gap-2">
          <div><span className="text-muted-foreground">ViewContent</span><br /><span className="num">{fmt(ad.view_content)}</span></div>
          <div><span className="text-muted-foreground">ATC</span><br /><span className="num">{fmt(ad.add_to_cart)}</span></div>
          <div><span className="text-muted-foreground">Cost/ATC</span><br /><span className="num">{fmt(ad.cost_per_add_to_cart, 2)}</span></div>
          <div><span className="text-muted-foreground">IC</span><br /><span className="num">{fmt(ad.initiate_checkout)}</span></div>
          <div><span className="text-muted-foreground">Cost/IC</span><br /><span className="num">{fmt(ad.cost_per_initiate_checkout, 2)}</span></div>
        </div>
      </div>

      {/* Stage 5: Conversion */}
      <div className="mb-4 text-xs">
        <div className="font-medium text-muted-foreground mb-1 uppercase tracking-wide">Stage 5 — Conversion</div>
        <div className="grid grid-cols-2 gap-2">
          <div><span className="text-muted-foreground">Purchase</span><br /><span className="num">{fmt(ad.purchases)}</span></div>
          <div><span className="text-muted-foreground">Cost/Purchase</span><br /><span className="num">{fmt(ad.cost_per_purchase, 2)}</span></div>
          <div><span className="text-muted-foreground">ROAS</span><br /><span className="num">{fmt(ad.purchase_roas, 2)}</span></div>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="border-t border-border pt-3">
        <div className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wide">Funnel Drop-off</div>
        <div className="space-y-1.5">
          {funnelStages.map((s, i) => {
            const w = s.value != null && maxVal > 0 ? Math.max((s.value / maxVal) * 100, 2) : 0;
            return (
              <div key={s.label} className="flex items-center gap-2 text-[10px]">
                <span className="text-muted-foreground w-20 shrink-0">{s.label}</span>
                <div className="flex-1 h-4 rounded bg-muted/40 overflow-hidden">
                  {s.value != null ? (
                    <div className="h-full rounded bg-gradient-to-l from-primary to-primary/40" style={{ width: `${w}%` }} />
                  ) : (
                    <div className="h-full flex items-center px-1 text-[9px] text-muted-foreground">لا بيانات</div>
                  )}
                </div>
                <span className="num w-12 text-left shrink-0">{s.value != null ? s.value.toLocaleString() : "—"}</span>
                {i > 0 && s.value != null && funnelStages[i - 1].value != null && (
                  <span className="text-muted-foreground w-10 shrink-0">
                    {pct(s.value, funnelStages[i - 1].value)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Funnel() {
  const [data, setData] = useState<FunnelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastAttempt, setLastAttempt] = useState<string | null>(null);

  const fetchFunnel = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLastAttempt(new Date().toLocaleTimeString("ar-EG", { timeZone: "Africa/Cairo" }));
    try {
      const res = await fetch(`/api/meta/campaigns/${KARSEELL_CAMPAIGN_ID}/insights`, {
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: FunnelResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ غير معروف");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFunnel(); }, [fetchFunnel]);

  return (
    <>
      <TopBar title="القمع الكامل" subtitle="من الانطباع للشراء — بيانات Meta حية" />

      {loading && (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground text-sm">
          <Loader2 className="size-5 animate-spin" />
          <span>جاري تحميل بيانات القمع من Meta…</span>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-[oklch(0.65_0.22_25_/_0.4)] bg-[oklch(0.65_0.22_25_/_0.08)] p-5 flex items-start gap-3 mb-4">
          <AlertCircle className="size-5 text-[oklch(0.65_0.22_25)] shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-[oklch(0.65_0.22_25)] mb-1">غير متصل — لا يمكن تحميل بيانات القمع</div>
            <div className="text-sm text-muted-foreground mb-1">{error}</div>
            {lastAttempt && <div className="text-xs text-muted-foreground">آخر محاولة: {lastAttempt}</div>}
          </div>
          <Button size="sm" variant="outline" onClick={fetchFunnel}>
            <RefreshCw className="size-4 ml-1" /> إعادة المحاولة
          </Button>
        </div>
      )}

      {!loading && data && (
        <>
          <div className="text-xs text-muted-foreground mb-4">
            حملة: {data.campaign_name ?? data.campaign_id}
            {data.date_start && ` | الفترة: ${data.date_start} → ${data.date_stop}`}
            {data.account_timezone && ` | ${data.account_timezone}`}
            {` | آخر تحديث: ${new Date(data.fetched_at).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })}`}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.ads.map((ad) => <AdFunnelCard key={ad.id} ad={ad} />)}
          </div>
          {data.ads.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">لا توجد إعلانات في هذه الحملة.</div>
          )}
        </>
      )}
    </>
  );
}
