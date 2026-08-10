import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { Unplug, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const Route = createFileRoute("/funnel")({ component: Funnel });

function Funnel() {
  const [loading, setLoading] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<string | null>(null);

  const handleRetry = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setLastAttempt(
        new Date().toLocaleString("ar-EG", {
          timeZone: "Africa/Cairo",
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }, 1500);
  };

  return (
    <>
      <TopBar title="المسار والجماهير" subtitle="من الانطباع للتسليم — كل خطوة — يتطلب اتصالاً بـMeta Ads API" />

      <div className="rounded-xl border border-[oklch(0.65_0.22_25_/_0.4)] bg-[oklch(0.65_0.22_25_/_0.08)] p-6 flex flex-col items-center text-center gap-4 mb-6">
        <Unplug className="size-10 text-muted-foreground" />
        <div>
          <div className="font-semibold mb-1">لا توجد بيانات Funnel بعد</div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
            يتطلب عرض القمع الكامل اتصالاً فعلياً بـMeta Ads API وShopify.
            لا يتم عرض أي مراحل أو نسب drop-off إلا من بيانات حقيقية.
          </p>
          {lastAttempt && (
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <AlertCircle className="size-3" />
              <span>آخر محاولة: {lastAttempt} (Cairo) — لا يوجد توكن مكوَّن</span>
            </div>
          )}
        </div>
        <Button onClick={handleRetry} disabled={loading} variant="outline" size="sm">
          {loading ? (
            <><RefreshCw className="size-4 ml-1 animate-spin" /> جاري الاتصال...</>
          ) : (
            <><RefreshCw className="size-4 ml-1" /> إعادة المحاولة</>
          )}
        </Button>
      </div>

      <div className="rounded-xl bg-card border border-border p-5">
        <div className="font-semibold mb-3 text-sm">مراحل القمع الكامل (Full-Funnel) — بعد الاتصال</div>
        <div className="space-y-3">
          {[
            { stage: "Stage 1 — Delivery", items: ["Impressions", "Reach", "Frequency", "CPM", "Spend"] },
            { stage: "Stage 2 — Engagement", items: ["Clicks(All)", "CTR(All)"] },
            { stage: "Stage 3 — Traffic Quality", items: ["Link Clicks", "Link CTR", "CPC(Link)", "Outbound Clicks", "Outbound CTR", "LPV", "Cost per LPV", "LPV Rate"] },
            { stage: "Stage 4 — Intent", items: ["ViewContent", "AddToCart", "Cost per ATC", "InitiateCheckout", "Cost per IC"] },
            { stage: "Stage 5 — Conversion", items: ["Purchase", "Cost per Purchase", "Purchase Value", "ROAS"] },
            { stage: "Stage 6 — COD Operations", items: ["Placed Orders", "Confirmed Orders", "Shipped", "Delivered", "Refused/Returned", "Delivered CPA", "Net ROAS"] },
          ].map((s) => (
            <div key={s.stage} className="border border-border rounded-lg p-3">
              <div className="text-xs font-semibold mb-2 text-muted-foreground">{s.stage}</div>
              <div className="flex flex-wrap gap-1.5">
                {s.items.map((item) => (
                  <span key={item} className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          ملاحظة: CTR(All) لا يُستخدم كدليل على نية الشراء. يُستخدم فقط كمؤشر تفاعل عام (Engagement).
          نية الزيارة تُقاس بـOutbound CTR وLPV. نية الشراء تُقاس بـATC وIC وPurchase.
        </p>
      </div>
    </>
  );
}
