"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ArrowRight, CheckCircle2, Clock3, FileCheck2, LockKeyhole, PlayCircle } from "lucide-react";
import { Card } from "@/components/Card";
import { DashboardShell } from "@/components/PageShell";
import { ProgressBar } from "@/components/ProgressBar";
import { T, useLanguage } from "@/components/language/LanguageProvider";
import { JourneyNode, JourneyNodeStatus } from "@/lib/visual-prototype-data";
import { getApplicationJourneyNodes, getJourneyStagesForApplicationRecords } from "@/lib/atlas-task-selector";
import { getApplicationStateSnapshot, getServerApplicationStateSnapshot, subscribeToApplicationState } from "@/lib/application-store";
import { ApplicationRecord } from "@/lib/application-prototype-data";
import { cn } from "@/lib/utils";

const statusOrder: Record<JourneyNodeStatus, number> = {
  blocked: 0,
  ready: 1,
  in_progress: 2,
  awaiting_evidence: 3,
  verified: 4,
  completed: 4,
};

const iconByStatus: Record<JourneyNodeStatus, React.ElementType> = {
  blocked: LockKeyhole,
  ready: PlayCircle,
  in_progress: Clock3,
  awaiting_evidence: FileCheck2,
  verified: CheckCircle2,
  completed: CheckCircle2,
};

function sortByPriority(nodes: JourneyNode[]) {
  return [...nodes].sort((left, right) => {
    const statusDifference = statusOrder[left.status] - statusOrder[right.status];
    if (statusDifference !== 0) return statusDifference;
    return left.deadline.localeCompare(right.deadline);
  });
}

function StageState({ state }: { state: "completed" | "current" | "upcoming" }) {
  if (state === "completed") return <T en="Completed" zh="已完成" />;
  if (state === "current") return <T en="Current" zh="当前" />;
  return <T en="Not started" zh="未开始" />;
}

function UserStatus({ status }: { status: JourneyNodeStatus }) {
  const copy: Record<JourneyNodeStatus, { en: string; zh: string }> = {
    blocked: { en: "Needs information first", zh: "需要先补充信息" },
    ready: { en: "Ready to handle", zh: "现在可以处理" },
    in_progress: { en: "Already started", zh: "已经开始" },
    awaiting_evidence: { en: "Verifying", zh: "等待确认" },
    verified: { en: "Completed", zh: "已完成" },
    completed: { en: "Completed", zh: "已完成" },
  };
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
      status === "blocked" && "border-[#e7d0c7] bg-[#f1e2dc] text-[#8a5f54]",
      status === "ready" && "border-[#c9dbc5] bg-[#e7ece7] text-[#4f6d54]",
      status === "in_progress" && "border-[#d2dce5] bg-[#e8edf1] text-[#52687a]",
      status === "awaiting_evidence" && "border-[#dfcfaa] bg-[#eee5d0] text-[#80683f]",
      (status === "verified" || status === "completed") && "border-[#ded4c7] bg-[#eee7dc] text-[#6f6256]",
    )}>
      <T en={copy[status].en} zh={copy[status].zh} />
    </span>
  );
}

function MainTask({ node }: { node: JourneyNode }) {
  const { text } = useLanguage();
  const Icon = iconByStatus[node.status];
  return (
    <Card className="border-2 border-[#2f2924] bg-[#fffaf3] p-6 md:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#e7ece7] px-3 py-1.5 text-xs font-medium text-[#4f6d54]">
              <Icon size={15} />
              <UserStatus status={node.status} />
            </span>
            <span className="text-sm text-[#9a8b7c]">
              <T en="Deadline" zh="截止日期" /> {node.deadline}
            </span>
          </div>
          <h2 className="mt-5 text-3xl font-semibold text-[#2f2924] md:text-4xl">
            {text(node.title)}
          </h2>
          {node.schoolName ? <p className="mt-3 text-sm font-medium text-[#4a3d34]">{node.schoolName} · {node.programName}</p> : null}
          <p className="mt-2 max-w-xl text-base leading-7 text-[#5d5148]">{text(node.explanation)}</p>
        </div>
        <Link
          href={node.actionHref ?? `/dashboard/journey/${node.id}`}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#2f2924] px-5 py-3 text-sm font-medium text-[#fffaf3]"
        >
          {text(node.primaryCta)}
          <ArrowRight size={16} />
        </Link>
      </div>

      {node.missingInformation?.length ? <div className="mt-6 border-t border-[#e8dfd3] pt-5"><p className="text-sm font-medium text-[#6f6256]">当前缺少</p><div className="mt-3 flex flex-wrap gap-2">{node.missingInformation.map((item) => <span key={item} className="rounded-full bg-[#f7f0e8] px-3 py-2 text-xs text-[#5d5148]">{item}</span>)}</div></div> : null}
    </Card>
  );
}

function CompactTask({ node }: { node: JourneyNode }) {
  const { text } = useLanguage();
  return (
    <Link
      href={node.actionHref ?? `/dashboard/journey/${node.id}`}
      className="group flex flex-col gap-4 border-b border-[#e8dfd3] py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <UserStatus status={node.status} />
          <span className="text-xs text-[#9a8b7c]">
            <T en="Due" zh="截止" /> {node.deadline}
          </span>
        </div>
        <h3 className="mt-2 font-semibold text-[#2f2924]">{text(node.title)}</h3>
        <p className="mt-1 text-sm leading-6 text-[#6f6256]">{text(node.explanation)}</p>
        <p className="mt-2 text-xs text-[#8a7969]">
          <span className="font-medium text-[#6f6256]">
            <T en="Atlas prepared:" zh="Atlas 已准备：" />
          </span>{" "}
          {node.atlasCanHelpWith.slice(0, 3).map(text).join(text("; "))}
        </p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-[#4f6d54] group-hover:text-[#2f2924]">
        {text(node.primaryCta)}
        <ArrowRight size={16} />
      </span>
    </Link>
  );
}

export default function JourneyPage() {
  const { text } = useLanguage();
  const snapshot = useSyncExternalStore(subscribeToApplicationState, getApplicationStateSnapshot, getServerApplicationStateSnapshot);
  const state = snapshot === "server" ? { records: [] as ApplicationRecord[], selection: [] as string[] } : JSON.parse(snapshot) as { records: ApplicationRecord[]; selection: string[] };
  const stages = getJourneyStagesForApplicationRecords(state.records);
  const nodes = getApplicationJourneyNodes(state.records, state.selection);
  const orderedNodes = sortByPriority(nodes);
  const mainTask = orderedNodes[0];
  const nextTasks = orderedNodes
    .filter((node) => node.id !== mainTask.id && (node.status === "ready" || node.status === "in_progress"))
    .slice(0, 3);
  const waitingTasks = nodes.filter((node) => node.status === "awaiting_evidence");
  const completedTasks = nodes.filter((node) => node.status === "verified" || node.status === "completed");
  const currentStageIndex = stages.findIndex((stage) => stage.state === "current");
  const currentStage = stages[currentStageIndex];
  const timelineProgress = currentStageIndex <= 0 ? 0 : (currentStageIndex / (stages.length - 1)) * 100;

  return (
    <DashboardShell>
      <section className="mb-6">
        <p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">
          <T en="Current tasks" zh="当前事项" />
        </p>
        <div className="mt-2 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h1 className="font-editorial text-5xl font-semibold leading-none text-[#2f2924] md:text-6xl">
              <T en="Application tasks" zh="申请事项" />
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#6f6256]">
              <T en="Start with one task. Atlas will keep the next step ready for you." zh="先完成一件事。Atlas 会为你准备好下一步。" />
            </p>
          </div>
        </div>
      </section>

      <div id="all-stages" className="mb-6">
        <Card className="p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#9a8b7c]"><T en="Current stage" zh="当前阶段" /></p>
            <p className="mt-1 text-lg font-semibold text-[#2f2924]">
              {text(currentStage.name)} <span className="font-normal text-[#9a8b7c]">·</span>{" "}
              <T en={`Stage ${currentStageIndex + 1} of ${stages.length}`} zh={`第 ${currentStageIndex + 1} 阶段，共 ${stages.length} 个阶段`} />
            </p>
          </div>
          <Link href="#all-stages" className="inline-flex items-center gap-2 text-sm font-medium text-[#6f6256]">
            <T en="View all stages" zh="查看全部阶段" />
            <ArrowRight size={15} />
          </Link>
        </div>
        <div className="mt-5 overflow-x-auto pb-1">
          <div className="flex min-w-[760px] items-start">
            {stages.map((stage, index) => (
              <div key={stage.id} className="relative flex flex-1 items-start">
                {index < stages.length - 1 ? <div className="absolute left-5 right-0 top-2.5 h-px bg-[#ded4c7]" /> : null}
                <div className="relative z-10 min-w-0">
                  <div className={cn(
                    "grid h-5 w-5 place-items-center rounded-full border-2 bg-[#fffaf3]",
                    stage.state === "completed" && "border-[#8ea08b] bg-[#e7ece7]",
                    stage.state === "current" && "border-[#6f856a] bg-[#e7ece7] shadow-[0_0_0_4px_rgba(142,160,139,0.16)]",
                    stage.state === "upcoming" && "border-[#c9bbae]",
                  )}>
                    {stage.state === "completed" ? <CheckCircle2 size={13} className="text-[#4f6d54]" /> : null}
                    {stage.state === "current" ? <span className="h-2 w-2 rounded-full bg-[#6f856a]" /> : null}
                  </div>
                  <p className={cn("mt-2 whitespace-nowrap text-xs font-medium", stage.state === "current" ? "text-[#2f2924]" : "text-[#6f6256]")}>
                    {text(stage.name)}
                  </p>
                  <p className="mt-1 whitespace-nowrap text-[11px] text-[#9a8b7c]"><StageState state={stage.state} /></p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <ProgressBar value={timelineProgress} className="mt-4 h-1.5" />
        </Card>
      </div>

      <section className="space-y-6">
        <div>
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#9a8b7c]"><T en="One next step" zh="唯一下一步" /></p>
              <h2 className="mt-1 font-editorial text-3xl font-semibold text-[#2f2924]"><T en="What you need to complete now" zh="现在最需要你完成" /></h2>
            </div>
          </div>
          <MainTask node={mainTask} />
        </div>

        <Card className="bg-[#f7f0e8] p-5 md:p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-[#9a8b7c]"><T en="After this step" zh="完成这一步后" /></p>
          <h2 className="mt-2 text-xl font-semibold text-[#2f2924]"><T en="Atlas will keep applications in sync" zh="Atlas 将同步更新申请" /></h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-[#5d5148] md:grid-cols-2">
            {[
              ["Update the school's material count", "更新学校材料检测数量"],
              ["Recalculate application progress", "重新计算申请进度"],
              ["Refresh the next action and deadline", "更新下一步动作与截止日期"],
              ["Keep My Applications and Current Tasks aligned", "同步我的申请与当前事项"],
            ].map(([en, zh]) => (
              <li key={en} className="flex items-start gap-3"><CheckCircle2 size={17} className="mt-1 shrink-0 text-[#6f856a]" /><T en={en} zh={zh} /></li>
            ))}
          </ul>
        </Card>

        <Card className="p-5 md:p-6">
          <div className="mb-2">
            <p className="text-xs uppercase tracking-[0.18em] text-[#9a8b7c]"><T en="Next" zh="接下来" /></p>
            <h2 className="mt-1 font-editorial text-3xl font-semibold text-[#2f2924]"><T en="The next tasks" zh="后续事项" /></h2>
          </div>
          <div>
            {nextTasks.map((node) => <CompactTask key={node.id} node={node} />)}
          </div>
        </Card>

        <Card className="p-5 md:p-6">
          <div className="mb-2">
            <p className="text-xs uppercase tracking-[0.18em] text-[#9a8b7c]"><T en="Waiting for you" zh="等待你确认" /></p>
            <h2 className="mt-1 text-xl font-semibold text-[#2f2924]"><T en="Confirm when ready" zh="准备好后确认" /></h2>
          </div>
          <div>
            {waitingTasks.map((node) => <CompactTask key={node.id} node={node} />)}
          </div>
        </Card>

        <details className="soft-card rounded-[22px] p-5 md:p-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-[#2f2924]">
            <span><T en={`Completed ${completedTasks.length} items`} zh={`已完成 ${completedTasks.length} 项`} /></span>
            <span className="text-sm font-medium text-[#6f6256]"><T en="Expand" zh="展开" /></span>
          </summary>
          <div className="mt-4 border-t border-[#e8dfd3] pt-2">
            {completedTasks.map((node) => <CompactTask key={node.id} node={node} />)}
          </div>
        </details>
      </section>
    </DashboardShell>
  );
}
