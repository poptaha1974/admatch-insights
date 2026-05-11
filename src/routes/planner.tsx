import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2 } from "lucide-react";
import { usePlannerStore, type PlannerInputs } from "@/stores/planner";
import { toast } from "sonner";

export const Route = createFileRoute("/planner")({ component: Planner });

const fmt = (n: number, d = 0) =>
  isFinite(n) ? n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }) : "—";

function NumInput({ k, label, suffix, step }: { k: keyof PlannerInputs; label: string; suffix?: string; step?: number }) {
  const value = usePlannerStore((s) => s.inputs[k]);
  const set = usePlannerStore((s) => s.set);
  return (
    <div>
      <Label className="text-xs text-muted-foreground mb-1.5 block">{label}{suffix && <span className="text-muted-foreground/60"> ({suffix})</span>}</Label>
      <Input
        type={typeof value === "number" ? "number" : "text"}
        value={value as string | number}
        step={step ?? "any"}
        onChange={(e) =>
          set(k, (typeof value === "number" ? Number(e.target.value) : e.target.value) as PlannerInputs[typeof k])
        }
        className="num bg-background"
      />
    </div>
  );
}

function Planner() {
  const { outputs, inputs, loadFromCampaign } = usePlannerStore();
  const o = outputs;

  const profitColor = o.netProfit >= 0 ? "text-[oklch(0.72_0.18_145)]" : "text-[oklch(0.65_0.22_25)]";
  const beColor = o.breakEven === "مستحيل" ? "text-[oklch(0.65_0.22_25)]" : "text-[oklch(0.72_0.18_145)]";

  const status = o.pricingStatus;
  const statusBadge =
    status === "ok" ? { label: "تنافسي وممتاز", cls: "bg-[oklch(0.72_0.18_145_/_0.2)] text-[oklch(0.72_0.18_145)]" } :
    status === "low" ? { label: "تحذير: بتحرق الأسعار", cls: "bg-[oklch(0.72_0.18_55_/_0.2)] text-[oklch(0.72_0.18_55)]" } :
    { label: "خطر: فوق سقف السوق", cls: "bg-[oklch(0.65_0.22_25_/_0.2)] text-[oklch(0.65_0.22_25)]" };

  // marker position: % from RIGHT in RTL based on price within [minComp*0.8, maxComp*1.2]
  const lo = inputs.minComp * 0.8;
  const hi = inputs.maxComp * 1.2;
  const pos = Math.max(0, Math.min(100, ((inputs.price - lo) / (hi - lo)) * 100));

  const alerts: { kind: "red" | "yellow" | "green"; text: string }[] = [];
  if (o.netProfit < 0) alerts.push({ kind: "red", text: `خسارة يومية ${fmt(Math.abs(o.netProfit))} ج.م — أوقف الإعلان أو ارفع السعر فوراً.` });
  if (isFinite(o.realCpa) && o.realCpa > inputs.price * 0.3) alerts.push({ kind: "yellow", text: `الـ Real CPA = ${fmt(o.realCpa)} ج.م > 30% من السعر — حسّن جودة الـ Leads` });
  if (inputs.confirmRate < 85) alerts.push({ kind: "yellow", text: `نسبة التأكيد ${inputs.confirmRate}% — استهدف 85%+` });
  if (o.netProfit > 0 && o.netProfit / Math.max(o.revenue, 1) > 0.25) alerts.push({ kind: "green", text: "هامش الربح 25%+ — ممتاز" });

  return (
    <>
      <TopBar title="المخطط المالي" subtitle="جرّب سيناريوهات واحسب الربح ونقطة التعادل قبل ما تجرب في الواقع" />

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-5">
        {/* Inputs */}
        <div className="space-y-4">
          <Section title="🛍️ المنتج والتسعير">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground mb-1.5 block">اسم المنتج</Label>
                <Input
                  value={inputs.productName}
                  onChange={(e) => usePlannerStore.getState().set("productName", e.target.value)}
                  className="bg-background"
                />
              </div>
              <NumInput k="cost" label="تكلفة المنتج" suffix="ج.م" />
              <NumInput k="price" label="سعر البيع" suffix="ج.م" />
              <NumInput k="minComp" label="أقل سعر منافس" />
              <NumInput k="maxComp" label="أعلى سعر منافس" />
              <Button
                variant="outline"
                size="sm"
                className="col-span-2 mt-1"
                onClick={() => { loadFromCampaign("karohat"); toast.success("اتحملت بيانات Karohat رمضان"); }}
              >
                <Link2 className="size-4 ml-1" /> جيب من Karohat رمضان
              </Button>
            </div>
          </Section>

          <Section title="📊 التسويق والقمع">
            <div className="grid grid-cols-2 gap-3">
              <NumInput k="leadsPerDay" label="Leads يومياً" />
              <NumInput k="cvr" label="التحويل" suffix="%" />
              <NumInput k="cpc" label="CPC" suffix="ج.م" />
              <NumInput k="confirmRate" label="تأكيد" suffix="%" />
              <NumInput k="deliveryRate" label="تسليم" suffix="%" />
              <NumInput k="damageRate" label="تالف مرتجع" suffix="%" />
            </div>
          </Section>

          <Section title="💰 التكاليف والضرائب">
            <div className="grid grid-cols-2 gap-3">
              <NumInput k="overhead" label="مصروفات ثابتة/يوم" />
              <NumInput k="packagingPerUnit" label="تغليف/قطعة" />
              <NumInput k="shippingSuccess" label="شحن ناجح" />
              <NumInput k="shippingReturn" label="شحن مرتجع" />
              <NumInput k="vatRate" label="ضريبة القيمة المضافة" suffix="%" />
              <NumInput k="inventory" label="المخزون المتاح" />
            </div>
          </Section>
        </div>

        {/* Outputs */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-card border border-border p-4">
              <div className="text-xs text-muted-foreground">نقطة التعادل</div>
              <div className={`text-3xl font-bold num mt-2 ${beColor}`}>
                {o.breakEven === "مستحيل" ? "مستحيل" : `${o.breakEven} طلب`}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                {o.breakEven === "مستحيل" ? "في منطقة خسارة" : "آمن"}
              </div>
            </div>
            <div className="rounded-xl bg-card border border-border p-4">
              <div className="text-xs text-muted-foreground">صافي الربح اليومي</div>
              <div className={`text-3xl font-bold num mt-2 ${profitColor}`}>
                {o.netProfit >= 0 ? "+" : ""}{fmt(o.netProfit)}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">{o.netProfit >= 0 ? "ربح" : "خسارة"}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Mini label="ROI" value={`${fmt(o.roi, 1)}%`} />
            <Mini label="ROAS" value={`${fmt(o.roas, 2)}x`} />
            <Mini label="Real CPA" value={fmt(o.realCpa)} />
            <Mini label="أيام المخزون" value={fmt(o.daysOfInventory)} />
          </div>

          <div className="rounded-xl bg-card border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">حالة التسعير</div>
              <span className={`px-2.5 py-1 rounded text-xs ${statusBadge.cls}`}>{statusBadge.label}</span>
            </div>
            <div className="relative h-7 rounded-md overflow-hidden grid grid-cols-3" dir="ltr">
              <div className="bg-[oklch(0.72_0.18_55_/_0.4)]" />
              <div className="bg-[oklch(0.72_0.18_145_/_0.4)]" />
              <div className="bg-[oklch(0.65_0.22_25_/_0.4)]" />
              <div className="absolute top-0 bottom-0 w-0.5 bg-foreground" style={{ left: `${pos}%` }} />
            </div>
            <div className="grid grid-cols-3 text-[10px] text-muted-foreground mt-1.5" dir="ltr">
              <span>حرق أسعار</span>
              <span className="text-center">تنافسي</span>
              <span className="text-left">فوق السقف</span>
            </div>
          </div>

          <div className="rounded-xl bg-card border border-border p-5">
            <div className="text-sm font-semibold mb-3">قائمة الدخل (يومي)</div>
            <Row label="الإيرادات (المبيعات المسلمة)" value={fmt(o.revenue)} />
            <Row label="تكلفة البضاعة المباعة (COGS)" value={`(${fmt(o.cogs)} ج.م)`} muted />
            <Row label="إنفاق الإعلانات" value={`(${fmt(o.adSpend)} ج.م)`} muted />
            <Row label="الشحن (ناجح + مرتجع)" value={`(${fmt(o.shippingCost)} ج.م)`} muted />
            <Row label="التغليف" value={`(${fmt(o.packagingCost)} ج.م)`} muted />
            <Row label="المصروفات الثابتة" value={`(${fmt(inputs.overhead)} ج.م)`} muted />
            <Row label="الضرائب (VAT)" value={`(${fmt(o.tax)} ج.م)`} muted />
            <div className="border-t border-border my-2" />
            <div className="flex items-center justify-between py-2">
              <span className="font-semibold">صافي الربح اليومي</span>
              <span className={`font-bold num text-lg ${profitColor}`}>{fmt(o.netProfit)} ج.م</span>
            </div>
          </div>

          {alerts.length > 0 && (
            <div className="rounded-xl bg-card border border-border p-5">
              <div className="text-sm font-semibold mb-3">تنبيهات</div>
              <div className="space-y-2">
                {alerts.map((a, i) => (
                  <div
                    key={i}
                    className={`text-xs rounded-md p-3 border ${
                      a.kind === "red" ? "border-[oklch(0.65_0.22_25_/_0.4)] bg-[oklch(0.65_0.22_25_/_0.1)] text-[oklch(0.78_0.18_25)]" :
                      a.kind === "yellow" ? "border-[oklch(0.72_0.18_55_/_0.4)] bg-[oklch(0.72_0.18_55_/_0.08)] text-[oklch(0.82_0.18_55)]" :
                      "border-[oklch(0.72_0.18_145_/_0.4)] bg-[oklch(0.72_0.18_145_/_0.08)] text-[oklch(0.82_0.18_145)]"
                    }`}
                  >
                    {a.kind === "red" ? "🚨" : a.kind === "yellow" ? "⚠️" : "✅"} {a.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}
function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card border border-border p-3">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-base font-semibold num mt-0.5">{value}</div>
    </div>
  );
}
function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`num ${muted ? "text-muted-foreground" : ""}`}>{value}</span>
    </div>
  );
}
