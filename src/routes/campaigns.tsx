import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { Settings2, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/campaigns")({ component: Campaigns });


export type CampaignRow = {
  id: string;
  name: string;
  objective: string;
  effective_status: "ACTIVE" | "PAUSED" | "ARCHIVED" | string;
  spend?: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  inline_link_clicks?: number;
  inline_link_click_ctr?: number;
  landing_page_views?: number;
  add_to_cart?: number;
  initiate_checkout?: number;
  purchases?: number;
  purchase_roas?: number;
  data_fetched_at?: string;
};

type CampaignListResponse = {
  campaigns: CampaignRow[];
  account_id: string;
  fetched_at: string;
};

function Campaigns() {
  const [data, setData] = useState<CampaignListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastAttempt, setLastAttempt] = useState<string | null>(null);
  const [selected, setSelected] = useState<CampaignRow | null>(null);
  const [approvalAction, setApprovalAction] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLastAttempt(new Date().toLocaleTimeString("ar-EG", { timeZone: "Africa/Cairo" }));
    try {
      const res = await fetch(`/api/meta/campaigns`, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: CampaignListResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ غير معروف");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const campaigns = data?.campaigns ?? [];

  const handleSensitiveAction = (action: string) => {
    setApprovalAction(action);
  };

  const confirmAction = () => {
    toast.info(`تم تسجيل الطلب: ${approvalAction} — يحتاج موافقة يدوية`);
    setApprovalAction(null);
    setSelected(null);
  };

  return (
    <>
      <TopBar title="الحملات" subtitle="بيانات حية من Meta Ads API" />

      {loading && (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground text-sm">
          <Loader2 className="size-5 animate-spin" />
          <span>جاري تحميل الحملات من Meta…</span>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-[oklch(0.65_0.22_25_/_0.4)] bg-[oklch(0.65_0.22_25_/_0.08)] p-5 flex items-start gap-3">
          <AlertCircle className="size-5 text-[oklch(0.65_0.22_25)] shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-[oklch(0.65_0.22_25)] mb-1">غير متصل بـ Meta Ads API</div>
            <div className="text-sm text-muted-foreground mb-2">{error}</div>
            {lastAttempt && <div className="text-xs text-muted-foreground">آخر محاولة: {lastAttempt}</div>}
          </div>
          <Button size="sm" variant="outline" onClick={fetchCampaigns}>
            <RefreshCw className="size-4 ml-1" /> إعادة المحاولة
          </Button>
        </div>
      )}

      {!loading && !error && campaigns.length === 0 && (
        <div className="rounded-xl border border-border bg-muted/30 p-8 text-center text-muted-foreground text-sm">
          لا توجد حملات متاحة. تحقق من صلاحيات الحساب أو اربط حساب Meta أولاً.
        </div>
      )}

      {!loading && !error && campaigns.length > 0 && (
        <>
          {data?.fetched_at && (
            <div className="text-xs text-muted-foreground mb-3">
              آخر تحديث: {new Date(data.fetched_at).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })}
              {data.account_id && ` | Account: ${data.account_id}`}
            </div>
          )}
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    {["الحملة","الهدف","الحالة","إنفاق (ج.م)","نقرات الرابط","LPV","ATC","IC","شراء","ROAS","إجراء"].map((h) => (
                      <th key={h} className="text-right px-3 py-3 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((r) => {
                    const isActive = r.effective_status === "ACTIVE";
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSelected(r)}
                        className="border-t border-border hover:bg-muted/30 cursor-pointer"
                      >
                        <td className="px-3 py-3 font-medium">{r.name}</td>
                        <td className="px-3 py-3 text-muted-foreground">{r.objective ?? "—"}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] ${isActive ? "text-[oklch(0.72_0.18_145)]" : "text-[oklch(0.65_0.22_25)]"}`}>
                            <span className={`size-1.5 rounded-full ${isActive ? "bg-[oklch(0.72_0.18_145)]" : "bg-[oklch(0.65_0.22_25)]"}`} />
                            {r.effective_status}
                          </span>
                        </td>
                        <td className="px-3 py-3 num">{r.spend != null ? r.spend.toLocaleString("ar-EG", { maximumFractionDigits: 2 }) : "—"}</td>
                        <td className="px-3 py-3 num">{r.inline_link_clicks ?? "—"}</td>
                        <td className="px-3 py-3 num">{r.landing_page_views ?? "—"}</td>
                        <td className="px-3 py-3 num">{r.add_to_cart ?? "—"}</td>
                        <td className="px-3 py-3 num">{r.initiate_checkout ?? "—"}</td>
                        <td className="px-3 py-3 num">{r.purchases ?? "—"}</td>
                        <td className="px-3 py-3 num">{r.purchase_roas != null ? r.purchase_roas.toFixed(2) : "—"}</td>
                        <td className="px-3 py-3"><Settings2 className="size-4 text-muted-foreground" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Campaign detail dialog — Approval Mode: Read + Recommend only */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>
              <span className="block text-xs text-muted-foreground mb-2">ID: {selected?.id}</span>
              هذا النظام في وضع القراءة والتوصية فقط. أي إجراء يحتاج موافقة يدوية.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 text-sm my-2">
            <div><span className="text-muted-foreground">إنفاق:</span> <span className="num font-semibold">{selected?.spend != null ? `${selected.spend.toLocaleString()} ج.م` : "—"}</span></div>
            <div><span className="text-muted-foreground">نقرات الرابط:</span> <span className="num">{selected?.inline_link_clicks ?? "—"}</span></div>
            <div><span className="text-muted-foreground">LPV:</span> <span className="num">{selected?.landing_page_views ?? "—"}</span></div>
            <div><span className="text-muted-foreground">ATC:</span> <span className="num">{selected?.add_to_cart ?? "—"}</span></div>
            <div><span className="text-muted-foreground">IC:</span> <span className="num">{selected?.initiate_checkout ?? "—"}</span></div>
            <div><span className="text-muted-foreground">شراء:</span> <span className="num">{selected?.purchases ?? "—"}</span></div>
          </div>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button variant="outline" onClick={() => handleSensitiveAction(`إيقاف الحملة: ${selected?.name}`)}>طلب إيقاف</Button>
            <Button variant="outline" onClick={() => handleSensitiveAction(`زيادة ميزانية: ${selected?.name}`)}>طلب زيادة الميزانية</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval confirmation dialog */}
      <Dialog open={!!approvalAction} onOpenChange={(o) => !o && setApprovalAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الإجراء</DialogTitle>
            <DialogDescription>
              {approvalAction}
              <br />
              <span className="text-xs text-muted-foreground mt-1 block">
                ⚠️ هذا الإجراء يحتاج مراجعة يدوية قبل التنفيذ الفعلي على Meta.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={confirmAction}>تأكيد الطلب</Button>
            <Button variant="outline" onClick={() => setApprovalAction(null)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
