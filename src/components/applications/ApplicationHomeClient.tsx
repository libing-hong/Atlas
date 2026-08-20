"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  FileText,
  FolderKanban,
  Plus,
  Send,
  TriangleAlert,
} from "lucide-react";
import { DashboardShell } from "@/components/PageShell";
import {
  applicationStatusPresentation,
  applicationTimelineIndex,
  buildMaterialReadiness,
  countryCode,
  formatApplicationDeadline,
  getApplicationSummary,
  type MaterialReadiness,
} from "@/lib/application-portfolio";
import { getApplicationJourneyNodes } from "@/lib/atlas-task-selector";
import { getAdmissionRequirements, type AdmissionRequirement, type ApplicationRecord, type SchoolRecommendation } from "@/lib/application-prototype-data";
import { getApplicationStateSnapshot, getServerApplicationStateSnapshot, readApplicationSelection, type ServiceOrder, subscribeToApplicationState } from "@/lib/application-store";
import { readActivePlanningRun, readPlanningRun, readRecommendationCandidates } from "@/lib/planning-store";
import { programmeCandidateToSchoolRecommendation } from "@/lib/school-recommendation-adapter";

const panelClass = "rounded-[20px] border border-[#e2e7ef] bg-white shadow-[0_10px_35px_rgba(32,55,95,0.045)]";
const timelineLabels = ["材料准备", "正式递交", "等待结果", "Offer 决策"];

export function ApplicationHomeClient({ runId: requestedRunId }: { runId?: string }) {
  const snapshot = useSyncExternalStore(subscribeToApplicationState, getApplicationStateSnapshot, getServerApplicationStateSnapshot);
  const applicationState = snapshot === "server"
    ? { records: [] as ApplicationRecord[], selection: [] as string[], workspacePurchased: false, orders: [] as ServiceOrder[] }
    : JSON.parse(snapshot) as { records: ApplicationRecord[]; selection: string[]; workspacePurchased: boolean; orders: ServiceOrder[] };
  const run = requestedRunId ? readPlanningRun(requestedRunId) : readActivePlanningRun();
  const records = run ? applicationState.records.filter((record) => record.planningRunId === run.id) : [];
  const selectedIds = run ? readApplicationSelection(run.id) : [];
  const [requestedWorkspaceId, setRequestedWorkspaceId] = useState<string | null>(null);

  if (!run) return <DashboardShell backgroundColor="#F4F6FE"><div className="mx-auto max-w-xl rounded-[24px] border border-[#e7d0c7] bg-[#fffaf3] p-7 text-center"><h1 className="text-3xl font-semibold">没有找到本次申请规划。</h1><Link href="/planner" className="mt-6 inline-flex rounded-xl bg-[#2463eb] px-6 py-3 text-sm font-medium text-white">重新开始免费规划</Link></div></DashboardShell>;

  const recommendationsHref = `/applications/recommendations?runId=${encodeURIComponent(run.id)}`;
  const cachedSchools = new Map((readRecommendationCandidates(run.id, run.profile) ?? []).map((candidate) => {
    const school = programmeCandidateToSchoolRecommendation(candidate);
    return [school.id, school] as const;
  }));
  const schoolsByRecordId = new Map(records.map((record) => [record.id, schoolForRecord(record, cachedSchools.get(record.schoolRecommendationId))] as const));
  const readinessById = Object.fromEntries(records.map((record) => {
    const school = schoolsByRecordId.get(record.id)!;
    return [record.id, buildMaterialReadiness(record, school, readMaterialStatuses(record.id))];
  })) as Record<string, MaterialReadiness>;
  const summary = getApplicationSummary(records, readinessById);
  const priorityNodes = getApplicationJourneyNodes(records, selectedIds);
  const priorityApplicationId = priorityNodes.find((node) => node.applicationId)?.applicationId;
  const recentlyUpdatedId = [...records].sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))[0]?.id;
  const activeWorkspaceId = requestedWorkspaceId && records.some((record) => record.id === requestedWorkspaceId)
    ? requestedWorkspaceId
    : priorityApplicationId ?? recentlyUpdatedId;
  const activeRecord = records.find((record) => record.id === activeWorkspaceId);
  const activeSchool = activeRecord ? schoolsByRecordId.get(activeRecord.id) : undefined;
  const activeReadiness = activeRecord ? readinessById[activeRecord.id] : undefined;
  const activePriority = activeRecord ? priorityNodes.find((node) => node.applicationId === activeRecord.id) : undefined;
  const deadlines = [...records]
    .filter((record) => Number.isFinite(deadlineValue(record.nextDeadline)))
    .sort((left, right) => deadlineValue(left.nextDeadline) - deadlineValue(right.nextDeadline))
    .slice(0, 3);

  function showWorkspace(applicationId: string) {
    setRequestedWorkspaceId(applicationId);
    window.requestAnimationFrame(() => document.getElementById("application-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return <DashboardShell wide backgroundColor="#F4F6FE"><div className="atlas-content-container space-y-7 pb-8 font-sans text-[#14213d]">
    <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <nav aria-label="面包屑" className="mb-4 flex items-center gap-2 text-xs text-[#71809c]"><Link href="/dashboard" className="transition hover:text-[#2463eb]">我的申请</Link><span>/</span><span>概览</span><span>/</span><span className="text-[#33415f]">我的学校申请</span></nav>
        <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-[#101b38]">我的学校申请</h1>
        <p className="mt-2 text-sm leading-6 text-[#6b7892]">管理你已确认申请的学校项目，查看每个项目当前状态、材料进度与下一步事项</p>
      </div>
      <Link href={recommendationsHref} className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-[#bdd0f7] bg-white px-4 py-3 text-sm font-medium text-[#2463eb] transition hover:border-[#2463eb] hover:bg-[#f5f8ff]"><Plus size={17} />添加申请项目</Link>
    </header>

    <section aria-label="申请概览" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard icon={<FolderKanban size={21} />} label="已加入申请" value={summary.total} tone="blue" />
      <SummaryCard icon={<FileText size={21} />} label="材料准备中" value={summary.preparing} tone="amber" />
      <SummaryCard icon={<CalendarDays size={21} />} label="近 7 日截止" value={summary.deadlineSoon} tone="red" />
      <SummaryCard icon={<TriangleAlert size={21} />} label="当前阻塞项" value={summary.blocked} tone="violet" />
    </section>

    <div className="grid items-start gap-5 min-[1400px]:grid-cols-[minmax(0,1fr)_230px]">
      <section className={`${panelClass} min-w-0 overflow-hidden`} aria-labelledby="portfolio-title">
        <div className="border-b border-[#e8ecf3] px-5 py-5"><h2 id="portfolio-title" className="text-lg font-semibold text-[#15213d]">申请项目总览</h2></div>
        {records.length ? <>
          <div className="hidden grid-cols-[minmax(160px,1.35fr)_95px_110px_110px_minmax(110px,.9fr)_100px] gap-2.5 border-b border-[#edf0f5] bg-[#fafbfe] px-5 py-3 text-xs font-medium text-[#78859d] min-[1200px]:grid">
            <span>学校项目</span><span>状态</span><span>材料就绪度</span><span>截止日期</span><span>当前下一步</span><span>操作</span>
          </div>
          <div className="divide-y divide-[#edf0f5]">{records.map((record) => <ApplicationRow key={record.id} record={record} readiness={readinessById[record.id]} onSelect={() => showWorkspace(record.id)} />)}</div>
        </> : <div className="px-6 py-14 text-center"><FolderKanban className="mx-auto text-[#a8b4c8]" size={28} /><h3 className="mt-4 text-base font-semibold">尚未加入申请项目</h3><p className="mt-2 text-sm text-[#71809a]">从已核验的推荐结果中确认 Programme 后，这里会自动生成申请组合。</p><Link href={recommendationsHref} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2463eb] px-4 py-2.5 text-sm font-medium text-white">添加申请项目 <ArrowRight size={15} /></Link></div>}
      </section>

      <aside className="space-y-5">
        <section className={`${panelClass} p-5`} aria-labelledby="priority-title">
          <h2 id="priority-title" className="text-base font-semibold">当前优先事项</h2>
          {priorityNodes.length ? <ol className="mt-5 space-y-4">{priorityNodes.slice(0, 4).map((node, index) => <li key={node.id} className="flex gap-3"><span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${index === 0 ? "bg-[#e8f0ff] text-[#2463eb]" : "bg-[#f3f5f8] text-[#7a879e]"}`}>{priorityIcon(index)}</span><div className="min-w-0"><p className="text-sm font-medium leading-5 text-[#25324d]">{node.completionRequirement}</p>{node.schoolName ? <p className="mt-1 truncate text-xs text-[#8995a9]">{node.schoolName}</p> : null}</div></li>)}</ol> : <p className="mt-4 text-sm leading-6 text-[#7a879e]">加入申请项目后，Atlas 会按截止日期与依赖关系生成优先事项。</p>}
        </section>
        <section className={`${panelClass} p-5`} aria-labelledby="deadline-title">
          <div className="flex items-center gap-2"><CalendarDays size={17} className="text-[#566785]" /><h2 id="deadline-title" className="text-base font-semibold">最近截止</h2></div>
          {deadlines.length ? <div className="mt-4 space-y-3">{deadlines.map((record) => <div key={record.id} className="flex items-start justify-between gap-3 text-sm"><span className="min-w-0 truncate text-[#43516d]">{record.universityName}</span><time className="shrink-0 font-medium text-[#25324d]">{formatApplicationDeadline(record.nextDeadline)}</time></div>)}</div> : <p className="mt-4 text-sm text-[#7a879e]">暂无已公布的固定截止日期</p>}
          <a href="#portfolio-title" className="mt-5 flex items-center justify-between border-t border-[#edf0f5] pt-4 text-sm font-medium text-[#2463eb]">查看全部截止日期 <ChevronRight size={15} /></a>
        </section>
      </aside>
    </div>

    <section id="application-workspace" aria-labelledby="workspace-title" className="scroll-mt-6">
      <div className="mb-4"><h2 id="workspace-title" className="text-xl font-semibold text-[#15213d]">申请工作台预览</h2><p className="mt-1 text-sm text-[#7a879e]">默认展示当前最高优先级申请；点击上方“查看详情”可切换 Programme。</p></div>
      {activeRecord && activeSchool && activeReadiness ? <WorkspacePreview record={activeRecord} school={activeSchool} readiness={activeReadiness} actionHref={activePriority?.actionHref ?? `/applications/${encodeURIComponent(activeRecord.id)}/materials`} actionLabel={activePriority?.primaryCta ?? "继续完成"} /> : <div className={`${panelClass} px-6 py-12 text-center text-sm text-[#7a879e]`}>确认申请项目后，这里会展示对应的 Requirements、Materials 与 Current Matter。</div>}
    </section>
  </div></DashboardShell>;
}

function SummaryCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "blue" | "amber" | "red" | "violet" }) {
  const tones = { blue: "bg-[#e8f0ff] text-[#2463eb]", amber: "bg-[#fff3d8] text-[#d99618]", red: "bg-[#ffebeb] text-[#e05555]", violet: "bg-[#f0eaff] text-[#7455dc]" };
  return <div className={`${panelClass} flex items-center gap-4 p-5`}><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${tones[tone]}`}>{icon}</span><div><p className="text-sm text-[#6f7c94]">{label}</p><p className="mt-1 text-2xl font-semibold text-[#111d3b]">{value}</p></div></div>;
}

function ApplicationRow({ record, readiness, onSelect }: { record: ApplicationRecord; readiness: MaterialReadiness; onSelect: () => void }) {
  const status = applicationStatusPresentation[record.status];
  const percent = readiness.total ? Math.round((readiness.ready / readiness.total) * 100) : 0;
  const actionLabel = record.status === "ready_to_submit" ? "立即递交" : ["submitted", "waiting_result"].includes(record.status) ? "查看官网" : "继续准备";
  const secondaryHref = ["submitted", "waiting_result"].includes(record.status) && record.officialProgramUrl ? record.officialProgramUrl : `/applications/${encodeURIComponent(record.id)}/materials`;
  const external = secondaryHref.startsWith("http");
  return <article className="grid gap-4 px-5 py-5 min-[1200px]:grid-cols-[minmax(160px,1.35fr)_95px_110px_110px_minmax(110px,.9fr)_100px] min-[1200px]:items-center min-[1200px]:gap-2.5">
    <div className="flex min-w-0 items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#dbe5f6] bg-[#f6f9ff] text-sm font-semibold text-[#3470dc]">{countryCode(record.country)}</span><div className="min-w-0"><h3 className="truncate text-sm font-semibold text-[#1c2945]">{record.universityName}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-[#66748e]">{record.programName}</p></div></div>
    <div><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusToneClass(status.tone)}`}>{status.label}</span></div>
    <div><p className="text-xs font-medium text-[#34425e]">{readiness.ready}/{readiness.total} 已完成</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e8edf5]"><div className="h-full rounded-full bg-[#2463eb]" style={{ width: `${percent}%` }} /></div></div>
    <div className="flex items-center gap-2 text-xs font-medium text-[#43516c]"><CalendarDays size={15} className="shrink-0 text-[#6c7b96]" /><span>{formatApplicationDeadline(record.nextDeadline)}</span></div>
    <div className="flex min-w-0 items-start gap-2 text-xs leading-5 text-[#4a5872]"><FileText size={15} className="mt-0.5 shrink-0 text-[#3977e4]" /><span>{record.nextAction}</span></div>
    <div className="flex flex-row gap-2 min-[1200px]:flex-col"><button type="button" onClick={onSelect} className="rounded-lg border border-[#cbd5e5] px-3 py-2 text-xs font-medium text-[#43516c] transition hover:border-[#2463eb] hover:text-[#2463eb]">查看详情</button><Link href={secondaryHref} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="rounded-lg bg-[#2463eb] px-3 py-2 text-center text-xs font-medium text-white transition hover:bg-[#1856d4]">{actionLabel}</Link></div>
  </article>;
}

function WorkspacePreview({ record, school, readiness, actionHref, actionLabel }: { record: ApplicationRecord; school: SchoolRecommendation; readiness: MaterialReadiness; actionHref: string; actionLabel: string }) {
  const requirements = record.programmeEvidenceSnapshot?.admissionRequirements ?? school.admissionRequirements ?? getAdmissionRequirements(school);
  const stageIndex = applicationTimelineIndex(record.status);
  return <div className={`${panelClass} overflow-hidden`}>
    <div className="flex items-center gap-3 border-b border-[#e8ecf3] px-5 py-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#dbe5f6] bg-[#f6f9ff] text-sm font-semibold text-[#3470dc]">{countryCode(record.country)}</span><div className="min-w-0"><p className="text-sm font-semibold text-[#17233f]">{record.universityName} <span className="font-normal text-[#91a0b6]">—</span> {record.programName}</p><p className="mt-1 text-xs text-[#7a879e]">沿用推荐阶段已核验的项目要求 · Requirements Fit，不代表录取概率</p></div></div>
    <div className="grid gap-5 p-5 xl:grid-cols-[1.35fr_.7fr_1fr]">
      <RequirementPanel requirements={requirements} />
      <MaterialPanel readiness={readiness} />
      <div className="rounded-2xl border border-[#f0d58d] bg-[#fffaf0] p-5"><p className="text-sm font-semibold text-[#5d4a18]">当前下一步</p><div className="mt-4 flex gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#ffe9ad] text-[#d89816]"><FileText size={20} /></span><div><h3 className="text-base font-semibold leading-6 text-[#1e2942]">{record.nextAction}</h3><p className="mt-2 text-xs leading-5 text-[#6c654f]">Atlas 已根据材料依赖、申请就绪度与截止日期识别此任务为当前事项。当前 {readiness.ready}/{readiness.total} 项必需材料已就绪。</p></div></div><Link href={actionHref} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#2463eb] px-4 py-2.5 text-sm font-medium text-white">{actionLabel} <ArrowRight size={15} /></Link></div>
    </div>
    <div className="border-t border-[#e8ecf3] px-5 py-5"><div className="grid grid-cols-4">{timelineLabels.map((label, index) => <div key={label} className="relative flex flex-col items-center text-center"><div className={`absolute left-0 right-0 top-3 h-px ${index <= stageIndex ? "bg-[#7da5f1]" : "bg-[#dfe5ee]"} ${index === 0 ? "left-1/2" : ""} ${index === timelineLabels.length - 1 ? "right-1/2" : ""}`} /><span className={`relative z-10 grid h-7 w-7 place-items-center rounded-full border ${index < stageIndex ? "border-[#2463eb] bg-[#2463eb] text-white" : index === stageIndex ? "border-[#2463eb] bg-white text-[#2463eb]" : "border-[#d9e0eb] bg-[#f5f7fa] text-[#97a3b5]"}`}>{index < stageIndex ? <Check size={14} /> : index === 1 ? <Send size={13} /> : <Circle size={10} />}</span><span className={`mt-2 text-xs font-medium ${index === stageIndex ? "text-[#2463eb]" : "text-[#78859b]"}`}>{label}</span></div>)}</div></div>
  </div>;
}

function RequirementPanel({ requirements }: { requirements: AdmissionRequirement[] }) {
  return <div className="min-w-0"><h3 className="text-sm font-semibold text-[#24314d]">申请要求匹配</h3>{requirements.length ? <div className="mt-4 overflow-hidden rounded-xl border border-[#e6eaf1]"><div className="hidden grid-cols-[.7fr_1.15fr_1fr_.55fr] bg-[#f7f9fc] px-3 py-2 text-[11px] font-medium text-[#77849a] sm:grid"><span>录取维度</span><span>学校要求</span><span>你的情况</span><span>判断</span></div><div className="divide-y divide-[#edf0f5]">{requirements.slice(0, 5).map((requirement) => <div key={requirement.id} className="grid gap-2 px-3 py-3 text-xs leading-5 sm:grid-cols-[.7fr_1.15fr_1fr_.55fr]"><span className="font-medium text-[#3b4965]"><span className="mr-1 text-[#93a0b3] sm:hidden">录取维度：</span>{requirement.label}</span><span className="text-[#65728a]"><span className="mr-1 text-[#93a0b3] sm:hidden">学校要求：</span>{requirement.schoolRequirement}</span><span className="text-[#65728a]"><span className="mr-1 text-[#93a0b3] sm:hidden">你的情况：</span>{requirement.userSituation}</span><RequirementStatus requirement={requirement} /></div>)}</div></div> : <p className="mt-4 rounded-xl bg-[#f7f9fc] p-4 text-xs leading-5 text-[#77849a]">项目要求正在完成结构化整理，推荐阶段已核验的信息会继续保留。</p>}</div>;
}

function RequirementStatus({ requirement }: { requirement: AdmissionRequirement }) {
  const good = requirement.status === "meets" || requirement.status === "mostly_meets";
  const bad = requirement.status === "gap_detected";
  const label = requirement.status === "meets" ? "满足" : requirement.status === "mostly_meets" ? "基本满足" : bad ? "有差距" : "待确认";
  return <span className={`flex items-start gap-1 font-medium ${good ? "text-[#299568]" : bad ? "text-[#cf4f4f]" : "text-[#d88c18]"}`}>{good ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> : <TriangleAlert size={14} className="mt-0.5 shrink-0" />}{label}</span>;
}

function MaterialPanel({ readiness }: { readiness: MaterialReadiness }) {
  return <div><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-[#24314d]">申请材料</h3><span className="text-xs font-medium text-[#64728a]">{readiness.ready}/{readiness.total}</span></div><ul className="mt-4 space-y-3">{readiness.items.map((material) => <li key={material.id} className="flex items-center justify-between gap-3 text-xs"><span className="flex min-w-0 items-center gap-2 text-[#46546f]">{material.label === "Ready" ? <CheckCircle2 size={15} className="shrink-0 text-[#2d9b6b]" /> : material.label === "Needs Update" ? <Clock3 size={15} className="shrink-0 text-[#d7961d]" /> : <Circle size={15} className="shrink-0 text-[#8290a7]" />}<span className="truncate">{material.name}</span></span><span className="shrink-0 text-[10px] text-[#8a96a9]">{material.label}</span></li>)}</ul></div>;
}

function schoolForRecord(record: ApplicationRecord, cachedSchool?: SchoolRecommendation): SchoolRecommendation {
  return {
    id: record.schoolRecommendationId,
    universityId: cachedSchool?.universityId ?? record.universityName,
    universityName: record.universityName,
    programName: record.programName,
    country: record.country,
    city: cachedSchool?.city ?? "待确认",
    intake: record.intake,
    duration: cachedSchool?.duration ?? "待确认",
    tuition: cachedSchool?.tuition ?? 0,
    currency: cachedSchool?.currency ?? "",
    deadline: record.nextDeadline ?? cachedSchool?.deadline ?? "待确认",
    deadlineType: cachedSchool?.deadlineType ?? (/rolling|滚动/i.test(record.nextDeadline ?? "") ? "rolling" : "official"),
    category: cachedSchool?.category ?? "manual_review",
    reasons: cachedSchool?.reasons ?? [],
    matchedRequirements: cachedSchool?.matchedRequirements ?? [],
    risks: cachedSchool?.risks ?? [],
    requirements: cachedSchool?.requirements ?? [],
    admissionRequirements: record.programmeEvidenceSnapshot?.admissionRequirements ?? cachedSchool?.admissionRequirements,
    materialsReady: record.preparedMaterials,
    materialsTotal: record.totalMaterials,
    isSelected: true,
    isConfirmed: true,
    officialProgramUrl: record.officialProgramUrl ?? cachedSchool?.officialProgramUrl,
    applicationUrl: record.applicationPortalUrl ?? cachedSchool?.applicationUrl,
    applicationProvider: cachedSchool?.applicationProvider,
    applicationLinkStatus: record.applicationLinkStatus ?? cachedSchool?.applicationLinkStatus ?? "needs_review",
    recommendationContent: cachedSchool?.recommendationContent ?? { summary: "", personalFit: "", schoolHighlights: "", programHighlights: "", cautions: [], sources: record.programmeEvidenceSnapshot?.sources ?? [] },
  };
}

function readMaterialStatuses(applicationId: string) {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(`atlas.material-statuses.${applicationId}`) ?? "{}") as Record<string, string>; } catch { return {}; }
}

function deadlineValue(value?: string) {
  if (!value || /rolling|滚动/i.test(value)) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

function statusToneClass(tone: "blue" | "green" | "amber" | "red" | "neutral") {
  return { blue: "bg-[#eaf2ff] text-[#2f68c9]", green: "bg-[#e8f6ee] text-[#28835b]", amber: "bg-[#fff4dc] text-[#b97912]", red: "bg-[#ffebeb] text-[#c94d4d]", neutral: "bg-[#f0f2f6] text-[#68758b]" }[tone];
}

function priorityIcon(index: number) {
  if (index === 0) return <FileText size={14} />;
  if (index === 1) return <CheckCircle2 size={14} />;
  if (index === 2) return <Clock3 size={14} />;
  return <Send size={14} />;
}
