import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchJson, formatMetric } from "@/lib/http";
import { Button } from "@/components/ui/button";

type Insight = {
  id: string;
  name: string | null;
  metrics: Record<string, number | null>;
  provenance: {
    accountTimezone: string | null;
    dataFetchedAt: string;
    campaignId: string | null;
  };
};

type DiagnosticsPayload = {
  campaign: Insight;
  ads: Insight[];
  diagnostics: {
    confidence: string;
    adLabels: Array<{ adId: string; adName: string | null; labels: string[] }>;
    flags: Array<{
      ruleId: string;
      label: string;
      severity: string;
      reason: string;
      status: string;
    }>;
  };
  incident: {
    id: string;
    adAnchorPriceEgp: number;
    landingDefaultPriceEgp: number;
    status: string;
    codTrustLine: string;
    deployment: {
      timezone: string;
      timestamp: string | null;
      oldDefaultVariantId: string | null;
      newDefaultVariantId: string | null;
      releaseId: string | null;
    };
  };
  pixelAudit: {
    status: string;
    distinction: string;
    detectedPixels: Array<{ pixelId: string; source: string | null; notes: string }>;
  };
};

export const Route = createFileRoute("/funnel")({ component: Funnel });

function Funnel() {
  const [data, setData] = useState<DiagnosticsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchJson<DiagnosticsPayload>("/api/meta/campaign-diagnostics");
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل القمع");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const campaign = data?.campaign;

  const stages = useMemo(() => {
    if (!campaign) return [];
    const m = campaign.metrics;
    return [
      { label: "Impressions", value: m.impressions },
      { label: "Clicks All", value: m.clicks },
      { label: "Link Clicks", value: m.inline_link_clicks },
      { label: "Outbound Clicks", value: m.outbound_clicks },
      { label: "LPV", value: m.landing_page_views },
      { label: "ViewContent", value: m.view_content },
      { label: "AddToCart", value: m.add_to_cart },
      { label: "InitiateCheckout", value: m.initiate_checkout },
      { label: "Purchase", value: m.purchases },
    ];
  }, [campaign]);

  return (
    <>
      <TopBar title="القمع الكامل" subtitle="من Delivery إلى Conversion مع قواعد تشخيص حتمية" />

      {data?.incident && (
        <div className="rounded-xl p-4 mb-4 border border-[oklch(0.65_0.22_25_/_0.5)] bg-[oklch(0.65_0.22_25_/_0.08)]">
          <div className="font-semibold">P0 PRICE-MESSAGE MISMATCH</div>
          <div className="text-sm mt-1">Ad anchor price: {data.incident.adAnchorPriceEgp} EGP</div>
          <div className="text-sm">
            Landing default price: {data.incident.landingDefaultPriceEgp} EGP
          </div>
          <div className="text-sm">Status: {data.incident.status}</div>
          <div className="text-xs text-muted-foreground mt-1">{data.incident.codTrustLine}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Deployment annotation ({data.incident.deployment.timezone}):{" "}
            {data.incident.deployment.timestamp ?? "—"}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-[oklch(0.65_0.22_25_/_0.4)] bg-[oklch(0.65_0.22_25_/_0.08)] p-4 mb-4 text-sm">
          <div className="font-medium">غير متصل</div>
          <div className="text-muted-foreground mt-1">{error}</div>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => void load()}>
            إعادة المحاولة
          </Button>
        </div>
      )}

      <div className="rounded-xl bg-card border border-border p-5 mb-6">
        <h3 className="font-semibold mb-4">Campaign Funnel</h3>
        {stages.length === 0 ? (
          <div className="text-sm text-muted-foreground">لا توجد بيانات Funnel حالياً.</div>
        ) : (
          <div className="space-y-3">
            {stages.map((stage, index) => {
              const prev = index === 0 ? null : stages[index - 1].value;
              const rate =
                prev && stage.value !== null && prev > 0
                  ? `${((stage.value / prev) * 100).toFixed(1)}%`
                  : index === 0
                    ? "100%"
                    : "—";
              return (
                <div
                  key={stage.label}
                  className="flex items-center justify-between border-b border-border/40 pb-2"
                >
                  <div className="font-medium">{stage.label}</div>
                  <div className="text-sm text-muted-foreground">
                    <span className="num text-foreground">{formatMetric(stage.value)}</span>
                    <span className="mr-2">Drop/Progress: {rate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl bg-card border border-border overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                {[
                  "Ad",
                  "Spend",
                  "Impr",
                  "Clicks All",
                  "CTR All",
                  "Link Clicks",
                  "Outbound",
                  "LPV",
                  "ATC",
                  "IC",
                  "Purchase",
                  "Labels",
                ].map((h) => (
                  <th key={h} className="text-right px-3 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.ads ?? []).map((ad) => {
                const labels =
                  data?.diagnostics.adLabels.find((x) => x.adId === ad.id)?.labels ?? [];
                return (
                  <tr key={ad.id} className="border-t border-border">
                    <td className="px-3 py-3 font-medium">{ad.name ?? ad.id}</td>
                    <td className="px-3 py-3 num">{formatMetric(ad.metrics.spend, 2)}</td>
                    <td className="px-3 py-3 num">{formatMetric(ad.metrics.impressions)}</td>
                    <td className="px-3 py-3 num">{formatMetric(ad.metrics.clicks)}</td>
                    <td className="px-3 py-3 num">{formatMetric(ad.metrics.ctr, 2)}%</td>
                    <td className="px-3 py-3 num">{formatMetric(ad.metrics.inline_link_clicks)}</td>
                    <td className="px-3 py-3 num">{formatMetric(ad.metrics.outbound_clicks)}</td>
                    <td className="px-3 py-3 num">{formatMetric(ad.metrics.landing_page_views)}</td>
                    <td className="px-3 py-3 num">{formatMetric(ad.metrics.add_to_cart)}</td>
                    <td className="px-3 py-3 num">{formatMetric(ad.metrics.initiate_checkout)}</td>
                    <td className="px-3 py-3 num">{formatMetric(ad.metrics.purchases)}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {labels.join(" + ") || "—"}
                    </td>
                  </tr>
                );
              })}
              {!loading && (data?.ads.length ?? 0) === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-muted-foreground" colSpan={12}>
                    لا توجد إعلانات متاحة للحملة في النطاق الحالي.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-card border border-border p-5">
          <h3 className="font-semibold mb-3">Deterministic Flags</h3>
          <div className="space-y-2 text-sm">
            {(data?.diagnostics.flags ?? []).map((flag) => (
              <div key={flag.ruleId} className="rounded-md border border-border p-3">
                <div className="font-medium">
                  {flag.ruleId} — {flag.label}
                </div>
                <div className="text-muted-foreground mt-1">{flag.reason}</div>
              </div>
            ))}
            {!loading && (data?.diagnostics.flags.length ?? 0) === 0 && (
              <div className="text-muted-foreground">لا توجد قواعد fired حالياً.</div>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border p-5">
          <h3 className="font-semibold mb-3">Pixel Audit</h3>
          <div className="text-sm">Status: {data?.pixelAudit.status ?? "—"}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {data?.pixelAudit.distinction ?? "—"}
          </div>
          <div className="mt-3 space-y-2">
            {(data?.pixelAudit.detectedPixels ?? []).map((p) => (
              <div key={p.pixelId} className="rounded-md border border-border p-3 text-sm">
                <div className="font-medium">Pixel {p.pixelId}</div>
                <div className="text-muted-foreground">Source: {p.source ?? "غير محدد بعد"}</div>
                <div className="text-muted-foreground">{p.notes}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
