import { recommendations } from "@/lib/application-prototype-data";
import { RECOMMENDATION_MODEL, RECOMMENDATION_PROMPT_VERSION, SchoolRecommendationError } from "@/lib/recommendation/ai-recommendation";
import { orchestrateRecommendations } from "@/lib/recommendation/orchestrator";
import { apiError, apiException, apiResponse, createApiContext, enforceLimit, parseJson, secureLog, stableHash, validateMutationOrigin } from "@/lib/server/api-security";
import { recommendationRequestSchema } from "@/lib/server/api-schemas";
import { normalizeStudentProfile } from "@/lib/student-profile";

export const maxDuration = 120;
const cache = new Map<string, { expiresAt: number; value: unknown }>();
const inflight = new Map<string, Promise<unknown>>();

export async function POST(request: Request) {
  const ctx = createApiContext(request); const startedAt = Date.now();
  try {
    if (!validateMutationOrigin(request)) throw apiException("FORBIDDEN_ORIGIN", 403);
    const body = await parseJson(request, recommendationRequestSchema, 48_000);
    await enforceLimit(ctx, "recommendations:minute", 3, 60_000); await enforceLimit(ctx, "recommendations:daily", 15, 86_400_000, "DAILY_QUOTA_EXCEEDED");
    const profile = normalizeStudentProfile((body.profile ?? body) as Record<string, unknown>); const profileHash = stableHash(profile); const idempotencyKey = request.headers.get("idempotency-key")?.slice(0, 128) ?? profileHash;
    const key = `${ctx.sessionId}:${idempotencyKey}:${profileHash}`; const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) { secureLog("info", "recommendation_cache_hit", ctx, { durationMs: Date.now() - startedAt }); return apiResponse(ctx, cached.value); }
    let pending = inflight.get(key); if (!pending) {
      pending = orchestrateRecommendations({ profile, internalProgrammes: recommendations, plannedApplicationCount: body.plannedApplicationCount ?? 12 }).then(result => {
        const publicCandidates = result.candidates.map(({ aiRecommendation: _ai, generatedByAI: _generated, ...candidate }) => candidate);
        return { ...result, debug: undefined, candidates: publicCandidates, disclaimer: "Atlas 根据用户资料生成候选选校方案并核验官方来源；待核验项目不代表已确认招生信息。" };
      }); inflight.set(key, pending);
    }
    const value = await pending; cache.set(key, { expiresAt: Date.now() + 10 * 60_000, value }); inflight.delete(key);
    const result = value as { candidates?: Array<{ verificationStatus?: string }>; generationStatus?: string; aiStatus?: string; aiErrorCode?: string };
    const candidates = result.candidates ?? []; const verifiedCount = candidates.filter(item => item.verificationStatus === "verified").length;
    secureLog(result.generationStatus === "complete" ? "info" : "warn", result.generationStatus === "empty" ? "recommendation_empty" : result.generationStatus === "partial" ? "recommendation_partial" : "recommendation_complete", ctx, { durationMs: Date.now() - startedAt, model: RECOMMENDATION_MODEL, promptVersion: RECOMMENDATION_PROMPT_VERSION, candidateCount: candidates.length, verifiedCount, pendingCount: candidates.length - verifiedCount, aiStatus: result.aiStatus, errorCode: result.aiErrorCode });
    return apiResponse(ctx, value);
  } catch (error) {
    const code = error instanceof SchoolRecommendationError ? error.code : undefined; secureLog("warn", "recommendation_failed", ctx, { durationMs: Date.now() - startedAt, model: RECOMMENDATION_MODEL, promptVersion: RECOMMENDATION_PROMPT_VERSION, errorCode: code });
    return apiError(ctx, error, code ? "SERVICE_UNAVAILABLE" : "INTERNAL_ERROR");
  }
}
