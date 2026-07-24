Exit code: 0
Wall time: 1.1 seconds
Output:
import { recommendations } from "@/lib/application-prototype-data";
import { RECOMMENDATION_MODEL, RECOMMENDATION_PROMPT_VERSION, SchoolRecommendationError } from "@/lib/recommendation/ai-recommendation";
import { orchestrateRecommendations } from "@/lib/recommendation/orchestrator";
import type { OrchestratorResult, ProgrammeCandidate } from "@/lib/recommendation/types";
import { apiError, apiException, apiResponse, createApiContext, enforceLimit, parseJson, secureLog, stableHash, validateMutationOrigin } from "@/lib/server/api-security";
import { recommendationRequestSchema } from "@/lib/server/api-schemas";
import { normalizeStudentProfile } from "@/lib/student-profile";

export const maxDuration = 120;
type PublicCandidate = Omit<ProgrammeCandidate, "aiRecommendation" | "generatedByAI">;
export type RecommendationPublicResponse = Omit<OrchestratorResult, "debug" | "candidates"> & {
  candidates: PublicCandidate[];
  disclaimer: string;
};
type Dependencies = {
  orchestrate: typeof orchestrateRecommendations;
  enforceRateLimits: boolean;
  recordEvent: (event: { eventName: string; module: string; success: boolean; durationMs: number; metadata: Record<string, string | number | boolean | null> }) => Promise<unknown>;
};
const defaults: Dependencies = {
  orchestrate: orchestrateRecommendations,
  enforceRateLimits: true,
  recordEvent: async (event) => {
    const { recordProductEvent } = await import("@/lib/server/audit");
    return recordProductEvent(event);
  },
};
const cache = new Map<string, { expiresAt: number; value: RecommendationPublicResponse }>();
const inflight = new Map<string, Promise<OrchestratorResult>>();

export function toPublicRecommendationResponse(result: OrchestratorResult): RecommendationPublicResponse {
  const candidates = result.candidates.map((candidate) => {
    const publicCandidate = { ...candidate } as ProgrammeCandidate;
    delete publicCandidate.aiRecommendation;
    delete publicCandidate.generatedByAI;
    return publicCandidate as PublicCandidate;
  });
  return {
    profile: result.profile,
    expansions: result.expansions,
    candidates,
    reviewQueue: result.reviewQueue,
    events: result.events,
    fallbackLevel: result.fallbackLevel,
    generationStatus: result.generationStatus,
    aiStatus: result.aiStatus,
    aiErrorCode: result.aiErrorCode,
    emptyReason: result.emptyReason,
    supervisor: result.supervisor,
    disclaimer: "Atlas 鏍规嵁鐢ㄦ埛璧勬枡鐢熸垚鍊欓€夐€夋牎鏂规骞舵牳楠屽畼鏂规潵婧愶紱寰呮牳楠岄」鐩笉浠ｈ〃宸茬‘璁ゆ嫑鐢熶俊鎭€?,
  };
}

export function buildRecommendationDiagnostic(result: OrchestratorResult, frontendCandidateCount: number, startedAt: number, requestId: string) {
  return {
    requestId,
    openAIConfigured: Boolean(process.env.OPENAI_API_KEY),
    generationStarted: true,
    aiCandidateCount: result.debug.aiCandidatesReturned ?? 0,
    semanticAcceptedCount: result.debug.afterSubjectMatch,
    verificationAcceptedCount: result.debug.verifiedRecommendations ?? result.debug.afterValidation,
    frontendCandidateCount,
    errorStage: result.generationStatus === "empty" ? "result_empty" : null,
    errorCode: result.aiErrorCode ?? null,
    durationMs: Date.now() - startedAt,
  };
}

async function recordEventBestEffort(dependencies: Dependencies, event: Parameters<Dependencies["recordEvent"]>[0], ctx: ReturnType<typeof createApiContext>) {
  try {
    await dependencies.recordEvent(event);
  } catch {
    secureLog("warn", "recommendation_observability_failed", ctx, { errorCode: "OBSERVABILITY_WRITE_FAILED" });
  }
}

export function createRecommendationsPost(overrides: Partial<Dependencies> = {}) {
  const dependencies = { ...defaults, ...overrides };
  return async function post(request: Request) {
    const ctx = createApiContext(request);
    const startedAt = Date.now();
    let generationStarted = false;
    try {
      if (!validateMutationOrigin(request)) throw apiException("FORBIDDEN_ORIGIN", 403);
      const body = await parseJson(request, recommendationRequestSchema, 48_000);
      if (dependencies.enforceRateLimits) {
        await enforceLimit(ctx, "recommendations:minute", 3, 60_000);
        await enforceLimit(ctx, "recommendations:daily", 15, 86_400_000, "DAILY_QUOTA_EXCEEDED");
      }
      const profile = normalizeStudentProfile((body.profile ?? body) as Record<string, unknown>);
      const profileHash = stableHash(profile);
      const idempotencyKey = request.headers.get("idempotency-key")?.slice(0, 128) ?? profileHash;
      const key = `${ctx.sessionId}:${idempotencyKey}:${profileHash}`;
      const cached = cache.get(key);
      if (cached && cached.expiresAt > Date.now()) return apiResponse(ctx, cached.value);
      let pending = inflight.get(key);
      if (!pending) {
        generationStarted = true;
        pending = dependencies.orchestrate({ profile, internalProgrammes: recommendations, plannedApplicationCount: body.plannedApplicationCount ?? 12 });
        inflight.set(key, pending);
      }
      let result: OrchestratorResult;
      try {
        result = await pending;
      } finally {
        if (inflight.get(key) === pending) inflight.delete(key);
      }
      const value = toPublicRecommendationResponse(result);
      cache.set(key, { expiresAt: Date.now() + 10 * 60_000, value });
      const fields = buildRecommendationDiagnostic(result, value.candidates.length, startedAt, ctx.requestId);
      secureLog(value.generationStatus === "complete" ? "info" : "warn", "recommendation_diagnostic", ctx, fields);
      await recordEventBestEffort(dependencies, { eventName: "recommendation.completed", module: "recommendations", success: value.generationStatus !== "empty", durationMs: fields.durationMs, metadata: { candidateCount: value.candidates.length, generationStatus: value.generationStatus } }, ctx);
      return apiResponse(ctx, value);
    } catch (error) {
      const code = error instanceof SchoolRecommendationError ? error.code : undefined;
      secureLog("warn", "recommendation_diagnostic", ctx, {
        requestId: ctx.requestId,
        openAIConfigured: Boolean(process.env.OPENAI_API_KEY),
        generationStarted,
        aiCandidateCount: 0,
        semanticAcceptedCount: 0,
        verificationAcceptedCount: 0,
        frontendCandidateCount: 0,
        errorStage: generationStarted ? "orchestration" : "request_validation",
        errorCode: code ?? "INTERNAL_ERROR",
        durationMs: Date.now() - startedAt,
        model: RECOMMENDATION_MODEL,
        promptVersion: RECOMMENDATION_PROMPT_VERSION,
      });
      await recordEventBestEffort(dependencies, { eventName: "recommendation.failed", module: "recommendations", success: false, durationMs: Date.now() - startedAt, metadata: { errorCode: code ?? "INTERNAL_ERROR" } }, ctx);
      return apiError(ctx, error, code ? "SERVICE_UNAVAILABLE" : "INTERNAL_ERROR");
    }
  };
}

export const POST = createRecommendationsPost();

