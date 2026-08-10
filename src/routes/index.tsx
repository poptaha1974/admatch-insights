import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { AlertCircle, Unplug, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const Route = createFileRoute("/")({ component: Overview });

function Overview() {
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
      <TopBar title="نظرة عامة" subtitle="ملخص الأداء — يتطلب اتصالاً بـMeta Ads API" />

      <div className="rounded-xl border border-[oklch(0.65_0.22_25_/_0.4)] bg-[oklch(0.65_0.22_25_/_0.08)] p-6 flex flex-col items-center text-center gap-4 mb-6">
        <Unplug className="size-10 text-muted-foreground" />
        <div>
          <div className="font-semibold mb-1">لا توجد بيانات حقيقية بعد</div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
            لعرض ملخص الأداء الحقيقي، يجب ربط Meta Ads API أولاً.
            لا يتم عرض أي أرقام — سواء Spend أو Leads أو CPA — إلا إذا جاءت من Backend فعلي.
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-card border border-border p-5">
          <div className="font-semibold mb-3 text-sm">مؤشرات الأداء (KPIs) — بعد الاتصال</div>
          <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
            <li>• إجمالي الإنفاق الإعلاني (Spend)</li>
            <li>• عدد LPV (Landing Page Views) وتكلفتها</li>
            <li>• عدد ATC (Add to Cart) وتكلفتها</li>
            <li>• عدد IC (Initiate Checkout) وتكلفتها</li>
            <li>• عدد المشتريات (Purchase) وCPA</li>
            <li>• ROAS الفعلي مقابل ROAS المعلَن من Meta</li>
          </ul>
        </div>
        <div className="rounded-xl bg-card border border-border p-5">
          <div className="font-semibold mb-3 text-sm">تشخيص تلقائي — بعد الاتصال</div>
          <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
            <li>• فجوة الإسناد: Meta Purchase مقابل الطلبات الفعلية</li>
            <li>• مشاكل Tracking: LPV عالية وATC/IC صفر</li>
            <li>• تضارب Pixel: اكتشاف أكثر من Pixel نشط</li>
            <li>• فجوة السعر: سعر الإعلان مقابل الصفحة الافتراضية</li>
            <li>• تحذيرات Audience Fatigue (Frequency عالية)</li>
          </ul>
        </div>
      </div>
    </>
  );
}
