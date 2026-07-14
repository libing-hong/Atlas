import { Card, CardHeader } from "@/components/Card";
import { DashboardShell } from "@/components/PageShell";
import { StudentTable } from "@/components/StudentTable";
import { students } from "@/lib/mock-data";

export default function AdminStudentsPage() {
  return (
    <DashboardShell mode="admin">
      <section className="mb-6">
        <p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">Student portfolio</p>
        <h1 className="mt-2 font-editorial text-6xl font-semibold">顾问学生列表</h1>
      </section>
      <Card>
        <CardHeader title="全部学生" />
        <StudentTable students={students} />
      </Card>
    </DashboardShell>
  );
}
