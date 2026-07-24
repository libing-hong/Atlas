import { Card } from "@/components/Card";
import { DashboardShell } from "@/components/PageShell";
import { authenticatedSupabase, requirePageRole } from "@/lib/server/auth";

export default async function AdminPage() {
  const session = await requirePageRole(["admin"]);
  const client = authenticatedSupabase(session.accessToken);
  const [{ data: queue }, { data: events }] = await Promise.all([
    client.from("review_queue").select("id,module,error_type,status,input_summary,created_at").order("created_at", { ascending: false }).limit(50),
    client.from("product_events").select("event_name,success,duration_ms,created_at").order("created_at", { ascending: false }).limit(100),
  ]);
  const pending = (queue ?? []).filter((item) => item.status === "pending").length;
  const failed = (events ?? []).filter((item) => item.success === false).length;
  return (
    <DashboardShell mode="admin">
      <p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">Private Beta operations</p>
      <h1 className="mt-2 font-editorial text-6xl font-semibold">复核与系统状态</h1>
      <div className="mt-7 grid gap-4 md:grid-cols-3">
        <Metric label="待处理复核" value={pending} />
        <Metric label="最近错误事件" value={failed} />
        <Metric label="最近事件样本" value={(events ?? []).length} />
      </div>
      <Card className="mt-6 p-5">
        <h2 className="text-xl font-semibold">人工复核队列</h2>
        <div className="mt-4 divide-y divide-[#e8dfd3]">
          {(queue ?? []).length ? (queue ?? []).map((item) => <div key={item.id} className="grid gap-2 py-4 text-sm md:grid-cols-[150px_180px_1fr_120px]"><span>{item.module}</span><span className="text-[#7f594d]">{item.error_type}</span><span className="text-[#6f6256]">{item.input_summary || "没有输入摘要"}</span><span>{item.status}</span></div>) : <p className="py-5 text-sm text-[#8f847a]">当前没有真实复核记录。</p>}
        </div>
      </Card>
    </DashboardShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <Card className="p-5"><p className="text-sm text-[#6f6256]">{label}</p><p className="mt-2 font-editorial text-5xl font-semibold">{value}</p></Card>;
}


