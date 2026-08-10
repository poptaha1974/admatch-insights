import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { KpiCard } from "@/components/KpiCard";
import { useCallback, useEffect, useState } from "react";
import { fetchJson, formatMetric } from "@/lib/http";
import { Button } from "@/components/ui/button";

type DiagnosticsPayload = {
  campaign: { metrics: Record<string, number | null>; provenance: { dataFetchedAt: string } };
};

export const Route = createFileRoute("/finance")({ component: Finance });

function Finance() {
  const [data, setData] = useState<DiagnosticsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const payload = await fetchJson<DiagnosticsPayload>("/api/meta/campaign-diagnostics");
      setData(payload);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "تعذر تحميل بيانات الماليات");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const m = data?.campaign.metrics;

  return (
    <>
      <TopBar
        title="الماليات"
        subtitle="طبقة Meta فقط حالياً؛ مؤشرات COD الفعلية تتطلب تكامل Shopify/OPS"
      />

      {error && (
        <div className="rounded-xl border border-[oklch(0.65_0.22_25_/_0.4)] bg-[oklch(0.65_0.22_25_/_0.08)] p-4 mb-6 text-sm">
          <div className="font-medium">غير متصل</div>
          <div className="text-muted-foreground mt-1">{error}</div>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => void load()}>
            إعادة المحاولة
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Spend" value={`${formatMetric(m?.spend, 2)} ج.م`} />
        <KpiCard
          label="Purchase Value"
          value={`${formatMetric(m?.purchase_conversion_value, 2)} ج.م`}
        />
        <KpiCard label="ROAS" value={formatMetric(m?.purchase_roas, 2)} />
        <KpiCard label="Cost / Purchase" value={`${formatMetric(m?.cost_per_purchase, 2)} ج.م`} />
      </div>

      <div className="rounded-xl bg-card border border-border p-5 text-sm">
        <div className="font-semibold mb-2">COD Reality Gap</div>
        <div className="text-muted-foreground">
          Placed/Confirmed/Shipped/Delivered/Returned غير متاحة بعد في هذا الإصدار.
        </div>
        <div className="text-muted-foreground mt-1">
          لا يتم إصدار توصية scale/pause تجارية قبل دمج بيانات COD الفعلية.
        </div>
        <div className="text-muted-foreground mt-3">
          Data fetched at:{" "}
          {data?.campaign.provenance.dataFetchedAt
            ? new Date(data.campaign.provenance.dataFetchedAt).toLocaleString("ar-EG")
            : "—"}
        </div>
      </div>
    </>
  );
}
