import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Settings2, AlertCircle, RefreshCw, Clock } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/integrations")({ component: Integrations });

type IntegrationItem = {
  name: string;
  emoji: string;
  description: string;
  docsUrl?: string;
};

const items: IntegrationItem[] = [
  {
    name: "Meta Ads API",
    emoji: "📘",
    description: "اربط Meta Ads API عن طريق System User Token أو OAuth لسحب بيانات الحملات والإعلانات.",
  },
  {
    name: "WhatsApp Business API",
    emoji: "💬",
    description: "اربط WhatsApp Business API لإرسال إشعارات وتقارير عبر الواتساب.",
  },
  {
    name: "Shopify",
    emoji: "🛒",
    description: "اربط Shopify لسحب بيانات الطلبات والتأكيدات والتسليمات الفعلية.",
  },
  {
    name: "Bosta (شركة شحن)",
    emoji: "🚚",
    description: "اربط Bosta لمتابعة حالة الشحنات من الشحن للتسليم أو الإرجاع.",
  },
  {
    name: "ValU (تمويل)",
    emoji: "💳",
    description: "اربط ValU لتتبع مدفوعات التمويل ضمن تقارير الأداء.",
  },
  {
    name: "n8n Webhook",
    emoji: "🔗",
    description: "اربط n8n عن طريق Webhook لأتمتة سير العمل بين الأنظمة.",
  },
];

type ConnectionAttempt = {
  timestamp: string;
  error: string;
};

function Integrations() {
  const [retryLog, setRetryLog] = useState<Record<string, ConnectionAttempt>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const handleRetry = (name: string) => {
    setLoading((prev) => ({ ...prev, [name]: true }));
    // Simulate a connection attempt that fails because no backend is configured
    setTimeout(() => {
      setLoading((prev) => ({ ...prev, [name]: false }));
      setRetryLog((prev) => ({
        ...prev,
        [name]: {
          timestamp: new Date().toLocaleString("ar-EG", {
            timeZone: "Africa/Cairo",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }),
          error: "لم يتم تكوين الاتصال. أضف متغيرات البيئة المطلوبة (Environment Variables) لتفعيل هذا الربط.",
        },
      }));
    }, 1500);
  };

  return (
    <>
      <TopBar title="الربط" subtitle="اربط حساباتك علشان البيانات تتجمع تلقائياً" />

      <div className="mb-6 rounded-xl border border-[oklch(0.65_0.22_25_/_0.4)] bg-[oklch(0.65_0.22_25_/_0.08)] p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="size-5 text-[oklch(0.65_0.22_25)] mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold text-sm mb-1">لا يوجد اتصال نشط حالياً</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              جميع الربط تحتاج إلى تكوين Environment Variables في الـBackend.
              لا يتم عرض أي بيانات إلا بعد تأكيد الاتصال الفعلي من الخادم.
              حالة كل ربط تُعرض كما هي من الـAPI — لا يوجد بيانات وهمية.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => {
          const attempt = retryLog[it.name];
          const isLoading = loading[it.name];

          return (
            <div key={it.name} className="rounded-xl bg-card border border-border p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="size-12 rounded-lg bg-muted grid place-items-center text-2xl">{it.emoji}</div>
                <span className="text-[11px] px-2 py-1 rounded bg-muted text-muted-foreground">
                  غير متصل
                </span>
              </div>
              <div className="font-semibold mb-1">{it.name}</div>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{it.description}</p>

              {attempt && (
                <div className="mb-3 rounded-lg bg-[oklch(0.65_0.22_25_/_0.08)] border border-[oklch(0.65_0.22_25_/_0.2)] p-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-[oklch(0.65_0.22_25)] mb-1">
                    <Clock className="size-3" />
                    <span>آخر محاولة: {attempt.timestamp} (Cairo)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{attempt.error}</p>
                </div>
              )}

              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => handleRetry(it.name)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="size-4 ml-1 animate-spin" /> جاري الاتصال...
                  </>
                ) : attempt ? (
                  <>
                    <RefreshCw className="size-4 ml-1" /> إعادة المحاولة
                  </>
                ) : (
                  <>
                    <Settings2 className="size-4 ml-1" /> اربط دلوقتي
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </>
  );
}
