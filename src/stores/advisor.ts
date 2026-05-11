import { create } from "zustand";
import type { PlannerInputs, PlannerOutputs } from "./planner";

export type ToolId = "strategy" | "adcopy" | "sms" | "desc" | "persona" | "supplier" | "objection";

type Result = { tool: ToolId; content: string; generatedAt: string };

type Store = {
  currentTool: ToolId | null;
  isLoading: boolean;
  result: Result | null;
  error: string | null;
  generate: (tool: ToolId, plannerData: PlannerInputs & PlannerOutputs) => Promise<void>;
  reset: () => void;
};

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000";

const fallback: Record<ToolId, (d: PlannerInputs & PlannerOutputs) => string> = {
  strategy: (d) => `## خطة عمل لمنتج ${d.productName}\n\n**الوضع الحالي:** صافي ربح يومي **${d.netProfit.toFixed(0)} ج.م**، Real CPA = **${isFinite(d.realCpa) ? d.realCpa.toFixed(0) : "∞"} ج.م**.\n\n### 3 خطوات قابلة للتنفيذ:\n1. **حسّن الـ Targeting**: ركّز على audiences عمرها 28-45 من القاهرة والإسكندرية.\n2. **ارفع نسبة التأكيد** من ${d.confirmRate}% لـ 85% — درّب الكول سنتر على سكريبت قصير.\n3. **اختبر سعر ${(d.price + 50).toFixed(0)} ج.م** لمدة 7 أيام، لو ROAS فضل فوق 2 خليه.`,
  adcopy: (d) => `## سكريبتات إعلانات لـ ${d.productName}\n\n### Meta:\n🔥 ${d.productName} — وفّر وقتك ووفّر صحتك!\nاطبخ من غير زيت • توفير في الكهربا • تنظيف سهل\n👈 اطلب دلوقتي بـ ${d.price} ج.م\n\n### TikTok:\nPOV: لما تكتشف إن الأكل بيتعمل من غير زيت 🤯\n\n### Retargeting:\nشوفت ${d.productName} وملحقتش تطلبه؟ خصم 10% للي يطلب النهارده فقط.`,
  sms: (d) => `## رسايل تأكيد طلب\n\n**صيغة 1:** أهلاً، طلبك من ${d.productName} اتأكد ✅ هيوصلك خلال 2-3 أيام. أي استفسار: 0100xxxxxxx\n\n**صيغة 2:** عميلنا العزيز، شكراً لطلبك ${d.productName} بـ ${d.price} ج.م. الدفع عند الاستلام 💵\n\n**صيغة 3 (WhatsApp):** السلام عليكم 🌹 طلبك في الطريق. كاش أوكي؟`,
  desc: (d) => `## وصف منتج SEO\n\n### عربي:\n${d.productName} — الحل الأمثل للأكل الصحي. سعة كبيرة، استهلاك كهربا قليل، سهل التنظيف. السعر: ${d.price} ج.م.\n\n### English:\n${d.productName} — The smart way to cook healthy meals at home. Large capacity, low power consumption, easy cleanup. Price: EGP ${d.price}.`,
  persona: (d) => `## شخصية العميل المثالي لـ ${d.productName}\n\n- **الاسم:** أم محمد\n- **العمر:** 32-42\n- **المكان:** القاهرة الكبرى / الإسكندرية\n- **الدخل:** 8,000-15,000 ج.م/شهر\n- **الاهتمامات:** صحة الأسرة، توفير الوقت، الطبخ البيتي\n- **نقطة الألم:** مش عندها وقت تطبخ كل يوم بزيت ومشاكله\n- **القرار الشرائي:** بتسأل صحبتها وبتشوف الـ reviews`,
  supplier: (d) => `## إيميل تفاوض مع المورد\n\n**عربي:**\nالأستاذ المحترم،\nبنطلب من حضرتك ${d.productName} بانتظام، ومهتمين نزود الكميات. ممكن نتفق على سعر ${(d.cost * 0.9).toFixed(0)} ج.م للقطعة بدل ${d.cost} لو طلبنا 200 قطعة شهرياً؟\n\n**English:**\nDear Supplier,\nWe would like to negotiate a bulk price of EGP ${(d.cost * 0.9).toFixed(0)} per unit for orders of 200+ units monthly. Awaiting your reply.`,
  objection: () => `## ردود الكول سنتر على الاعتراضات\n\n**1) "السعر غالي"**\n← أتفهم حضرتك. بس لو حسبنا توفير الزيت والكهربا بيرجع سعره في 3 شهور.\n\n**2) "هفكر وأرجعلك"**\n← تمام، بس العرض ده النهارده بس. ممكن أحجزهولك ساعة؟\n\n**3) "مش متأكد من الجودة"**\n← عندنا ضمان استرجاع 14 يوم. لو مش عاجبك ترجعه ببلاش.`,
};

export const useAdvisorStore = create<Store>((set) => ({
  currentTool: null,
  isLoading: false,
  result: null,
  error: null,
  reset: () => set({ result: null, error: null, currentTool: null }),
  generate: async (tool, plannerData) => {
    set({ isLoading: true, error: null, currentTool: tool });
    try {
      const res = await fetch(`${API_URL}/api/advisor/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, plannerData }),
      });
      if (!res.ok) throw new Error("backend offline");
      const data = (await res.json()) as Result;
      set({ result: data, isLoading: false });
    } catch {
      // fallback to local generation if backend not reachable
      set({
        result: { tool, content: fallback[tool](plannerData), generatedAt: new Date().toISOString() },
        isLoading: false,
        error: "Backend غير متاح — يتم عرض نتيجة محلية تجريبية.",
      });
    }
  },
}));
