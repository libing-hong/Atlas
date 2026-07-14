import { Card, CardHeader } from "@/components/Card";
import { DashboardShell } from "@/components/PageShell";
import { StudentTable } from "@/components/StudentTable";
import { adminMetrics, students } from "@/lib/mock-data";

export default function AdminPage() {
  return (
    <DashboardShell mode="admin">
      <section className="mb-6">
        <p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">Advisor CRM</p>
        <h1 className="mt-2 font-editorial text-6xl font-semibold">顾问后台</h1>
      </section>
      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {adminMetrics.map((metric) => (
          <Card key={metric.label} className="p-5">
            <p className="text-sm text-[#6f6256]">{metric.label}</p>
            <p className="mt-3 font-editorial text-5xl font-semibold">{metric.value}</p>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader title="近期学生线索" />
        <StudentTable students={students} />
      </Card>
    </DashboardShell>
  );
}
