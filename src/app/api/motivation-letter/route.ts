import OpenAI from "openai";
import { motivationLetterRequestSchema } from "@/lib/server/api-schemas";
import { apiError, apiException, apiResponse, createApiContext, enforceLimit, parseJson, secureLog, stableHash, validateMutationOrigin } from "@/lib/server/api-security";

export const runtime = "nodejs";
const PROMPT_VERSION = "atlas-motivation-letter-v1"; const cache = new Map<string, { expiresAt: number; letter: string }>(); const inflight = new Map<string, Promise<string>>();

export async function POST(request: Request) {
  const ctx = createApiContext(request); const startedAt = Date.now(); const model = process.env.OPENAI_RECOMMENDATION_MODEL ?? "gpt-5-mini";
  try {
    if (!validateMutationOrigin(request)) throw apiException("FORBIDDEN_ORIGIN", 403);
    const previewDemoEnabled = process.env.VERCEL_ENV === "preview";
    if (process.env.ATLAS_MOTIVATION_LETTER_ENABLED !== "true" && !previewDemoEnabled) throw apiException("ENTITLEMENT_REQUIRED", 403);
    await enforceLimit(ctx, "motivation:minute", 2, 60_000); await enforceLimit(ctx, "motivation:daily", 5, 86_400_000, "DAILY_QUOTA_EXCEEDED");
    const input = await parseJson(request, motivationLetterRequestSchema, 24_000); const key = `${ctx.sessionId}:${request.headers.get("idempotency-key")?.slice(0, 128) ?? stableHash(input)}`; const existing = cache.get(key);
    if (existing && existing.expiresAt > Date.now()) return apiResponse(ctx, { letter: existing.letter, cached: true });
    const apiKey = process.env.OPENAI_API_KEY; if (!apiKey) throw apiException("SERVICE_UNAVAILABLE", 503);
    let pending = inflight.get(key); if (!pending) {
      pending = new OpenAI({ apiKey, timeout: 45_000, maxRetries: 1 }).responses.create({ model, max_output_tokens: 1800, instructions: "You are Atlas's university application writing specialist. Write a truthful, polished, school-specific English motivation letter using only supplied facts. Never invent achievements. Keep it within 450-650 words. Return plain letter text only.", input: JSON.stringify(input) }).then(response => { const letter = response.output_text?.trim(); if (!letter) throw apiException("SERVICE_UNAVAILABLE", 502); secureLog("info", "openai_usage", ctx, { model, promptVersion: PROMPT_VERSION, inputTokens: response.usage?.input_tokens, outputTokens: response.usage?.output_tokens }); return letter; });
      inflight.set(key, pending);
    }
    const letter = await pending; inflight.delete(key); cache.set(key, { expiresAt: Date.now() + 10 * 60_000, letter }); secureLog("info", "motivation_complete", ctx, { durationMs: Date.now() - startedAt, model, promptVersion: PROMPT_VERSION }); return apiResponse(ctx, { letter });
  } catch (error) { secureLog("warn", "motivation_failed", ctx, { durationMs: Date.now() - startedAt, model, promptVersion: PROMPT_VERSION, errorCode: error instanceof Error ? error.name : "UNKNOWN" }); return apiError(ctx, error); }
}
