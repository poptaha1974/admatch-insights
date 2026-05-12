import type { PlannerInputs, PlannerOutputs } from "@/stores/planner";

type Ctx = PlannerInputs & PlannerOutputs;

type Intent =
  | "strategy"
  | "adcopy"
  | "sms"
  | "desc"
  | "persona"
  | "supplier"
  | "objection"
  | "general";

function detectIntent(text: string): Intent {
  const t = text.toLowerCase();
  if (/(إعلان|اعلان|سكريبت|copy|tiktok|ميتا|reel|فيديو)/i.test(t)) return "adcopy";
  if (/(رسال|تأكيد|sms|whats|واتس|كونفرم|confirm)/i.test(t)) return "sms";
  if (/(وصف|description|seo|أمازون|amazon)/i.test(t)) return "desc";
  if (/(persona|شخصية|بيرسونا|عميل\s+مثالي|جمهور)/i.test(t)) return "persona";
  if (/(مورد|supplier|تفاوض|سعر\s*الجملة)/i.test(t)) return "supplier";
  if (/(اعتراض|كول\s*سنتر|رد|الزبون|العميل\s+بيقول)/i.test(t)) return "objection";
  if (/(خطة|استراتيج|تحسين|نصيحة|اقتراح|نعمل\s+إيه|ايه\s+رأيك)/i.test(t)) return "strategy";
  return "general";
}

export function generateFallbackReply(userText: string, d: Ctx): string {
  const intent = detectIntent(userText);
  switch (intent) {
    case "adcopy":
      return `## سكريبتات إعلانات لـ ${d.productName}

**Meta — صورة + كابشن:**
🔥 ${d.productName} وصل! اطبخ صحي من غير زيت — يوفّر وقتك ومصاريفك.
السعر: ${d.price.toFixed(0)} ج.م • الدفع عند الاستلام • شحن لكل مصر
👈 اطلب دلوقتي

**TikTok — Hook:**
"بقالي شهر ببطّل قلي بزيت… شوف عملت إيه 👇"
ثم استعراض المنتج لمدة 15 ثانية.

**Retargeting:**
شوفت ${d.productName} وما طلبتوش؟ خصم خاص النهارده فقط.`;
    case "sms":
      return `## رسائل تأكيد الطلب

**صيغة 1 (رسمية):**
أهلاً بحضرتك 👋 طلبك من ${d.productName} اتأكد ✅ هيوصل خلال 2-3 أيام. أي استفسار: 0100xxxxxxx

**صيغة 2 (ودّية):**
شكراً لطلبك ${d.productName} بـ ${d.price.toFixed(0)} ج.م 💛 الدفع عند الاستلام كاش.

**صيغة 3 (واتساب):**
السلام عليكم 🌹 طلبك في الطريق إن شاء الله. لو محتاج أي تعديل ابعتلي هنا.`;
    case "desc":
      return `## وصف المنتج

### عربي (SEO):
**${d.productName}** — الحل الأمثل للأكل الصحي في البيت. سعة كبيرة، استهلاك كهربا أقل، وسهل التنظيف. بيخليك تطبخ من غير زيت وبنفس طعم القلي.
- ✅ ضمان استرجاع 14 يوم
- 🚚 شحن لكل المحافظات
- 💵 الدفع عند الاستلام
السعر: **${d.price.toFixed(0)} ج.م**

### English:
**${d.productName}** — Cook healthy meals at home with little to no oil. Large capacity, low power, easy to clean.
Price: **EGP ${d.price.toFixed(0)}** • Cash on Delivery • 14-day return.`;
    case "persona":
      return `## شخصية العميل المثالي لـ ${d.productName}

- **الاسم:** أم محمد
- **العمر:** 32–42
- **المكان:** القاهرة الكبرى / الإسكندرية / الجيزة
- **الدخل الشهري:** 8,000 – 15,000 ج.م
- **الاهتمامات:** صحة الأسرة، توفير الوقت، الطبخ البيتي
- **نقطة الألم:** مفيش وقت تطبخ كل يوم بزيت ومشاكله الصحية
- **اعتراضها الأساسي:** السعر مقارنة بالمحلات
- **الـ Trigger الشرائي:** Reviews + خصم محدود زمنياً + ضمان`;
    case "supplier":
      return `## إيميل تفاوض مع المورد

**عربي:**
الأستاذ المحترم،
بنطلب من حضرتك ${d.productName} بانتظام، وعايزين نزود الكميات. ممكن نتفق على سعر **${(d.cost * 0.9).toFixed(0)} ج.م** للقطعة بدل ${d.cost.toFixed(0)} لو طلبنا 200 قطعة شهرياً؟ هنلتزم بدفعات أسبوعية ومواعيد ثابتة.
شكراً لتعاونكم.

**English:**
Dear Supplier,
We'd like to negotiate a bulk price of **EGP ${(d.cost * 0.9).toFixed(0)}** per unit for monthly orders of 200+ units. We commit to weekly payments and fixed schedules.
Best regards.`;
    case "objection":
      return `## ردود الكول سنتر على الاعتراضات

**1) "السعر غالي"**
← أتفهم حضرتك. بس لو حسبنا توفير الزيت والكهربا، بيرجع سعره خلال 3 شهور تقريباً. وكمان عندك ضمان استرجاع 14 يوم.

**2) "هفكر وأرجعلك"**
← تمام طبعاً. بس العرض ده محدود لحد آخر النهارده. تحبي أحجزهولك ساعة ولو ما اتأكدتيش هنلغي بدون مشاكل؟

**3) "مش متأكد من الجودة"**
← منتجنا عليه أكتر من 1,200 reviews إيجابية، وعندك 14 يوم تجربة. لو مش عاجبك ترجعه ببلاش ومن غير أسئلة.`;
    case "strategy":
    case "general":
    default: {
      const profitColor = d.netProfit >= 0 ? "✅" : "🔴";
      const cpaText = isFinite(d.realCpa) ? `${d.realCpa.toFixed(0)} ج.م` : "∞";
      return `## تحليل سريع لوضع ${d.productName}

${profitColor} **صافي الربح اليومي:** ${d.netProfit.toFixed(0)} ج.م
📊 **Real CPA:** ${cpaText} • **ROAS:** ${d.roas.toFixed(2)} • **ROI:** ${d.roi.toFixed(0)}%
📦 **مخزون كافي:** ${d.daysOfInventory} يوم

### 3 خطوات قابلة للتنفيذ النهارده:
1. **حسّن نسبة التأكيد** (حالياً ${d.confirmRate}%) → اهدف لـ 85% بسكريبت كول سنتر مختصر (3 أسئلة فقط).
2. **اختبر السعر** — جرّب ${(d.price + 50).toFixed(0)} ج.م لمدة 7 أيام، لو ROAS فضل فوق 2 خليه.
3. **ركّز Audience** على عمر 28–45 من القاهرة والإسكندرية (أعلى confirm rate تاريخياً).

> 💡 لو عايز نعمق في أي خطوة، اسألني — مثلاً: "اكتبلي سكريبت كول سنتر" أو "اقترح إعلان TikTok".

---
_⚠️ الـ Backend مش متاح حالياً، الرد ده مولّد محلياً._`;
    }
  }
}
