import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { KpiCard } from "@/components/KpiCard";
import { Button } from "@/components/ui/button";
import { Bot, Save, Download } from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

export const Route = createFileRoute("/finance")({ component: Finance });

const products = [
  { name: "Karohat Air Fryer 5L", revenue: 78000, margin: 32 },
  { name: "Karohat Air Fryer 7L", revenue: 41000, margin: 28 },
  { name: "Air Fryer Mini", revenue: 18500, margin: 22 },
  { name: "إكسسوارات Air Fryer", revenue: 12200, margin: 45 },
  { name: "ملاعق سيليكون", revenue: 6540, margin: 50 },
];

const ledger = Array.from({ length: 7 }).map((_, i) => {
  const rev = 18000 + i * 1800 + (i % 2 ? 500 : 0);
  const cost = rev * 0.65;
  return {
    date: `12-0${i + 1}`,
    rev,
    cost,
    profit: rev - cost,
    roi: ((rev - cost) / cost * 100).toFixed(1),
    roas: (rev / (rev * 0.22)).toFixed(2),
  };
});

const trend = ledger.map((l) => ({ date: l.date, إيرادات: l.rev, تكاليف: l.cost, ربح: l.profit }));

function Finance() {
  return (
    <>
      <TopBar title="الماليات" subtitle="الأرباح، التكاليف، والـ ROI" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard label="الإيرادات" value="156,240 ج.م" delta="▲ 18.2%" />
        <KpiCard label="تكلفة البضاعة (COGS)" value="62,496 ج.م" hint="40% من الإيرادات" />
        <KpiCard label="إنفاق الإعلانات" value="35,820 ج.م" hint="22.9% من الإيرادات" />
        <KpiCard label="صافي الربح" value="42,890 ج.م" hint="هامش 27.4%" highlight="warning" />
      </div>

      <div className="rounded-xl p-4 mb-6 border border-primary/30 bg-gradient-to-l from-primary/10 to-transparent">
        <div className="flex items-start gap-3">
          <Bot className="size-5 text-primary mt-0.5 shrink-0" />
          <p className="text-sm leading-relaxed">
            <span className="font-semibold">توصية ذكية:</span> أوقف حملة "منتجات منزلية — صيف 26"
            فوراً. صرفت <span className="num">1,920</span> ج.م وحققت <span className="num">5</span>{" "}
            تسليمات فقط من <span className="num">70</span> lead → الـ Real CPA ={" "}
            <span className="num font-bold">384</span> ج.م، ومتوسط قيمة الطلب{" "}
            <span className="num">290</span> ج.م → كل تسليم بيخسر <span className="num">94</span>{" "}
            ج.م. الإجمالي: خسارة <span className="num">470</span> ج.م. وقف الحملة هيوفر{" "}
            <span className="num font-bold">12,000</span> ج.م شهرياً.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl bg-card border border-border p-5">
          <h3 className="font-semibold mb-4">أعلى المنتجات ربحية</h3>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr><th className="text-right py-2">المنتج</th><th className="text-right">إيراد</th><th className="text-right">هامش</th></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.name} className="border-t border-border">
                  <td className="py-2.5">{p.name}</td>
                  <td className="num">{p.revenue.toLocaleString()}</td>
                  <td><span className="num text-[oklch(0.72_0.18_145)]">{p.margin}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-xl bg-card border border-border p-5">
          <h3 className="font-semibold mb-4">الإيرادات vs التكاليف vs الربح — يومياً</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0 0)" />
                <XAxis dataKey="date" stroke="oklch(0.7 0 0)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0 0)" fontSize={11} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0 0)", border: "1px solid oklch(0.28 0 0)", borderRadius: 8 }} />
                <Legend />
                <Line dataKey="إيرادات" stroke="oklch(0.72 0.18 145)" strokeWidth={2} dot={false} />
                <Line dataKey="تكاليف" stroke="oklch(0.72 0.18 55)" strokeWidth={2} dot={false} />
                <Line dataKey="ربح" stroke="oklch(0.76 0.16 295)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">دفتر القيود</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => toast.success("اتحفظ قيد اليوم")}>
              <Save className="size-4 ml-1" /> حفظ قيد اليوم
            </Button>
            <Button size="sm" onClick={() => toast.success("جاري التصدير…")}>
              <Download className="size-4 ml-1" /> تصدير CSV/Excel
            </Button>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr>{["التاريخ","الإيراد","التكاليف","صافي الربح","ROI","ROAS"].map((h) => (
              <th key={h} className="text-right py-2">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {ledger.map((r) => (
              <tr key={r.date} className="border-t border-border">
                <td className="py-2.5 num">{r.date}</td>
                <td className="num">{r.rev.toLocaleString()}</td>
                <td className="num text-muted-foreground">{r.cost.toLocaleString()}</td>
                <td className="num text-[oklch(0.72_0.18_145)]">{r.profit.toLocaleString()}</td>
                <td className="num">{r.roi}%</td>
                <td className="num">{r.roas}x</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
