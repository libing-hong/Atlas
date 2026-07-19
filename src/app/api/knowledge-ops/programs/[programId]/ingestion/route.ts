import { enqueueProgramIngestion } from "@/lib/program-ingestion/repository";
import { ingestionRequestSchema } from "@/lib/server/api-schemas";
import { apiError, apiException, apiResponse, createApiContext, enforceLimit, parseJson, secureLog, validateMutationOrigin } from "@/lib/server/api-security";
import { recordAuditEvent } from "@/lib/server/audit";

export async function POST(request: Request, context: { params: Promise<{ programId: string }> }) {
  const ctx = createApiContext(request);
  try {
    if (!validateMutationOrigin(request)) throw apiException("FORBIDDEN_ORIGIN", 403); const configuredKey = process.env.KNOWLEDGE_OPS_API_KEY; const suppliedKey = request.headers.get("x-atlas-knowledge-key");
    if (!configuredKey || suppliedKey !== configuredKey) { secureLog("warn", "knowledge_ops_unauthorized", ctx); throw apiException("UNAUTHORIZED", 401); }
    await enforceLimit(ctx, "knowledge-ingestion", 30, 60_000); const { programId } = await context.params; if (!/^[a-zA-Z0-9_-]{1,100}$/.test(programId)) throw apiException("BAD_REQUEST", 400);
    const body = await parseJson(request, ingestionRequestSchema, 4_000); const result = await enqueueProgramIngestion(programId, body.trigger ?? "manual_retry", body.priority ?? 80);
    await recordAuditEvent({ action: "knowledge.ingestion.enqueued", resourceType: "programme", resourceId: programId, metadata: { trigger: body.trigger ?? "manual_retry", priority: body.priority ?? 80, queued: result.queued } });
    return apiResponse(ctx, result, result.queued ? 202 : 503);
  } catch (error) { return apiError(ctx, error); }
}
