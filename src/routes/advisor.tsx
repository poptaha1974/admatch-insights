import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { useAdvisorStore, type ToolId } from "@/stores/advisor";
import { usePlannerStore } from "@/stores/planner";
import {
  Target, FileText, MessageSquare, BookOpen, User, Mail, Phone, Loader2, Copy, RefreshCw, Download, Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export const Route = createFileRoute("/advisor")({ component: Advisor });

const tools: { id: ToolId; title: string; desc: string; icon: typeof Target }[] = [
  { id: "strategy", title: "🎯 خطة عمل استراتيجية", desc: "حلل أرقامك واقترح 3 خطوات قابلة للتنفيذ فوراً", icon: Target },
  { id: "adcopy", title: "📝 سكريبتات إعلانات", desc: "TikTok + Meta + Retargeting scripts", icon: FileText },
  { id: "sms", title: "💬 رسايل تأكيد طلب", desc: "3 صيغ SMS/WhatsApp جاهزة", icon: MessageSquare },
  { id: "desc", title: "📄 وصف منتج SEO", desc: "وصف Amazon-ready عربي + إنجليزي", icon: BookOpen },
  { id: "persona", title: "👤 شخصية العميل (Persona)", desc: "Buyer persona تفصيلية", icon: User },
  { id: "supplier", title: "🤝 إيميل تفاوض مع المورد", desc: "عربي + English version", icon: Mail },
  { id: "objection", title: "📞 ردود الكول سنتر", desc: "ردود على 3 اعتراضات شائعة", icon: Phone },
];

function Advisor() {
  const { generate, isLoading, result, currentTool, error } = useAdvisorStore();
  const { inputs, outputs } = usePlannerStore();

  const run = (tool: ToolId) => generate(tool, { ...inputs, ...outputs });

  return (
    <>
      <TopBar title="المستشار الذكي" subtitle="7 أدوات AI شغالة بالعامية المصرية" />

      <div className="rounded-xl p-4 mb-6 border border-primary/30 bg-gradient-to-l from-primary/15 to-primary/5">
        <div className="flex items-start gap-3">
          <Sparkles className="size-5 text-primary mt-0.5 shrink-0" />
          <p className="text-sm">
            الأدوات دي بتشتغل على Backend Python خاص بيك (FastAPI + Gemini). تأكد إن الـ API URL محدد في{" "}
            <code className="px-1.5 py-0.5 rounded bg-muted text-xs">.env</code> كـ{" "}
            <code className="px-1.5 py-0.5 rounded bg-muted text-xs">VITE_API_URL=http://localhost:8000</code>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {tools.map((t) => {
          const Icon = t.icon;
          const loading = isLoading && currentTool === t.id;
          return (
            <div key={t.id} className="rounded-xl bg-card border border-border p-5 hover:border-primary/50 transition-colors">
              <Icon className="size-6 text-primary mb-3" />
              <div className="font-semibold mb-1">{t.title}</div>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{t.desc}</p>
              <Button size="sm" disabled={loading} onClick={() => run(t.id)} className="w-full">
                {loading ? <><Loader2 className="size-4 ml-1 animate-spin" /> جاري التوليد…</> : "توليد"}
              </Button>
            </div>
          );
        })}
      </div>

      {result && (
        <div className="rounded-xl bg-card border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold">{tools.find((t) => t.id === result.tool)?.title}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 num">
                {new Date(result.generatedAt).toLocaleString("ar-EG")}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => {
                navigator.clipboard.writeText(result.content);
                toast.success("اتنسخ النص");
              }}>
                <Copy className="size-4 ml-1" /> نسخ
              </Button>
              <Button size="sm" variant="outline" onClick={() => run(result.tool)}>
                <RefreshCw className="size-4 ml-1" /> إعادة
              </Button>
              <Button size="sm" variant="outline" onClick={() => {
                const blob = new Blob([result.content], { type: "text/plain;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `${result.tool}.txt`; a.click();
                URL.revokeObjectURL(url);
              }}>
                <Download className="size-4 ml-1" /> تنزيل
              </Button>
            </div>
          </div>
          {error && (
            <div className="text-[11px] text-[oklch(0.82_0.18_55)] mb-3 px-3 py-2 rounded-md border border-[oklch(0.72_0.18_55_/_0.3)] bg-[oklch(0.72_0.18_55_/_0.08)]">
              {error}
            </div>
          )}
          <article className="prose prose-invert prose-sm max-w-none prose-headings:text-foreground prose-strong:text-foreground prose-p:text-foreground/90">
            <ReactMarkdown>{result.content}</ReactMarkdown>
          </article>
        </div>
      )}
    </>
  );
}
