import { NextRequest } from "next/server";
import { enqueueDueProgramRefreshes } from "@/lib/program-ingestion/repository";
import { apiError, apiException, apiResponse, createApiContext, secureLog } from "@/lib/server/api-security";

export async function GET(request: NextRequest) {
  const ctx = createApiContext(request);
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    secureLog("warn", "knowledge_cron_unauthorized", ctx); return apiError(ctx, apiException("UNAUTHORIZED", 401));
  }

  try {
    const result = await enqueueDueProgramRefreshes(25, 30);
    return apiResponse(ctx, { ok: true, ...result });
  } catch (error) {
    return apiError(ctx, error);
  }
}

