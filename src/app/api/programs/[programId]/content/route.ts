import { NextResponse } from "next/server";
import { getProgramContent } from "@/lib/program-knowledge";

export async function GET(_: Request, context: { params: Promise<{ programId: string }> }) {
  const { programId } = await context.params;
  const profile = getProgramContent(programId);
  if (!profile) {
    return NextResponse.json({ status: "not_available", message: "Atlas 正在核实该专业的最新官方信息。" }, { status: 404 });
  }
  return NextResponse.json({ program: profile }, { headers: { "cache-control": "public, max-age=3600, stale-while-revalidate=86400" } });
}
