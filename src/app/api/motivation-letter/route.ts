import OpenAI from "openai";
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "生成服务暂不可用，请稍后重试" }, { status: 503 });
  try {
    const input = await request.json();
    const response = await new OpenAI({ apiKey, timeout: 105_000, maxRetries: 1 }).responses.create({ model: process.env.OPENAI_RECOMMENDATION_MODEL ?? "gpt-5-mini", reasoning: { effort: "low" }, max_output_tokens: 2400, instructions: "You are Atlas's university application writing specialist. Write a truthful, polished, school-specific English motivation letter. Use only supplied student facts; never invent achievements. Connect the applicant's background to the named programme, its characteristics and admissions expectations. Keep it within one A4 page, about 450-650 words. Do not mention AI, ChatGPT, OpenAI, prompts, or internal matching. Return plain letter text only.", input: JSON.stringify(input) });
    const letter = response.output_text?.trim();
    if (!letter) return NextResponse.json({ error: "生成结果无效，请重试" }, { status: 502 });
    console.info("[atlas-document-generation]", { requestStarted: true, documentType: "motivation_letter", generated: true });
    return NextResponse.json({ letter });
  } catch { return NextResponse.json({ error: "动机信生成失败，请稍后重试" }, { status: 502 }); }
}

