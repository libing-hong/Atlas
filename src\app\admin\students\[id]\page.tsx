import { notFound } from "next/navigation";
import { ApplicationCard } from "@/components/ApplicationCard";
import { Card, CardHeader } from "@/components/Card";
import { DashboardShell } from "@/components/PageShell";
import { StatusBadge } from "@/components/StatusBadge";
import { applications, materials, orders, reportHighlights, students } from "@/lib/mock-data";

export default async function AdminStudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = students.find((item) => item.id === id);

  if (!student) {
    notFound();
  }

  return (
    <DashboardShell mode="admin">
      <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">Student detail</p>
          <h1 className="mt-2 font-editorial text-6xl font-semibold">{student.name}</h1>
        </div>
        <StatusBadge status={student.paidStatus} />
      </section>
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="学生基本信息" />
            <dl className="space-y-3 text-sm">
              {[
                ["联系方式", student.contact],
                ["邮箱", student.email],
                ["本科学校", student.school],
                ["本科专业", student.major],
                ["GPA", student.gpa],
                ["语言成绩", student.language],
                ["目标国家", student.targetCountries.join(" / ")],
                ["目标专业", student.targetMajor],
                ["预算", student.budget],
                ["预计入学", student.intake],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-[#e8dfd3] pb-3 last:border-0">
                  <dt className="text-[#8f847a]">{label}</dt>
                  <dd className="text-right text-[#3d342d]">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card>
            <CardHeader title="订单状态" />
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-2xl bg-[#f7f0e8] p-4">
                  <div>
                    <p className="text-sm font-medium">{order.type}</p>
                    <p className="text-xs text-[#8f847a]">¥{order.amount} · {order.createdAt}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader title="AI报告摘要" />
            <p className="text-sm leading-7 text-[#5d5148]">
              综合评分 {student.score}/100。建议采用英国冲刺、法国精品商学院差异化、澳洲稳妥备选的组合策略。
              当前优势包括{reportHighlights.strengths.join("、")}；主要风险为{reportHighlights.risks.join("、")}。
            </p>
          </Card>
          <Card>
            <CardHeader title="材料状态" />
            <div className="grid gap-3 md:grid-cols-2">
              {materials.map((material) => (
                <div key={material.name} className="flex items-center justify-between rounded-2xl bg-[#f7f0e8] p-3">
                  <span className="text-sm">{material.name}</span>
                  <StatusBadge status={material.status} />
                </div>
              ))}
            </div>
          </Card>
          <div className="grid gap-5 md:grid-cols-2">
            {applications.map((application) => (
              <ApplicationCard key={application.school} application={application} />
            ))}
          </div>
          <Card>
            <CardHeader title="顾问备注与下一步任务" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-[#f7f0e8] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#9a8b7c]">Advisor note</p>
                <p className="mt-3 text-sm leading-6 text-[#5d5148]">建议下一次沟通重点放在 PS 主线和法国项目面试素材。</p>
              </div>
              <div className="rounded-2xl bg-[#f7f0e8] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#9a8b7c]">Next task</p>
                <p className="mt-3 text-sm leading-6 text-[#5d5148]">7 月 12 日前确认 6 所学校初版名单。</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
