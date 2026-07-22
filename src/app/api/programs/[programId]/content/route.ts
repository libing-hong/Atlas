import { enqueueProgramIngestion, getProgramContentFromStore } from "@/lib/program-ingestion/repository";
import { apiError, apiException, apiResponse, createApiContext, enforceLimit } from "@/lib/server/api-security";

export async function GET(request: Request, context: { params: Promise<{ programId: string }> }) {
  const ctx = createApiContext(request);
  try {
    await enforceLimit(ctx, "program-content", 120, 60_000); const { programId } = await context.params; if (!/^[a-zA-Z0-9_-]{1,100}$/.test(programId)) throw apiException("BAD_REQUEST", 400);
    const profile = await getProgramContentFromStore(programId); if (!profile) { const queue = await enqueueProgramIngestion(programId, "on_demand", 70); return apiResponse(ctx, { status: queue.queued ? "fetching" : "manual_review", message: queue.queued ? "Atlas 正在获取该专业的最新官方信息。" : "该专业需要进一步人工确认。", jobId: queue.queued ? queue.jobId : undefined }, 202); }
    return apiResponse(ctx, { program: profile }, 200, { "cache-control": "public, max-age=3600, stale-while-revalidate=86400" });
  } catch (error) { return apiError(ctx, error); }
}

