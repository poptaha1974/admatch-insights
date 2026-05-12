import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles, MessageSquarePlus } from "lucide-react";
import { useAdvisorChatStore } from "@/stores/advisorChat";

export const Route = createFileRoute("/advisor/")({ component: AdvisorIndex });

const SUGGESTIONS = [
  "حلّل أرقامي واقترح 3 خطوات قابلة للتنفيذ النهارده",
  "اكتبلي سكريبت إعلان Meta لمنتج Karohat",
  "اعملي رسائل تأكيد طلب SMS / واتساب",
  "اكتب وصف منتج SEO عربي + إنجليزي",
  "اعملي Persona تفصيلية للعميل المثالي",
  "ردود الكول سنتر على اعتراض «السعر غالي»",
];

function AdvisorIndex() {
  const createThread = useAdvisorChatStore((s) => s.createThread);
  const navigate = useNavigate();

  const startWith = (prompt?: string) => {
    const id = createThread(prompt ? prompt.slice(0, 36) : "محادثة جديدة");
    navigate({
      to: "/advisor/$threadId",
      params: { threadId: id },
      search: prompt ? { q: prompt } : undefined,
    });
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-2xl w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 mx-auto">
          <Sparkles className="size-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">إزيك يا دكتور إيهاب 👋</h2>
          <p className="text-sm text-muted-foreground">
            أنا المستشار الذكي بتاع AdMatch. اسألني أي حاجة عن حملاتك، تسعير، إعلانات، أو تشغيل الكول سنتر.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-2 text-right">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => startWith(s)}
              className="text-sm rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-primary/5 px-4 py-3 transition leading-relaxed"
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={() => startWith()}
          className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground text-sm px-5 py-2.5 hover:bg-primary/90 transition"
        >
          <MessageSquarePlus className="size-4" />
          ابدأ محادثة فاضية
        </button>
      </div>
    </div>
  );
}
