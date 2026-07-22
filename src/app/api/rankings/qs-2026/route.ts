import { getQs2026Rankings } from "@/lib/university-rankings";
import { rankingQuerySchema } from "@/lib/server/api-schemas";
import { apiError, apiException, apiResponse, createApiContext, enforceLimit } from "@/lib/server/api-security";

export async function GET(request: Request) {
  const ctx = createApiContext(request);
  try { await enforceLimit(ctx, "rankings", 120, 60_000); const raw = new URL(request.url).searchParams.get("universityIds")?.split(",").map(id => id.trim()).filter(Boolean) ?? []; const parsed = rankingQuerySchema.safeParse(raw); if (!parsed.success) throw apiException("BAD_REQUEST", 400); return apiResponse(ctx, { rankings: getQs2026Rankings(parsed.data) }, 200, { "cache-control": "public, max-age=3600" }); }
  catch (error) { return apiError(ctx, error); }
}

