import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Settings2, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { fetchJson } from "@/lib/http";

type MetaStatus = {
  connected: boolean;
  reason: string | null;
  adAccountId: string | null;
  campaignId: string | null;
  apiVersion: string;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  schedulerEnabled: boolean;
  schedulerReason: string;
};

export const Route = createFileRoute("/integrations")({ component: Integrations });

function Integrations() {
  const [status, setStatus] = useState<MetaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson<MetaStatus>("/api/meta/status");
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل الحالة");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const integrations = [
    {
      name: "Meta Ads API",
      emoji: "📘",
      connected: status?.connected ?? false,
      detail: status?.connected
        ? `Ad Account: ${status.adAccountId ?? "—"} • API ${status.apiVersion}`
        : `غير متصل${status?.reason ? `: ${status.reason}` : ""}`,
    },
    {
      name: "Shopify",
      emoji: "🛒",
      connected: false,
      detail: "غير متصل: لم يتم تفعيل تكامل Shopify في هذا الإصدار.",
    },
    {
      name: "WhatsApp Business API",
      emoji: "💬",
      connected: false,
      detail: "غير متصل: التكامل غير مفعّل حالياً.",
    },
    {
      name: "Scheduler",
      emoji: "⏱️",
      connected: status?.schedulerEnabled ?? false,
      detail: status?.schedulerEnabled ? "مفعّل" : (status?.schedulerReason ?? "غير متاح"),
    },
  ];

  const lastAttempt = status?.lastAttemptAt ?? null;

  return (
    <>
      <TopBar title="الربط" subtitle="حالة الاتصال الفعلية من الـ Backend فقط" />

      {error && (
        <div className="rounded-xl border border-[oklch(0.65_0.22_25_/_0.4)] bg-[oklch(0.65_0.22_25_/_0.08)] p-4 mb-4 text-sm">
          <div className="font-medium">غير متصل</div>
          <div className="text-muted-foreground mt-1">{error}</div>
        </div>
      )}

      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
          <RotateCcw className="size-4 ml-1" /> إعادة المحاولة
        </Button>
        <span>آخر محاولة: {lastAttempt ? new Date(lastAttempt).toLocaleString("ar-EG") : "—"}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((it) => (
          <div key={it.name} className="rounded-xl bg-card border border-border p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="size-12 rounded-lg bg-muted grid place-items-center text-2xl">
                {it.emoji}
              </div>
              <span
                className={`text-[11px] px-2 py-1 rounded ${
                  it.connected
                    ? "bg-[oklch(0.72_0.18_145_/_0.2)] text-[oklch(0.72_0.18_145)]"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {it.connected ? "متصل" : "غير متصل"}
              </span>
            </div>
            <div className="font-semibold mb-1">{it.name}</div>
            <p className="text-xs text-muted-foreground mb-4">{it.detail}</p>
            <Button size="sm" variant="outline" className="w-full" disabled>
              <Settings2 className="size-4 ml-1" /> عرض الحالة
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}
