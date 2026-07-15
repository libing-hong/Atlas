import { NextResponse } from "next/server";
import { enqueueProgramIngestion, getProgramContentFromStore } from "@/lib/program-ingestion/repository";

export async function GET(_: Request, context: { params: Promise<{ programId: string }> }) {
  const { programId } = await context.params;
  const profile = await getProgramContentFromStore(programId);
  if (!profile) {
    const queue = await enqueueProgramIngestion(programId, "on_demand", 70);
    return NextResponse.json({
      status: queue.queued ? "fetching" : "manual_review",
      message: queue.queued ? "Atlas 正在获取该专业的最新官方信息。" : "该专业需要进一步人工确认。",
      jobId: queue.queued ? queue.jobId : undefined,
    }, { status: 202, headers: { "cache-control": "no-store" } });
  }
  return NextResponse.json({ program: profile }, {
    headers: { "cache-control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
