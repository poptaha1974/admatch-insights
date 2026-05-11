import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { Settings2 } from "lucide-react";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/campaigns")({ component: Campaigns });

type Row = {
  name: string; goal: string; status: "active" | "paused";
  spend: number; leads: number; delivered: number; metaCpa: number; realCpa: number; gap: string; risk?: boolean;
};

const rows: Row[] = [
  { name: "Karohat رمضان", goal: "Conversions", status: "active", spend: 12450, leads: 327, delivered: 127, metaCpa: 38, realCpa: 98, gap: "+158%" },
  { name: "Air Fryer Generic Q2", goal: "Lead Gen", status: "active", spend: 9820, leads: 218, delivered: 77, metaCpa: 45, realCpa: 128, gap: "+184%" },
  { name: "Free Event Lead Gen", goal: "Lead Gen", status: "active", spend: 7350, leads: 237, delivered: 99, metaCpa: 31, realCpa: 74, gap: "+139%" },
  { name: "Retargeting WhatsApp", goal: "Messages", status: "active", spend: 4280, leads: 195, delivered: 104, metaCpa: 22, realCpa: 41, gap: "+86%" },
  { name: "منتجات منزلية صيف 26", goal: "Conversions", status: "paused", spend: 1920, leads: 70, delivered: 5, metaCpa: 27, realCpa: 384, gap: "+1322%", risk: true },
];

function Mini({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold num mt-1">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function Campaigns() {
  const [selected, setSelected] = useState<Row | null>(null);
  return (
    <>
      <TopBar title="الحملات" subtitle="كل حملاتك مع الفجوة الفعلية بين Meta والواقع" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Mini label="Active" value="12" />
        <Mini label="Paused" value="3" />
        <Mini label="Spend Today" value="2,140 ج.م" sub="تحديث الساعة 2 الفجر" />
        <Mini label="متوسط Real CPA" value="98 ج.م" sub="آخر 7 أيام" />
      </div>

      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                {["الحملة","الهدف","الحالة","إنفاق","Leads","تسليم","Meta CPA","Real CPA","فجوة","إجراء"].map((h) => (
                  <th key={h} className="text-right px-3 py-3 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.name}
                  onClick={() => setSelected(r)}
                  className="border-t border-border hover:bg-muted/30 cursor-pointer"
                >
                  <td className="px-3 py-3 font-medium">{r.name}</td>
                  <td className="px-3 py-3 text-muted-foreground">{r.goal}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] ${r.status === "active" ? "text-[oklch(0.72_0.18_145)]" : "text-[oklch(0.65_0.22_25)]"}`}>
                      <span className={`size-1.5 rounded-full ${r.status === "active" ? "bg-[oklch(0.72_0.18_145)]" : "bg-[oklch(0.65_0.22_25)]"}`} />
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 num">{r.spend.toLocaleString()}</td>
                  <td className="px-3 py-3 num">{r.leads}</td>
                  <td className="px-3 py-3 num">{r.delivered}</td>
                  <td className="px-3 py-3 num text-muted-foreground">{r.metaCpa}</td>
                  <td className="px-3 py-3 num font-semibold">{r.realCpa}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${r.risk ? "bg-[oklch(0.65_0.22_25_/_0.2)] text-[oklch(0.65_0.22_25)]" : "bg-[oklch(0.72_0.18_55_/_0.15)] text-[oklch(0.72_0.18_55)]"}`}>
                      {r.gap} {r.risk && "RISK"}
                    </span>
                  </td>
                  <td className="px-3 py-3"><Settings2 className="size-4 text-muted-foreground" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>
              Real CPA: <span className="num">{selected?.realCpa}</span> ج.م — فجوة {selected?.gap}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button variant="destructive" onClick={() => { toast.success("تم إيقاف الحملة"); setSelected(null); }}>أوقف الحملة</Button>
            <Button variant="outline" onClick={() => { toast.success("اتزودت الميزانية"); setSelected(null); }}>زود الميزانية</Button>
            <Button onClick={() => { toast("جاري التحليل…"); setSelected(null); }}>تحليل AI</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
