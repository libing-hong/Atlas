import { NextResponse } from "next/server";
import { authenticatedSupabase, authorizeRequest } from "@/lib/server/auth";

export async function POST(request: Request) {
  const auth = await authorizeRequest(request, ["student", "advisor", "admin"]);
  if (!auth.ok) return NextResponse.json({ error: "请先登录" }, { status: auth.status });
  const body = await request.json().catch(() => ({})) as { module?: string; summary?: string; errorType?: string };
  const client = authenticatedSupabase(auth.session.accessToken);
  const { error } = await client.from("review_queue").insert({
    owner_user_id: auth.session.userId,
    module: String(body.module || "general").slice(0, 80),
    input_summary: String(body.summary || "").slice(0, 1000),
    error_type: String(body.errorType || "user_feedback").slice(0, 80),
  });
  if (error) return NextResponse.json({ error: "反馈提交失败" }, { status: 503 });
  return NextResponse.json({ submitted: true });
}

