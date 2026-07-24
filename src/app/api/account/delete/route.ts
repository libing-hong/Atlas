import { NextResponse } from "next/server";
import { authenticatedSupabase, authorizeRequest } from "@/lib/server/auth";

export async function DELETE(request: Request) {
  const auth = await authorizeRequest(request, ["student"]);
  if (!auth.ok) return NextResponse.json({ error: "请先登录" }, { status: auth.status });
  const client = authenticatedSupabase(auth.session.accessToken);
  const { error } = await client.rpc("delete_my_atlas_account");
  if (error) return NextResponse.json({ error: "账号删除失败，请通过隐私页面联系我们处理" }, { status: 503 });
  return NextResponse.json({ deleted: true });
}


