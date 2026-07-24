import { NextResponse } from "next/server";
import { authenticatedSupabase, authorizeRequest } from "@/lib/server/auth";

const MAX_STATE_BYTES = 1_500_000;
const allowedKey = /^atlas\.(student-profile|planning-|active-planning|recommendation-|application\.|school-comparison|service-orders|active-service-order|visa-workspaces)/;

function sanitizeState(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  return Object.fromEntries(Object.entries(input as Record<string, unknown>).filter(([key, value]) => allowedKey.test(key) && typeof value === "string"));
}

export async function GET(request: Request) {
  const auth = await authorizeRequest(request, ["student", "advisor", "admin"]);
  if (!auth.ok) return NextResponse.json({ error: "请先登录" }, { status: auth.status });
  const client = authenticatedSupabase(auth.session.accessToken);
  const { data, error } = await client.from("atlas_user_states").select("state,state_version,updated_at").eq("owner_user_id", auth.session.userId).maybeSingle();
  if (error) return NextResponse.json({ error: "暂时无法恢复云端资料" }, { status: 503 });
  return NextResponse.json({ state: data?.state ?? {}, stateVersion: data?.state_version ?? 0, updatedAt: data?.updated_at ?? null });
}

export async function PUT(request: Request) {
  const auth = await authorizeRequest(request, ["student"]);
  if (!auth.ok) return NextResponse.json({ error: "请先登录" }, { status: auth.status });
  const body = await request.json().catch(() => ({})) as { state?: unknown };
  const state = sanitizeState(body.state);
  if (Buffer.byteLength(JSON.stringify(state), "utf8") > MAX_STATE_BYTES) return NextResponse.json({ error: "云端资料过大，请删除不需要的历史记录" }, { status: 413 });
  const client = authenticatedSupabase(auth.session.accessToken);
  const { data: current } = await client.from("atlas_user_states").select("state_version").eq("owner_user_id", auth.session.userId).maybeSingle();
  const { error } = await client.from("atlas_user_states").upsert({
    owner_user_id: auth.session.userId,
    state,
    state_version: (current?.state_version ?? 0) + 1,
    updated_at: new Date().toISOString(),
  }, { onConflict: "owner_user_id" });
  if (error) return NextResponse.json({ error: "暂时无法保存资料" }, { status: 503 });
  await client.from("audit_events").insert({ actor_user_id: auth.session.userId, subject_user_id: auth.session.userId, action: "cloud_state.updated", resource_type: "atlas_user_state", resource_id: auth.session.userId, metadata: { key_count: Object.keys(state).length } });
  return NextResponse.json({ saved: true });
}


