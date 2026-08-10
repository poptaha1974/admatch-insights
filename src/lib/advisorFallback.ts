import type { PlannerInputs, PlannerOutputs } from "@/stores/planner";

type Ctx = PlannerInputs & PlannerOutputs;

export function generateFallbackReply(_userText: string, _d: Ctx): string {
  return [
    "لا يمكن تقديم توصية دقيقة في وضع fallback.",
    "السبب: لا يوجد اتصال backend live حالياً.",
    "المتاح الآن: إعادة المحاولة بعد تفعيل /api/advisor/chat مع بيانات Meta الحية.",
  ].join("\n");
}
