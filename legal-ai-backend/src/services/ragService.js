import axios from "axios";
import Groq from "groq-sdk";
import logger from "../config/logger.js";

// ─────────────────────────────────────
// إعدادات
// ─────────────────────────────────────
const RAG_API_URL = process.env.RAG_API_URL || "http://127.0.0.1:8000";
// ننشئ Groq عند أول استخدام (بعد ما يُقرأ .env)
let groq = null;
const getGroq = () => {
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
};
const LLM_MODEL = "llama-3.3-70b-versatile"; // موديل قوي يفهم العربي

// ─────────────────────────────────────
// 🔍 1. جلب المواد القانونية من Python RAG
// ─────────────────────────────────────
const retrieveArticles = async (question) => {
  const response = await axios.post(
    `${RAG_API_URL}/ask`,
    { question },
    { headers: { "Content-Type": "application/json" }, timeout: 30000 }
  );
  return response.data;
};
// ─────────────────────────────────────
// 🏷️ توليد عنوان ذكي للمحادثة
// ─────────────────────────────────────
export const generateChatTitle = async (question, answer) => {
  try {
    const completion = await getGroq().chat.completions.create({
      model: LLM_MODEL,
      messages: [
        {
          role: "system",
          content: `أنت أداة لتوليد عناوين قصيرة وذكية لمحادثات قانونية.

مهمتك: توليد عنوان مختصر (3-5 كلمات فقط) يلخّص موضوع المحادثة.

قواعد إلزامية:
1. العنوان باللغة العربية فقط
2. 3 إلى 5 كلمات كحد أقصى
3. بدون نقطة في النهاية
4. بدون علامات اقتباس
5. يصف الموضوع القانوني بدقة
6. تجاهل كلمات مثل: "ما هي"، "كيف"، "أريد أن أعرف"
7. ركّز على الموضوع القانوني الأساسي

أمثلة:
- سؤال: "ما هي حقوق العامل عند الفصل التعسفي" → "حقوق الفصل التعسفي"
- سؤال: "كم عدد ساعات العمل الأسبوعية في فلسطين" → "ساعات العمل الأسبوعية"
- سؤال: "أريد معرفة شروط صحة عقد الزواج" → "شروط صحة الزواج"
- سؤال: "ما هي عاصمة فلسطين" → "عاصمة فلسطين"
- سؤال: "المادة الثالثة من قانون العمل" → "المادة الثالثة - قانون العمل"

أجب بالعنوان فقط، بدون أي شرح أو إضافات.`,
        },
        {
          role: "user",
          content: `السؤال: ${question}\n\nالإجابة المختصرة: ${answer.substring(0, 200)}\n\nالعنوان:`,
        },
      ],
      temperature: 0.3,
      max_tokens: 30,
    });

    let title = completion.choices[0]?.message?.content?.trim() || "";
    
    // تنظيف العنوان
    title = title
      .replace(/["'""]/g, "")        // شيل علامات الاقتباس
      .replace(/[.。]+$/, "")         // شيل النقطة بالنهاية
      .replace(/^(العنوان|عنوان)[:：]\s*/i, "")  // شيل "العنوان:" لو طلعت
      .trim();

    // لو فاضي أو طويل، رجع fallback
    if (!title || title.length > 60) {
      return question.substring(0, 40);
    }

    return title;
  } catch (error) {
    logger.error(`❌ Title generation error: ${error.message}`);
    // fallback: استخدم أول 40 حرف
    return question.substring(0, 40);
  }
};

// ─────────────────────────────────────
// 🧠 2. البرومبت الذكي (دماغ المساعد)
// ─────────────────────────────────────
const buildSystemPrompt = (articles) => {
  // نحضّر نص المواد
  const articlesText =
    articles.length > 0
      ? articles
          .map(
            (a, i) =>
              `[مادة ${i + 1}]
القانون: ${a.law}
رقم المادة: ${a.article}
النص الأصلي: ${a.article_text}
الشرح المرجعي: ${a.explanation || "لا يوجد شرح مرجعي"}`
          )
          .join("\n\n━━━━━━━━━━━━━━━━━━━━\n\n")
      : "لم يتم العثور على مواد قانونية مطابقة بدقة.";

  return `أنت "المساعد القانوني الذكي" متخصص في القانون الفلسطيني.

دورك: تقديم استشارات قانونية موثوقة بأسلوب مهني وواضح.

═══════════════════════════════════════
المواد القانونية المسترجعة:
═══════════════════════════════════════
${articlesText}
═══════════════════════════════════════

📋 **تعليمات صياغة الإجابة (مهمة جداً):**

استخدم البنية التالية عند الإجابة على سؤال قانوني:

═══════════════════════════════════════

📜 **النص القانوني الرسمي:**
[انسخ النص الأصلي للمادة كما هو من "النص الأصلي" بدون تعديل]

📚 **المرجع:** المادة [رقم] من [اسم القانون]

═══════════════════════════════════════

💡 **الشرح المبسط:**
[استخدم "الشرح المرجعي" وأعد صياغته بلغة سهلة]

═══════════════════════════════════════

🎯 **التفسير والتطبيق:**
[فسّر معنى المادة عملياً مع أمثلة بسيطة]

═══════════════════════════════════════

⚖️ **قواعد إلزامية:**

1. **التعامل مع سياق المحادثة:**
   - إذا كان السؤال الجديد عن **نفس الموضوع** السابق (مثل سؤال متابعة): استخدم السياق السابق وأجب بناءً عليه
   - إذا كان السؤال الجديد عن **موضوع مختلف تماماً** (مثل الانتقال من العمل إلى الزواج): تعامل معه كسؤال جديد ومستقل، ولا تحاول الربط بالموضوع السابق
   - **مؤشر التغيير:** انتبه للكلمات المفتاحية. مثلاً "حقوق العامل" مختلف عن "شروط الزواج" تماماً

2. **النص القانوني الرسمي:**
   - يجب أن يظهر النص الأصلي كما هو **بدون تعديل**
   - لا تختصر، لا تعيد صياغة، لا تُضف كلمات

3. **اقتراحات المتابعة:**
   - أسئلة محددة (مثل "المادة رقم X"): أجب مباشرة **بدون اقتراحات**
   - أسئلة عامة: يمكنك اقتراح **سؤال واحد فقط** للمتابعة

4. **منع الهلوسة:**
   - لا تخترع مواد أو أرقام غير موجودة في المرجع
   - استند فقط على المواد المرفقة أعلاه
   - إذا لم تكن متأكداً، قل ذلك بصراحة

5. **عدم وجود مادة مناسبة:**
   - وضّح بلطف
   - اقترح مواضيع قريبة
   - لا تخترع إجابة

6. **اللغة:**
   - عربي فصيح ومبسط
   - أسلوب مهني محترم
   - تجنب التكرار

7. **التحذير القانوني:**
   - اذكر بإيجاز (سطر واحد) أن هذه استشارة إرشادية لا تغني عن محامٍ مختص`;
};

// ─────────────────────────────────────
// 💬 3. توليد الإجابة الذكية عبر Groq
// ─────────────────────────────────────
const generateSmartAnswer = async (question, articles, history = []) => {
  const messages = [
    { role: "system", content: buildSystemPrompt(articles) },
    // الذاكرة: آخر رسائل المحادثة
    ...history,
    { role: "user", content: question },
  ];

  const completion = await getGroq().chat.completions.create({
    model: LLM_MODEL,
    messages,
    temperature: 0.4, // إجابات متّزنة (مش عشوائية كتير)
    max_tokens: 1024,
  });

  return completion.choices[0]?.message?.content || "";
};

// ─────────────────────────────────────
// 🎯 الدالة الرئيسية (نفس الاسم القديم)
// ─────────────────────────────────────
export const askLegalQuestion = async (question, history = []) => {
  try {
    const startTime = Date.now();

    // 1) جيب المواد من خوارزمية صاحبك
    const ragData = await retrieveArticles(question);
    const articles = ragData.top_matches || [];

    // 2) خلّي Groq يصيغ إجابة ذكية
    const smartAnswer = await generateSmartAnswer(question, articles, history);

    const responseTime = Date.now() - startTime;
    logger.info(`⚖️ Smart answer generated in ${responseTime}ms`);

    return {
      success: true,
      answer: smartAnswer,
      topMatches: articles,
      disclaimer: ragData.disclaimer,
      responseTime,
    };
  } catch (error) {
    logger.error(`❌ RAG/LLM error: ${error.message}`);
    return {
      success: false,
      answer: "عذراً، حدث خطأ في معالجة سؤالك. تأكد أن الخدمات تعمل وحاول مرة أخرى.",
      topMatches: [],
      disclaimer: null,
      responseTime: 0,
    };
  }
};