import { NextRequest } from "next/server";
import { createGeminiClient } from "../_lib/gemini";

const MODE_CONTEXTS: Record<string, { context: string; instruction: string }> = {
  casual: {
    context: "友人・知人との日常的な会話の場面",
    instruction:
      "友人が話しかけてくるような自然な発言を1つ作ってください。日常の出来事、感情、気づきなどを含む2〜3文。フォローアップ質問を考えやすい内容で。",
  },
  oneonone: {
    context: "職場での1on1面談や振り返りの場面",
    instruction:
      "部下や同僚が1on1で話すような発言を1つ作ってください。仕事上の課題・成功体験・悩みなどを含む2〜3文。マネージャーがフォローアップ質問を考えやすい内容で。",
  },
  introspect: {
    context: "自分自身の内面を探る内省の場面",
    instruction:
      "自分の心の中でふと浮かぶような内省的な独り言・気持ちを1つ作ってください。感情・価値観・迷い・気づきなどを含む2〜3文。自分自身への問いを考えやすい内容で。",
  },
  book: {
    context: "読んだ本や記事について振り返る場面",
    instruction:
      "読書会や読書ノートで誰かが語るような発言を1つ作ってください。本から得た気づき・疑問・印象に残った言葉などを含む2〜3文。フォローアップ質問を考えやすい内容で。",
  },
};

export async function POST(req: NextRequest) {
  const { mode, entries, bookTitle, bookAuthor } = await req.json();
  const ctx = MODE_CONTEXTS[mode];
  if (!ctx) return new Response("Invalid mode", { status: 400 });

  // 気づき/読書エントリの文脈を構築
  let entryContext = "";
  if (Array.isArray(entries) && entries.length > 0) {
    entryContext = `【ユーザーの最近の気づき・読書の気づき（文脈として参考）】
${entries.map((e: string, i: number) => `${i + 1}. ${e}`).join("\n")}

`;
  }

  // bookモードの場合、本情報も文脈に追加
  let bookContext = "";
  if (mode === "book" && bookTitle) {
    bookContext = `【読んでいる本】
タイトル: ${bookTitle}${bookAuthor ? `\n著者: ${bookAuthor}` : ""}

`;
  }

  const prompt = `あなたは「${ctx.context}」でのフォローアップクエスチョン練習用シナリオを生成するAIです。
${bookContext}${entryContext}${ctx.instruction}

条件:
- 日本語で自然な話し言葉
- 具体的で、聴き手が問いを立てやすい内容
- 重複を避け、毎回異なる新しいシチュエーションや人間関係を生成すること
- 説明的すぎず、余白を残す
- シナリオ本文だけを出力し、前置きや説明は一切不要`;

  try {
    const model = createGeminiClient().getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: { temperature: 1.0 },
    });
    const result = await model.generateContent(prompt);
    const scenario = result.response.text().trim();
    return Response.json({ scenario });
  } catch (error) {
    console.error("dojo-scenario error:", error);
    return new Response("Failed to generate scenario", { status: 500 });
  }
}

