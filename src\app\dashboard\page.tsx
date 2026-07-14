"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight, CalendarDays, CheckCircle2, Clock } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { DashboardShell } from "@/components/PageShell";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusBadge } from "@/components/StatusBadge";
import { T, useLanguage } from "@/components/language/LanguageProvider";
import { DevelopmentJourneyRepository, DevelopmentUserContext } from "@/lib/visual-prototype-data";
import { getAtlasPrimaryTask } from "@/lib/atlas-task-selector";
import { isApplicationWorkspacePurchased, readApplicationRecords, readApplicationSelection } from "@/lib/application-store";

export default function DashboardPage() {
  const { text, t } = useLanguage();
  const context = DevelopmentUserContext.getDashboardContext();
  const stages = DevelopmentJourneyRepository.getStages();
  const nodes = DevelopmentJourneyRepository.getNodes();
  const preparedItems = DevelopmentJourneyRepository.getPreparedItems();
  const activity = DevelopmentJourneyRepository.getRecentActivity();
  const currentStage = stages.find((stage) => stage.state === "current") ?? stages[0];
  const currentIssue = nodes.find((node) => node.status === "blocked");
  const applicationRecords = readApplicationRecords();
  const selectedSchoolIds = readApplicationSelection();
  const primaryTask = getAtlasPrimaryTask({ applicationRecords, selectedSchoolIds, workspacePurchased: isApplicationWorkspacePurchased(), journeyNodes: nodes });
  const preparedForTask = primaryTask.atlasPreparedItems ?? preparedItems.slice(0, 4).map((item) => text(item.title));

  return (
    <DashboardShell>
      <section className="mb-6 soft-card rounded-[24px] p-5 md:p-7">
        <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">
              <T en="My Atlas" zh="我的 Atlas" />
            </p>
            <h1 className="mt-3 font-editorial text-5xl font-semibold leading-none text-[#2f2924] md:text-6xl">
              <T en={`Good morning, ${context.studentName}`} zh={`${text(context.studentName)}，早上好`} />
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#6f6256]">
              <T
                en="You are in the visa stage for your France application. Atlas is keeping the page focused on what matters now."
                zh="你现在处在法国留学申请的签证阶段。Atlas 会把页面聚焦在此刻真正需要处理的事情上。"
              />
            </p>
          </div>

          <div className="grid gap-3 rounded-[22px] bg-[#f7f0e8] p-4 text-sm text-[#5d5148] sm:grid-cols-2 xl:w-[420px]">
            <Fact label={{ en: "Application", zh: "申请" }} value={text(context.currentJourney)} />
            <Fact label={{ en: "Current stage", zh: "当前阶段" }} value={text(context.currentStage)} />
            <Fact label={{ en: "Destination", zh: "目的地" }} value={text(context.destination)} />
            <Fact label={{ en: "Intake", zh: "入学时间" }} value={text(context.intakeDate)} />
            <Fact label={{ en: "School", zh: "学校" }} value={text(context.school)} />
            <Fact label={{ en: "Programme", zh: "项目" }} value={text(context.programme)} />
          </div>
        </div>
      </section>

      <section className="mb-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="border-2 border-[#2f2924] p-5 md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">
                <T en="The one thing to do next" zh="现在只需要先做这一件事" />
              </p>
              <h2 className="mt-3 max-w-3xl font-editorial text-4xl font-semibold leading-tight text-[#2f2924] md:text-5xl">
                {primaryTask.title}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#5d5148]">{primaryTask.description}</p>
            </div>
            <StatusBadge status={primaryTask.status === "urgent" ? "blocked" : primaryTask.status === "atlas_processing" ? "in_progress" : primaryTask.status === "completed" ? "completed" : "ready"} />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <MiniFact icon={CalendarDays} label={{ en: "Deadline", zh: "截止日期" }} value={primaryTask.deadline ?? "根据当前任务确定"} />
            <MiniFact icon={Clock} label={{ en: "Estimated effort", zh: "预计耗时" }} value={t({ en: "About 35 minutes", zh: "约 35 分钟" })} />
          </div>

          <div className="mt-6 rounded-[22px] bg-[#f7f0e8] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[#9a8b7c]">
              <T en="Atlas has already prepared" zh="Atlas 已经为你准备" />
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {preparedForTask.slice(0, 4).map((item) => (
                <div key={item} className="flex gap-3 text-sm text-[#4a3d34]">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#6f856a]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={primaryTask.actionHref}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2f2924] px-6 py-4 text-sm font-medium text-[#fffaf3]"
            >
              {primaryTask.actionLabel}
              <ArrowRight size={17} />
            </Link>
            <Link
              href="/dashboard/journey"
              className="inline-flex items-center justify-center rounded-full border border-[#d8ccbe] px-6 py-4 text-sm font-medium text-[#4a3d34]"
            >
              <T en="View current tasks" zh="查看当前事项" />
            </Link>
          </div>
        </Card>

        <Card>
          <CardHeader title={<T en="Current stage progress" zh="当前阶段进度" />} />
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-editorial text-6xl font-semibold">{currentStage.progress}%</p>
              <p className="mt-2 text-sm text-[#6f6256]">{text(currentStage.name)}</p>
            </div>
            <StatusBadge status="in_progress" />
          </div>
          <ProgressBar value={currentStage.progress} className="mt-5" />
          <p className="mt-5 text-sm leading-6 text-[#6f6256]">
            <T
              en="This shows only the stage you are in now, so the dashboard stays focused."
              zh="这里只显示你当前所处阶段的进度，避免把暂时不需要处理的信息推到你面前。"
            />
          </p>
        </Card>
      </section>

      <section className="mb-6">
        <Card className="p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#9a8b7c]">申请概览</p>
              <h2 className="mt-2 font-editorial text-3xl font-semibold text-[#2f2924]">我的申请</h2>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-[#5d5148]"><span>已选择：{selectedSchoolIds.length || applicationRecords.length} 所</span><span>材料准备中：{applicationRecords.length} 所</span><span>已递交：{applicationRecords.filter((record) => record.status === "submitted").length} 所</span></div>
            </div>
            <Link href="/applications" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d8ccbe] px-5 py-3 text-sm font-medium text-[#4a3d34]">进入申请中心 <ArrowRight size={16} /></Link>
          </div>
        </Card>
      </section>

      {currentIssue ? (
        <section className="mb-6 rounded-[22px] border border-[#e7d0c7] bg-[#f6e7df] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-3">
              <AlertCircle size={21} className="mt-1 shrink-0 text-[#8a5f54]" />
              <div>
                <p className="text-sm font-semibold text-[#2f2924]">
                  <T en="Needs attention" zh="需要注意" />
                </p>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#7f594d]">{text(currentIssue.blocker ?? "")}</p>
              </div>
            </div>
            <Link
              href={`/dashboard/journey/${currentIssue.id}`}
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#fffaf3] px-5 py-3 text-sm font-medium text-[#6c4b3d]"
            >
              <T en="See how to prepare" zh="查看如何准备" />
            </Link>
          </div>
        </section>
      ) : null}

      <section className="mb-6">
        <Card>
          <CardHeader title={<T en="What Atlas prepared for you" zh="Atlas 已经为你准备的内容" />} />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {preparedItems.slice(0, 6).map((item) => (
              <div key={item.title} className="rounded-2xl bg-[#f7f0e8] p-4">
                <p className="text-sm font-semibold text-[#2f2924]">{text(item.title)}</p>
                <p className="mt-2 text-sm leading-6 text-[#6f6256]">{text(item.description)}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="border-t border-[#e8dfd3] pt-5">
        <h2 className="text-sm font-semibold text-[#2f2924]">
          <T en="What Atlas recently completed for you" zh="Atlas 最近为你完成了什么" />
        </h2>
        <div className="mt-3 divide-y divide-[#e8dfd3] text-sm">
          {activity.map((item) => (
            <div key={item.label} className="flex justify-between gap-4 py-3">
              <span className="text-[#4a3d34]">{text(item.label)}</span>
              <span className="shrink-0 text-[#8f847a]">{text(item.time)}</span>
            </div>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}

function Fact({ label, value }: { label: { en: string; zh: string }; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-[#9a8b7c]">
        <T en={label.en} zh={label.zh} />
      </p>
      <p className="mt-1 font-medium text-[#2f2924]">{value}</p>
    </div>
  );
}

function MiniFact({ icon: Icon, label, value }: { icon: React.ElementType; label: { en: string; zh: string }; value: string }) {
  return (
    <div className="rounded-2xl bg-[#fffaf3] p-4">
      <Icon size={18} className="text-[#8ea08b]" />
      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[#9a8b7c]">
        <T en={label.en} zh={label.zh} />
      </p>
      <p className="mt-1 text-lg font-semibold text-[#2f2924]">{value}</p>
    </div>
  );
}
