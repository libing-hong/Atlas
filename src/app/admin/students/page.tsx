import Link from "next/link";
import { Card } from "@/components/Card";
import { DashboardShell } from "@/components/PageShell";
import { authenticatedSupabase, requirePageRole } from "@/lib/server/auth";

export default async function AdminStudentsPage() {
  const session = await requirePageRole(["advisor", "admin"]);
  const client = authenticatedSupabase(session.accessToken);
  const { data } = await client.from("users").select("id,name,email,role,updated_at").eq("role", "student").order("updated_at", { ascending: false }).limit(100);
  return (
    <DashboardShell mode="admin">
      <p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">Student portfolio</p>
      <h1 className="mt-2 font-editorial text-6xl font-semibold">真实学生列表</h1>
      <Card className="mt-6 p-5">
        <div className="divide-y divide-[#e8dfd3]">{(data ?? []).length ? (data ?? []).map((student) => <Link key={student.id} href={`/admin/students/${student.id}`} className="grid gap-2 py-4 text-sm md:grid-cols-[1fr_1fr_180px]"><strong>{student.name}</strong><span>{student.email || "未提供邮箱"}</span><span className="text-[#8f847a]">{new Date(student.updated_at).toLocaleString("zh-CN")}</span></Link>) : <p className="py-5 text-sm text-[#8f847a]">当前没有真实学生账号。</p>}</div>
      </Card>
    </DashboardShell>
  );
}


