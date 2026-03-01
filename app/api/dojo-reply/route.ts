import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const MODE_PERSONA: Record<string, string> = {
  casual:   "友人・知人として、日常的な会話をしています。",
  oneonone: "同じ職場の部下・同僚として、1on1の場で話しています。",
};

export async function POST(req: NextRequest) {
  const { mode, conversation } = await req.json();

  const persona = MODE_PERSONA[mode];
  if (!persona || !Array.isArray(conversation)) {
    return new Response("Invalid request", { status: 400 });
  }

  const historyText = (conversation as { role: string; text: string }[])
    .map((m) => `${m.role === "ai" ? "あなた" : "相手"}: ${m.text}`)
    .join("\n");

  const prompt = `あなたは${persona}

会話の流れ：
${historyText}

あなたの次の一言を返してください。
- 1〜2文、自然な話し言葉
- 具体的な内容を含み、聞き手が次の問いを立てやすい余地を残す
- 前置き・説明不要`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const reply = result.response.text().trim();
    return Response.json({ reply });
  } catch (error) {
    console.error("dojo-reply error:", error);
    return new Response("Failed to generate reply", { status: 500 });
  }
}
