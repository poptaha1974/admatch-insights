import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchJson, formatMetric } from "@/lib/http";
import { toast } from "sonner";

type Campaign = {
  id: string;
  name: string;
  objective?: string;
  effective_status?: string;
  configured_status?: string;
};

type Insight = {
  id: string;
  metrics: Record<string, number | null>;
  attributionSetting: string | null;
  optimizationGoal: string | null;
  provenance: {
    dataFetchedAt: string;
    accountTimezone: string | null;
    apiVersion: string;
  };
};

type PreviewResponse = {
  requiresApproval: boolean;
  impactEstimate: { confidence: string; summary: string };
};

export const Route = createFileRoute("/campaigns")({ component: Campaigns });

function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [insights, setInsights] = useState<Record<string, Insight>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchJson<{ data: Campaign[] }>("/api/meta/campaigns");
      setCampaigns(res.data ?? []);

      const insightPairs = await Promise.all(
        (res.data ?? []).map(async (campaign) => {
          try {
            const insight = await fetchJson<Insight>(`/api/meta/campaigns/${campaign.id}/insights`);
            return [campaign.id, insight] as const;
          } catch {
            return [campaign.id, null] as const;
          }
        }),
      );

      const nextInsights: Record<string, Insight> = {};
      for (const [id, insight] of insightPairs) {
        if (insight) nextInsights[id] = insight;
      }
      setInsights(nextInsights);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل الحملات");
      setCampaigns([]);
      setInsights({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    const all = campaigns.length;
    const active = campaigns.filter((c) =>
      String(c.effective_status ?? "")
        .toLowerCase()
        .includes("active"),
    ).length;
    const spend = campaigns.reduce((sum, c) => sum + (insights[c.id]?.metrics.spend ?? 0), 0);
    return { all, active, spend };
  }, [campaigns, insights]);

  const requestPreview = async (campaign: Campaign) => {
    setActionLoading(true);
    setPreview(null);
    try {
      const payload = await fetchJson<PreviewResponse>("/api/automation/rules/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          entityType: "campaign",
          entityId: campaign.id,
          requestedAction: "pause_or_reduce_candidate",
        }),
      });
      setPreview(payload);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل إنشاء المعاينة");
    } finally {
      setActionLoading(false);
    }
  };

  const approve = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      const result = await fetchJson<{ executed: boolean; reason: string }>(
        "/api/automation/actions/approve",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            approved: true,
            approvedBy: "ui-user",
            entityType: "campaign",
            entityId: selected.id,
            action: "pause_or_reduce_candidate",
          }),
        },
      );
      toast.message(result.executed ? "تم التنفيذ" : "تم تسجيل الموافقة فقط", {
        description: result.reason,
      });
      setSelected(null);
      setPreview(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل التأكيد");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <TopBar title="الحملات" subtitle="بيانات حية مع وضع Approval للأفعال الحساسة" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Mini label="Campaigns" value={formatMetric(totals.all)} />
        <Mini label="Active" value={formatMetric(totals.active)} />
        <Mini label="Spend" value={`${formatMetric(totals.spend, 2)} ج.م`} />
        <Mini label="Approval Mode" value="Read + Recommend" />
      </div>

      {error && (
        <div className="rounded-xl border border-[oklch(0.65_0.22_25_/_0.4)] bg-[oklch(0.65_0.22_25_/_0.08)] p-4 mb-4 text-sm">
          <div className="font-medium">غير متصل</div>
          <div className="text-muted-foreground mt-1">{error}</div>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => void load()}>
            إعادة المحاولة
          </Button>
        </div>
      )}

      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                {[
                  "الحملة",
                  "Objective",
                  "Status",
                  "Spend",
                  "LPV",
                  "ATC",
                  "IC",
                  "Purchase",
                  "Last Sync",
                  "إجراء",
                ].map((h) => (
                  <th key={h} className="text-right px-3 py-3 font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => {
                const insight = insights[campaign.id];
                return (
                  <tr key={campaign.id} className="border-t border-border">
                    <td className="px-3 py-3 font-medium">{campaign.name}</td>
                    <td className="px-3 py-3 text-muted-foreground">{campaign.objective ?? "—"}</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {campaign.effective_status ?? campaign.configured_status ?? "—"}
                    </td>
                    <td className="px-3 py-3 num">{formatMetric(insight?.metrics.spend, 2)}</td>
                    <td className="px-3 py-3 num">
                      {formatMetric(insight?.metrics.landing_page_views)}
                    </td>
                    <td className="px-3 py-3 num">{formatMetric(insight?.metrics.add_to_cart)}</td>
                    <td className="px-3 py-3 num">
                      {formatMetric(insight?.metrics.initiate_checkout)}
                    </td>
                    <td className="px-3 py-3 num">{formatMetric(insight?.metrics.purchases)}</td>
                    <td className="px-3 py-3 text-[11px] text-muted-foreground">
                      {insight?.provenance.dataFetchedAt
                        ? new Date(insight.provenance.dataFetchedAt).toLocaleString("ar-EG")
                        : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelected(campaign);
                          void requestPreview(campaign);
                        }}
                        disabled={loading}
                      >
                        Preview
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {!loading && campaigns.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-muted-foreground" colSpan={10}>
                    لا توجد حملات متاحة من Meta حالياً.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>
              Preview only. لن يتم تنفيذ Pause/Scale/Create تلقائياً بدون موافقة صريحة.
            </DialogDescription>
          </DialogHeader>

          <div className="text-sm rounded-md border border-border p-3 bg-muted/20">
            <div>Requires Approval: {preview?.requiresApproval ? "Yes" : "—"}</div>
            <div>Confidence: {preview?.impactEstimate.confidence ?? "—"}</div>
            <div className="text-muted-foreground mt-1">
              {preview?.impactEstimate.summary ?? "جاري التحميل…"}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              variant="outline"
              onClick={() => selected && void requestPreview(selected)}
              disabled={actionLoading}
            >
              تحديث المعاينة
            </Button>
            <Button onClick={() => void approve()} disabled={actionLoading || !preview}>
              تأكيد (بدون تنفيذ فعلي)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold num mt-1">{value}</div>
    </div>
  );
}
