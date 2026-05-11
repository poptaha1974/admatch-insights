import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";

export const Route = createFileRoute("/integrations")({ component: Integrations });

const items = [
  { name: "Meta Ads API", emoji: "📘", connected: true },
  { name: "WhatsApp Business API", emoji: "💬", connected: true },
  { name: "Shopify", emoji: "🛒", connected: true },
  { name: "Bosta (شركة شحن)", emoji: "🚚", connected: false },
  { name: "ValU (تمويل)", emoji: "💳", connected: false },
  { name: "n8n Webhook", emoji: "🔗", connected: true },
];

function Integrations() {
  return (
    <>
      <TopBar title="الربط" subtitle="اربط حساباتك علشان البيانات تتجمع تلقائياً" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => (
          <div key={it.name} className="rounded-xl bg-card border border-border p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="size-12 rounded-lg bg-muted grid place-items-center text-2xl">{it.emoji}</div>
              <span className={`text-[11px] px-2 py-1 rounded ${
                it.connected
                  ? "bg-[oklch(0.72_0.18_145_/_0.2)] text-[oklch(0.72_0.18_145)]"
                  : "bg-muted text-muted-foreground"
              }`}>
                {it.connected ? "✅ متصل" : "غير متصل"}
              </span>
            </div>
            <div className="font-semibold mb-1">{it.name}</div>
            <p className="text-xs text-muted-foreground mb-4">
              {it.connected ? "البيانات بتتزامن كل 15 دقيقة" : "اضغط للربط"}
            </p>
            <Button size="sm" variant="outline" className="w-full">
              <Settings2 className="size-4 ml-1" /> {it.connected ? "إعدادات" : "اربط دلوقتي"}
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}
