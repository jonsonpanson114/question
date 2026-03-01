import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const MODE_LABELS: Record<string, string> = {
  casual:     "日常雑談",
  oneonone:   "仕事の1on1",
  introspect: "自己内省",
  book:       "読書振り返り",
};

export interface FeedbackData {
  score:       number;       // 1〜10
  good:        string;
  improve:     string | null;
  alternative: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { mode } = body;

  if (!mode) return new Response("Missing mode", { status: 400 });

  const modeLabel = MODE_LABELS[mode] ?? mode;
  let prompt: string;

  if (Array.isArray(body.conversation)) {
    // Rally mode: evaluate full conversation
    const conversation: { role: string; text: string }[] = body.conversation;
    const historyText = conversation
      .map((m) => `${m.role === "ai" ? "相手" : "あなた"}: ${m.text}`)
      .join("\n");
    const userQuestions = conversation
      .filter((m) => m.role === "user")
      .map((m, i) => `${i + 1}. ${m.text}`)
      .join("\n");

    prompt = `あなたは「${modeLabel}」のフォローアップクエスチョンコーチです。以下は会話の記録です。「あなた」の部分がユーザーが行った問いです。

会話記録：
${historyText}

ユーザーが行った問い：
${userQuestions}

上記の問いを総合的に評価してください。必ず以下のJSON形式のみで回答してください（前置き・説明不要）:

{
  "score": 1〜10の整数（問いの質を総合的に評価。1=ほぼ改善の余地あり、10=非常に優れた問い）,
  "good": "全体を通じて良かった点を1〜2文で（具体的に）",
  "improve": "改善できる点があれば1文で。なければ null",
  "alternative": "このラリーでさらに効果的だったと思われる問いの例（「〜ですか？」「〜でしょうか？」など）"
}`;
  } else {
    // Single mode: evaluate one question
    const { scenario, question } = body;
    if (!scenario || !question) {
      return new Response("Missing fields", { status: 400 });
    }

    prompt = `あなたは「${modeLabel}」のフォローアップクエスチョンコーチです。

【相手の発言】
${scenario}

【ユーザーが考えた問い】
${question}

上記の問いを評価してください。必ず以下のJSON形式のみで回答してください（前置き・説明不要）:

{
  "score": 1〜10の整数（問いの質を評価。1=ほぼ改善の余地あり、10=非常に優れた問い）,
  "good": "この問いの良かった点を1〜2文で（具体的に）",
  "improve": "改善できる点があれば1文で。なければ null",
  "alternative": "別の切り口の問いを1つ（「〜ですか？」「〜でしょうか？」「〜について？」など）"
}`;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" },
    });
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const data: FeedbackData = JSON.parse(raw);
    return Response.json(data);
  } catch (error) {
    console.error("dojo-feedback error:", error);
    return new Response("Failed to generate feedback", { status: 500 });
  }
}
