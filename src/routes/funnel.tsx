import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { useState } from "react";

export const Route = createFileRoute("/funnel")({ component: Funnel });

const stages = [
  { label: "Impressions", value: 1247890, pct: 100 },
  { label: "Click", value: 42180, pct: 3.4 },
  { label: "Lead form filled", value: 847, pct: 2.0 },
  { label: "Confirmed by call center", value: 619, pct: 73 },
  { label: "Delivered", value: 312, pct: 50 },
];

type Card = { id: string; name: string; product: string; value: number; time: string };
type Col = { id: string; title: string; cards: Card[] };

const initial: Col[] = [
  { id: "new", title: "🆕 جديد", cards: [
    { id: "1", name: "أحمد محمود", product: "Air Fryer 5L", value: 500, time: "9:12 ص" },
    { id: "2", name: "منى سعيد", product: "Air Fryer 7L", value: 620, time: "9:31 ص" },
  ]},
  { id: "confirm", title: "📞 تأكيد", cards: [
    { id: "3", name: "محمد علي", product: "Air Fryer 5L", value: 500, time: "10:02 ص" },
  ]},
  { id: "ship", title: "🚚 شحن", cards: [
    { id: "4", name: "سارة حسن", product: "Air Fryer 7L", value: 620, time: "أمس" },
    { id: "5", name: "كريم نبيل", product: "Air Fryer 5L", value: 500, time: "أمس" },
  ]},
  { id: "delivered", title: "✅ تسليم", cards: [
    { id: "6", name: "نور إبراهيم", product: "Air Fryer 5L", value: 500, time: "8:40 ص" },
  ]},
];

function Funnel() {
  const [cols, setCols] = useState(initial);
  const [drag, setDrag] = useState<{ cardId: string; from: string } | null>(null);
  const max = stages[0].value;

  const onDrop = (toCol: string) => {
    if (!drag) return;
    setCols((cs) => {
      const card = cs.find((c) => c.id === drag.from)?.cards.find((k) => k.id === drag.cardId);
      if (!card) return cs;
      return cs.map((c) =>
        c.id === drag.from ? { ...c, cards: c.cards.filter((k) => k.id !== drag.cardId) } :
        c.id === toCol ? { ...c, cards: [...c.cards, card] } : c
      );
    });
    setDrag(null);
  };

  return (
    <>
      <TopBar title="المسار والجماهير" subtitle="من الانطباع للتسليم — كل خطوة" />

      <div className="rounded-xl bg-card border border-border p-5 mb-6">
        <h3 className="font-semibold mb-4">القمع</h3>
        <div className="space-y-3">
          {stages.map((s, i) => {
            const w = Math.max((s.value / max) * 100, 4);
            return (
              <div key={s.label}>
                <div className="flex items-baseline justify-between text-sm mb-1">
                  <span className="font-medium">{s.label}</span>
                  <span className="text-muted-foreground text-xs">
                    <span className="num font-semibold text-foreground">{s.value.toLocaleString()}</span>
                    {i > 0 && <span className="mr-2">({s.pct}%)</span>}
                  </span>
                </div>
                <div className="h-8 rounded-md bg-muted/40 overflow-hidden">
                  <div
                    className="h-full rounded-md bg-gradient-to-l from-primary to-primary/40"
                    style={{ width: `${w}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">حالة الطلبات اليوم</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cols.map((c) => (
            <div
              key={c.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(c.id)}
              className="rounded-xl bg-card border border-border p-3 min-h-64"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium">{c.title}</div>
                <span className="text-xs text-muted-foreground num">({c.cards.length})</span>
              </div>
              <div className="space-y-2">
                {c.cards.map((card) => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={() => setDrag({ cardId: card.id, from: c.id })}
                    className="rounded-lg bg-muted/30 border border-border p-3 text-sm cursor-grab active:cursor-grabbing"
                  >
                    <div className="font-medium">{card.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{card.product}</div>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className="num text-primary">{card.value} ج.م</span>
                      <span className="text-muted-foreground">{card.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
