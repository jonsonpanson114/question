import { NextRequest } from "next/server";
import { createGeminiClient } from "../_lib/gemini";

const SPEAKERS = {
  ハル: "30代の男性会社員。少し皮肉屋だが根は優しい。猫の「部長」とよく話す。口調は少しぶっきらぼうだがウィットがある。「俺は〜」という口調。",
  ソラ: "35歳の女性翻訳家。強い芯を持つが脆さも隠し持つ。理知的だが感情豊か。「私は〜」という口調。",
} as const;

type Speaker = keyof typeof SPEAKERS;

export async function POST(req: NextRequest) {
  const { entries, speaker } = await req.json();

  if (!speaker || !(speaker in SPEAKERS)) {
    return new Response("Invalid speaker", { status: 400 });
  }

  const recentEntries: string[] = Array.isArray(entries) ? entries.slice(-3) : [];
  const entriesText =
    recentEntries.length > 0
      ? `最近のユーザーの気づきや記録:\n${recentEntries.join("\n---\n")}`
      : "ユーザーの記録はまだありません。";

  const prompt = `あなたは${speaker}です。${SPEAKERS[speaker as Speaker]}

${entriesText}

今日の「問いの道場」の練習を始めるための一言を日本語で伝えてください。
- フォローアップクエスチョンを練習することへの前向きな気持ちを引き出す
- 道場らしい、凛とした、余白のある表現で
- 1〜2文、120文字以内
- 説教がましくなく、そっと背中を押す言葉
- 重複を避け、前回とは異なる切り口で伝えてください
- 絵文字・署名は不要`;

  try {
    const model = createGeminiClient().getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: { temperature: 1.0 },
    });
    const result = await model.generateContent(prompt);
    const message = result.response.text().trim();
    return Response.json({ message, speaker });
  } catch (error) {
    console.error("Gemini API error:", error);
    return new Response("Failed to generate message", { status: 500 });
  }
}

