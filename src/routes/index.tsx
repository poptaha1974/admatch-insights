import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { KpiCard } from "@/components/KpiCard";
import { useState, useEffect, useCallback } from "react";
import { X, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KARSEELL_CAMPAIGN_ID } from "@/lib/constants";

export const Route = createFileRoute("/")({ component: Overview });


type OverviewStats = {
  spend_total?: number;
  landing_page_views?: number;
  add_to_cart?: number;
  initiate_checkout?: number;
  purchases?: number;
  purchase_roas?: number;
  date_start?: string;
  date_stop?: string;
  fetched_at: string;
  account_id?: string;
};

function Overview() {
  const [showBanner, setShowBanner] = useState(true);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastAttempt, setLastAttempt] = useState<string | null>(null);

  

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLastAttempt(new Date().toLocaleTimeString("ar-EG", { timeZone: "Africa/Cairo" }));
    try {
      const res = await fetch(`/api/meta/campaigns/${KARSEELL_CAMPAIGN_ID}/insights`, {
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as { ads?: Array<{ spend?: number; landing_page_views?: number; add_to_cart?: number; initiate_checkout?: number; purchases?: number; purchase_roas?: number }>; fetched_at: string; account_id?: string; date_start?: string; date_stop?: string };
      // Aggregate ad-level metrics
      const ads = json.ads ?? [];
      const agg: OverviewStats = {
        spend_total: ads.reduce((s, a) => s + (a.spend ?? 0), 0),
        landing_page_views: ads.reduce((s, a) => s + (a.landing_page_views ?? 0), 0),
        add_to_cart: ads.reduce((s, a) => s + (a.add_to_cart ?? 0), 0),
        initiate_checkout: ads.reduce((s, a) => s + (a.initiate_checkout ?? 0), 0),
        purchases: ads.reduce((s, a) => s + (a.purchases ?? 0), 0),
        fetched_at: json.fetched_at,
        account_id: json.account_id,
        date_start: json.date_start,
        date_stop: json.date_stop,
      };
      setStats(agg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ غير معروف");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <>
      <TopBar title="نظرة عامة" subtitle="بيانات Meta Ads حية — حملة Karseell" />

      {showBanner && (
        <div className="relative rounded-xl p-4 mb-6 border border-[oklch(0.72_0.18_55_/_0.4)] bg-gradient-to-l from-[oklch(0.72_0.18_55_/_0.15)] to-[oklch(0.65_0.22_25_/_0.1)]">
          <button onClick={() => setShowBanner(false)} className="absolute top-3 left-3 text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-[oklch(0.72_0.18_55)] mt-0.5 shrink-0" />
            <p className="text-sm leading-relaxed">
              <span className="font-semibold">P0 — تحذير: عدم تطابق السعر</span>{" "}
              الإعلان يعرض <span className="num font-bold">899 ج.م</span> لكن صفحة الهبوط تعرض <span className="num font-bold">1,599 ج.م</span> كافتراضي.
              هذا يسبب احتكاكًا مباشرًا في قرار الشراء. راجع صفحة الربط للتفاصيل.
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
          <Loader2 className="size-4 animate-spin" />
          <span>جاري تحميل الإحصائيات من Meta…</span>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-[oklch(0.65_0.22_25_/_0.4)] bg-[oklch(0.65_0.22_25_/_0.08)] p-4 flex items-start gap-3 mb-4">
          <AlertCircle className="size-5 text-[oklch(0.65_0.22_25)] shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-[oklch(0.65_0.22_25)] mb-1">غير متصل بـ Meta</div>
            <div className="text-sm text-muted-foreground">{error}</div>
            {lastAttempt && <div className="text-xs text-muted-foreground mt-1">آخر محاولة: {lastAttempt}</div>}
          </div>
          <Button size="sm" variant="outline" onClick={fetchStats}>
            <RefreshCw className="size-4 ml-1" /> إعادة
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="إنفاق (Karseell)"
          value={stats?.spend_total != null ? `${stats.spend_total.toLocaleString("ar-EG", { maximumFractionDigits: 2 })} ج.م` : "—"}
          hint={stats?.date_start ? `الفترة: ${stats.date_start} → ${stats.date_stop}` : undefined}
        />
        <KpiCard
          label="Landing Page Views"
          value={stats?.landing_page_views != null ? stats.landing_page_views.toLocaleString() : "—"}
          hint="بيانات حية من Meta"
        />
        <KpiCard
          label="Add to Cart"
          value={stats?.add_to_cart != null ? stats.add_to_cart.toLocaleString() : "—"}
          hint={stats?.initiate_checkout != null ? `IC: ${stats.initiate_checkout}` : undefined}
        />
        <KpiCard
          label="Purchase"
          value={stats?.purchases != null ? stats.purchases.toLocaleString() : "—"}
          hint="Meta-attributed فقط — ليس COD Delivered"
          highlight={stats?.purchases === 0 ? "warning" : undefined}
        />
      </div>

      {stats?.fetched_at && (
        <div className="text-xs text-muted-foreground mb-4">
          آخر تحديث: {new Date(stats.fetched_at).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })}
          {stats.account_id && ` | Account: ${stats.account_id}`}
          {` | Campaign: ${KARSEELL_CAMPAIGN_ID}`}
        </div>
      )}

      <div className="rounded-xl bg-card border border-border p-5">
        <h3 className="font-semibold mb-3 text-sm">ملاحظة: بيانات الحملات الإضافية</h3>
        <p className="text-sm text-muted-foreground">
          لعرض بيانات حملات إضافية وتحليل القمع الكامل، انتقل إلى صفحة{" "}
          <strong>الحملات</strong> أو <strong>القمع الكامل</strong>.
          جميع الأرقام تأتي من Meta Ads API مباشرةً.
        </p>
      </div>
    </>
  );
}

