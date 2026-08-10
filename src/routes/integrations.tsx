import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Settings2, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

export const Route = createFileRoute("/integrations")({ component: Integrations });


type IntegrationStatus = {
  name: string;
  emoji: string;
  key: string;
  connected: boolean;
  error?: string;
  lastCheckedAt?: string;
};

type MetaStatusResponse = {
  meta: { connected: boolean; error?: string; checkedAt: string };
};

const STATIC_INTEGRATIONS: Omit<IntegrationStatus, "connected" | "error" | "lastCheckedAt">[] = [
  { name: "Meta Ads API", emoji: "📘", key: "meta" },
  { name: "WhatsApp Business API", emoji: "💬", key: "whatsapp" },
  { name: "Shopify", emoji: "🛒", key: "shopify" },
  { name: "Bosta (شركة شحن)", emoji: "🚚", key: "bosta" },
  { name: "ValU (تمويل)", emoji: "💳", key: "valu" },
  { name: "n8n Webhook", emoji: "🔗", key: "n8n" },
];

function Integrations() {
  const [statuses, setStatuses] = useState<Record<string, IntegrationStatus>>({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastAttempt, setLastAttempt] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    setLastAttempt(new Date().toLocaleTimeString("ar-EG", { timeZone: "Africa/Cairo" }));
    try {
      const res = await fetch(`/api/meta/status`, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: MetaStatusResponse = await res.json();
      setStatuses({
        meta: {
          name: "Meta Ads API",
          emoji: "📘",
          key: "meta",
          connected: data.meta.connected,
          error: data.meta.error,
          lastCheckedAt: data.meta.checkedAt,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطأ غير معروف";
      setFetchError(msg);
      setStatuses({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const getStatus = (key: string): IntegrationStatus | null => statuses[key] ?? null;

  return (
    <>
      <TopBar title="الربط" subtitle="حالة الاتصال الحقيقية بكل خدمة خارجية" />

      {fetchError && (
        <div className="mb-4 rounded-xl border border-[oklch(0.65_0.22_25_/_0.4)] bg-[oklch(0.65_0.22_25_/_0.08)] p-4 flex items-start gap-3">
          <AlertCircle className="size-5 text-[oklch(0.65_0.22_25)] shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <div className="font-semibold text-[oklch(0.65_0.22_25)] mb-0.5">تعذّر الاتصال بالخادم</div>
            <div className="text-muted-foreground">{fetchError}</div>
            {lastAttempt && <div className="text-xs text-muted-foreground mt-1">آخر محاولة: {lastAttempt}</div>}
          </div>
          <Button size="sm" variant="outline" onClick={fetchStatus} disabled={loading}>
            <RefreshCw className={`size-4 ml-1 ${loading ? "animate-spin" : ""}`} />
            إعادة المحاولة
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {STATIC_INTEGRATIONS.map((it) => {
          const live = getStatus(it.key);
          const isKnown = live !== null;
          const isConnected = live?.connected === true;

          return (
            <div key={it.key} className="rounded-xl bg-card border border-border p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="size-12 rounded-lg bg-muted grid place-items-center text-2xl">{it.emoji}</div>
                {loading ? (
                  <span className="text-[11px] px-2 py-1 rounded bg-muted text-muted-foreground flex items-center gap-1">
                    <Loader2 className="size-3 animate-spin" /> جاري التحقق
                  </span>
                ) : isKnown ? (
                  <span className={`text-[11px] px-2 py-1 rounded ${
                    isConnected
                      ? "bg-[oklch(0.72_0.18_145_/_0.2)] text-[oklch(0.72_0.18_145)]"
                      : "bg-[oklch(0.65_0.22_25_/_0.15)] text-[oklch(0.65_0.22_25)]"
                  }`}>
                    {isConnected ? "✅ متصل" : "❌ غير متصل"}
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-1 rounded bg-muted text-muted-foreground">
                    غير مربوط
                  </span>
                )}
              </div>
              <div className="font-semibold mb-1">{it.name}</div>
              <p className="text-xs text-muted-foreground mb-4">
                {isKnown && isConnected && live?.lastCheckedAt
                  ? `آخر تحقق: ${new Date(live.lastCheckedAt).toLocaleTimeString("ar-EG", { timeZone: "Africa/Cairo" })}`
                  : isKnown && !isConnected && live?.error
                    ? `خطأ: ${live.error}`
                    : "اضغط للربط"}
              </p>
              <Button size="sm" variant="outline" className="w-full">
                <Settings2 className="size-4 ml-1" />
                {isKnown && isConnected ? "إعدادات" : "اربط دلوقتي"}
              </Button>
            </div>
          );
        })}
      </div>
    </>
  );
}
