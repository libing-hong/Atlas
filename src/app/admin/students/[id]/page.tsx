import { notFound } from "next/navigation";
import { Card } from "@/components/Card";
import { DashboardShell } from "@/components/PageShell";
import { authenticatedSupabase, requirePageRole } from "@/lib/server/auth";

export default async function AdminStudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePageRole(["admin"]);
  const { id } = await params;
  const client = authenticatedSupabase(session.accessToken);
  const [{ data: student }, { data: profile }, { data: applications }, { data: visaCases }] = await Promise.all([
    client.from("users").select("id,name,email,created_at,updated_at").eq("id", id).maybeSingle(),
    client.from("student_profiles").select("profile_data,updated_at").eq("user_id", id).maybeSingle(),
    client.from("application_records").select("id,status,payload,updated_at,is_final_offer").eq("owner_user_id", id).order("updated_at", { ascending: false }),
    client.from("visa_cases").select("id,country,status,rule_version,updated_at").eq("owner_user_id", id).order("updated_at", { ascending: false }),
  ]);
  if (!student) notFound();
  return (
    <DashboardShell mode="admin">
      <p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">Student detail</p>
      <h1 className="mt-2 font-editorial text-6xl font-semibold">{student.name}</h1>
      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <Card className="p-5"><h2 className="text-xl font-semibold">账号与档案</h2><p className="mt-4 text-sm">邮箱：{student.email || "未提供"}</p><p className="mt-2 text-sm text-[#6f6256]">档案更新时间：{profile?.updated_at ? new Date(profile.updated_at).toLocaleString("zh-CN") : "尚未填写"}</p><pre className="mt-4 max-h-80 overflow-auto rounded-xl bg-[#f7f0e8] p-3 text-xs">{JSON.stringify(profile?.profile_data ?? {}, null, 2)}</pre></Card>
        <Card className="p-5"><h2 className="text-xl font-semibold">申请与签证</h2><p className="mt-4 text-sm">申请记录：{applications?.length ?? 0}</p><p className="mt-2 text-sm">签证工作区：{visaCases?.length ?? 0}</p><div className="mt-4 space-y-2">{(applications ?? []).map((application) => <p key={application.id} className="rounded-xl bg-[#f7f0e8] p-3 text-sm">{application.status}{application.is_final_offer ? " · 最终接受 Offer" : ""}</p>)}</div></Card>
      </div>
    </DashboardShell>
  );
}

