import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { KpiCard } from "@/components/KpiCard";
import { useState } from "react";
import { X, Zap } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

export const Route = createFileRoute("/")({ component: Overview });

function Overview() {
  const [showBanner, setShowBanner] = useState(true);
  return (
    <>
      <TopBar title="نظرة عامة" subtitle="ملخص أدائك في آخر 30 يوم" />

      {showBanner && (
        <div className="relative rounded-xl p-4 mb-6 border border-[oklch(0.72_0.18_55_/_0.4)] bg-gradient-to-l from-[oklch(0.72_0.18_55_/_0.15)] to-[oklch(0.65_0.22_25_/_0.1)]">
          <button onClick={() => setShowBanner(false)} className="absolute top-3 left-3 text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
          <div className="flex items-start gap-3">
            <Zap className="size-5 text-[oklch(0.72_0.18_55)] mt-0.5 shrink-0" />
            <p className="text-sm leading-relaxed">
              <span className="font-semibold">اكتشفت فجوة في الإسناد:</span> Meta بيحسب{" "}
              <span className="num">847</span> عميل بتكلفة <span className="num">42.30</span> ج.م،
              لكن التسليمات الفعلية = <span className="num">312</span> فقط. التكلفة الحقيقية لكل
              تسليم = <span className="font-bold num">114.80 ج.م</span> (أعلى بـ{" "}
              <span className="font-bold">171%</span> مما يعرضه Meta).
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard label="إنفاق الإعلانات" value="35,820 ج.م" delta="▲ 12.4% عن الشهر السابق" />
        <KpiCard label="عدد الـ Leads من Meta" value="847" hint="تكلفة Meta المعلنة: 42.30 ج.م" />
        <KpiCard label="تسليمات فعلية" value="312" hint="من 847 — معدل التحويل 36.8%" />
        <KpiCard
          label="التكلفة الحقيقية لكل تسليم"
          value="114.80 ج.م"
          hint="أعلى 171% من حساب Meta"
          highlight="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Heatmap />
        <QualityDonut />
      </div>

      <CampaignCpaCompare />
    </>
  );
}

function Heatmap() {
  const days = ["سبت", "أحد", "اتنين", "تلات", "أربع", "خميس", "جمعة"];
  const weeks = [1, 2, 3, 4];
  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">خريطة فجوة الإسناد — أسبوعياً</h3>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>منخفضة</span>
          <div className="flex gap-0.5">
            {[0.15, 0.3, 0.5, 0.7, 0.9].map((o) => (
              <span key={o} className="size-3 rounded-sm" style={{ background: `oklch(0.76 0.16 295 / ${o})` }} />
            ))}
          </div>
          <span>عالية</span>
        </div>
      </div>
      <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-1.5 text-[10px]">
        <div />
        {days.map((d) => <div key={d} className="text-center text-muted-foreground py-1">{d}</div>)}
        {weeks.map((w) => (
          <Row key={w} week={w} />
        ))}
      </div>
    </div>
  );
}
function Row({ week }: { week: number }) {
  return (
    <>
      <div className="text-muted-foreground py-1 pl-2">أسبوع {week}</div>
      {Array.from({ length: 7 }).map((_, i) => {
        const v = (Math.sin(week * 7 + i) + 1) / 2;
        return (
          <div
            key={i}
            className="aspect-square rounded-sm"
            style={{ background: `oklch(0.76 0.16 295 / ${0.1 + v * 0.85})` }}
            title={`فجوة ${(v * 100).toFixed(0)}%`}
          />
        );
      })}
    </>
  );
}

function QualityDonut() {
  const data = [
    { name: "مُسلَّم", value: 312, color: "oklch(0.72 0.18 145)" },
    { name: "بيهرَّب", value: 195, color: "oklch(0.72 0.18 55)" },
    { name: "فضولي", value: 186, color: "oklch(0.7 0.16 235)" },
    { name: "فيك/مزيف", value: 154, color: "oklch(0.65 0.22 25)" },
  ];
  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <h3 className="font-semibold mb-4">تركيب جودة العملاء</h3>
      <div className="h-64">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={55} outerRadius={90} paddingAngle={2}>
              {data.map((d) => <Cell key={d.name} fill={d.color} stroke="none" />)}
            </Pie>
            <Tooltip contentStyle={{ background: "oklch(0.18 0 0)", border: "1px solid oklch(0.28 0 0)", borderRadius: 8 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ background: d.color }} />
            <span className="text-muted-foreground">{d.name}</span>
            <span className="num mr-auto">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CampaignCpaCompare() {
  const data = [
    { name: "Karohat رمضان", meta: 38, real: 98 },
    { name: "Air Fryer Generic Q2", meta: 45, real: 128 },
    { name: "Free Event Lead Gen", meta: 31, real: 74 },
    { name: "Retargeting WhatsApp", meta: 22, real: 41 },
    { name: "منزلية صيف 26", meta: 27, real: 384 },
  ];
  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <h3 className="font-semibold mb-4">Meta CPA vs Real CPA — لكل حملة</h3>
      <div className="h-80">
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0 0)" />
            <XAxis type="number" stroke="oklch(0.7 0 0)" fontSize={11} />
            <YAxis type="category" dataKey="name" stroke="oklch(0.7 0 0)" fontSize={11} width={130} />
            <Tooltip contentStyle={{ background: "oklch(0.18 0 0)", border: "1px solid oklch(0.28 0 0)", borderRadius: 8 }} />
            <Legend />
            <Bar dataKey="meta" name="Meta CPA" fill="oklch(0.76 0.16 295)" radius={[0, 4, 4, 0]} />
            <Bar dataKey="real" name="Real CPA" fill="oklch(0.72 0.18 55)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
