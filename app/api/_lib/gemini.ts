import { GoogleGenerativeAI } from "@google/generative-ai";

export function createGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  return new GoogleGenerativeAI(apiKey);
}
