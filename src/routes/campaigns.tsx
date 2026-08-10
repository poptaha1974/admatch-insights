import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { AlertCircle, RefreshCw, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const Route = createFileRoute("/campaigns")({ component: Campaigns });

function Campaigns() {
  const [lastAttempt, setLastAttempt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      <TopBar title="الحملات" subtitle="بيانات الحملات من Meta Ads API — تحتاج اتصالاً نشطاً" />

      <div className="rounded-xl border border-[oklch(0.65_0.22_25_/_0.4)] bg-[oklch(0.65_0.22_25_/_0.08)] p-6 flex flex-col items-center text-center gap-4">
        <Unplug className="size-10 text-muted-foreground" />
        <div>
          <div className="font-semibold mb-1">Meta Ads API غير متصل</div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
            بيانات الحملات تحتاج اتصالاً فعلياً بـMeta Marketing API.
            اذهب إلى صفحة <strong>الربط</strong> وأضف System User Token لتفعيل سحب البيانات.
          </p>
          {lastAttempt && (
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <AlertCircle className="size-3" />
              <span>آخر محاولة: {lastAttempt} (Cairo) — فشل الاتصال بسبب غياب التوكن</span>
            </div>
          )}
        </div>
        <Button onClick={handleRetry} disabled={loading} variant="outline" size="sm">
          {loading ? (
            <>
              <RefreshCw className="size-4 ml-1 animate-spin" /> جاري الاتصال...
            </>
          ) : (
            <>
              <RefreshCw className="size-4 ml-1" /> إعادة المحاولة
            </>
          )}
        </Button>
      </div>

      <div className="mt-6 rounded-xl bg-card border border-border p-5">
        <div className="font-semibold mb-3 text-sm">ما ستراه بعد الاتصال</div>
        <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
          <li>• بيانات الحملات على مستوى Campaign / Ad Set / Ad</li>
          <li>• Spend, Impressions, Reach, Frequency, CPM</li>
          <li>• CTR(All) منفصل عن Link CTR و Outbound CTR</li>
          <li>• Landing Page Views (LPV) وتكلفتها</li>
          <li>• ViewContent, AddToCart, InitiateCheckout, Purchase</li>
          <li>• Funnel كامل مع drop-off rates بين كل مرحلة</li>
          <li>• تشخيص تلقائي: Tracking Issues، Intent Gaps، Offer Friction</li>
          <li>• Account ID، Campaign ID، Timezone، وقت آخر تحديث</li>
        </ul>
      </div>
    </>
  );
}
