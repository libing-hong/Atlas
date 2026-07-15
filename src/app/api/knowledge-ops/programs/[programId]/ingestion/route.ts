import { NextResponse } from "next/server";
import { enqueueProgramIngestion } from "@/lib/program-ingestion/repository";

export async function POST(request: Request, context: { params: Promise<{ programId: string }> }) {
  const configuredKey = process.env.KNOWLEDGE_OPS_API_KEY;
  const suppliedKey = request.headers.get("x-atlas-knowledge-key");
  if (!configuredKey || suppliedKey !== configuredKey) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { programId } = await context.params;
  const body = await request.json().catch(() => ({})) as { trigger?: "preload" | "scheduled_refresh" | "manual_retry"; priority?: number };
  const result = await enqueueProgramIngestion(programId, body.trigger ?? "manual_retry", body.priority ?? 80);
  return NextResponse.json(result, { status: result.queued ? 202 : 503, headers: { "cache-control": "no-store" } });
}
