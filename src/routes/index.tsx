import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { KpiCard } from "@/components/KpiCard";
import { useCallback, useEffect, useState } from "react";
import { fetchJson, formatMetric } from "@/lib/http";
import { Button } from "@/components/ui/button";

type DiagnosticsPayload = {
  campaign: {
    id: string;
    metrics: Record<string, number | null>;
    provenance: { dataFetchedAt: string; accountTimezone: string | null };
  };
  diagnostics: { confidence: string; flags: Array<{ ruleId: string; reason: string }> };
  ads: Array<{ id: string; name: string | null; metrics: Record<string, number | null> }>;
};

export const Route = createFileRoute("/")({ component: Overview });

function Overview() {
  const [data, setData] = useState<DiagnosticsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const payload = await fetchJson<DiagnosticsPayload>("/api/meta/campaign-diagnostics");
      setData(payload);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "تعذر تحميل البيانات");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const m = data?.campaign.metrics;

  return (
    <>
      <TopBar title="نظرة عامة" subtitle="بيانات حقيقية فقط مع فصل ما هو معروف عمّا هو غير معروف" />

      {error && (
        <div className="rounded-xl border border-[oklch(0.65_0.22_25_/_0.4)] bg-[oklch(0.65_0.22_25_/_0.08)] p-4 mb-6 text-sm">
          <div className="font-medium">غير متصل</div>
          <div className="text-muted-foreground mt-1">{error}</div>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => void load()}>
            إعادة المحاولة
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Spend" value={`${formatMetric(m?.spend, 2)} ج.م`} />
        <KpiCard label="LPV" value={formatMetric(m?.landing_page_views)} />
        <KpiCard label="ATC" value={formatMetric(m?.add_to_cart)} />
        <KpiCard label="IC" value={formatMetric(m?.initiate_checkout)} />
        <KpiCard label="Purchase" value={formatMetric(m?.purchases)} />
      </div>

      <div className="rounded-xl bg-card border border-border p-5 mb-6 text-sm">
        <div className="font-semibold mb-2">Data Provenance</div>
        <div>Campaign ID: {data?.campaign.id ?? "—"}</div>
        <div>
          Data fetched at:{" "}
          {data?.campaign.provenance.dataFetchedAt
            ? new Date(data.campaign.provenance.dataFetchedAt).toLocaleString("ar-EG")
            : "—"}
        </div>
        <div>Timezone: {data?.campaign.provenance.accountTimezone ?? "—"}</div>
        <div>Confidence: {data?.diagnostics.confidence ?? "Insufficient Data"}</div>
      </div>

      <div className="rounded-xl bg-card border border-border p-5 mb-6 text-sm">
        <div className="font-semibold mb-2">Known / Unknown</div>
        <div className="text-muted-foreground">
          Known: CTR(All) is engagement only and not purchase intent.
        </div>
        <div className="text-muted-foreground">
          Unknown: Business winner requires COD confirmed/delivered data integration.
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border p-5">
        <div className="font-semibold mb-3">Rule Flags</div>
        <div className="space-y-2 text-sm">
          {(data?.diagnostics.flags ?? []).map((flag) => (
            <div key={flag.ruleId} className="rounded-md border border-border p-3">
              <div className="font-medium">{flag.ruleId}</div>
              <div className="text-muted-foreground">{flag.reason}</div>
            </div>
          ))}
          {(data?.diagnostics.flags.length ?? 0) === 0 && (
            <div className="text-muted-foreground">لا توجد قواعد fired حالياً.</div>
          )}
        </div>
      </div>
    </>
  );
}
