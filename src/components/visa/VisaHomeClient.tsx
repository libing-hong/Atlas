"use client";

import { type ChangeEvent, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AlertTriangle, Archive, CheckCircle2, ExternalLink, FileUp, Lock } from "lucide-react";
import { Card } from "@/components/Card";
import { DashboardShell } from "@/components/PageShell";
import { getApplicationStateSnapshot, getServerApplicationStateSnapshot, subscribeToApplicationState, updateApplicationRecord } from "@/lib/application-store";
import type { ApplicationRecord } from "@/lib/application-prototype-data";
import { deleteMaterialFile, saveMaterialFile } from "@/lib/material-repository";
import { emptyVisaFacts, updateVisaTask, type VisaApplicantFacts, type VisaMaterial, type VisaWorkspace } from "@/lib/visa-engine";
import { confirmFinalOffer, readVisaWorkspaces, saveVisaFacts, saveVisaWorkspace, subscribeVisaWorkspaces } from "@/lib/visa-store";

const statusCopy = {
  not_applicable: "不适用", waiting_for_dependency: "等待前置事项", not_started: "未开始", atlas_processing: "Atlas 处理中",
  user_action_required: "需要你操作", needs_confirmation: "需要确认", blocked: "已阻塞", ready: "可以执行",
  completed: "已完成", expired: "已过期", needs_review: "需要人工复核",
} as const;
const statusClass = {
  not_applicable: "border-slate-200 bg-slate-50 text-slate-600", waiting_for_dependency: "border-slate-200 bg-slate-50 text-slate-600",
  not_started: "border-slate-200 bg-white text-slate-600", atlas_processing: "border-blue-200 bg-blue-50 text-blue-700",
  user_action_required: "border-red-200 bg-red-50 text-red-700", needs_confirmation: "border-amber-200 bg-amber-50 text-amber-700",
  blocked: "border-red-200 bg-red-50 text-red-700", ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700", expired: "border-red-200 bg-red-50 text-red-700",
  needs_review: "border-amber-200 bg-amber-50 text-amber-700",
} as const;

const visaSnapshot = () => JSON.stringify(readVisaWorkspaces());
const serverVisaSnapshot = () => "[]";

export function VisaHomeClient() {
  const applicationSnapshot = useSyncExternalStore(subscribeToApplicationState, getApplicationStateSnapshot, getServerApplicationStateSnapshot);
  const workspaceSnapshot = useSyncExternalStore(subscribeVisaWorkspaces, visaSnapshot, serverVisaSnapshot);
  const records = applicationSnapshot === "server" ? [] : (JSON.parse(applicationSnapshot) as { records: ApplicationRecord[] }).records;
  const workspaces = JSON.parse(workspaceSnapshot) as VisaWorkspace[];
  const offers = records.filter((record) => ["conditional_offer", "unconditional_offer", "accepted"].includes(record.status) && record.offerEvidenceAvailable);
  const active = workspaces.find((workspace) => workspace.status === "active");
  const activeApplication = active ? records.find((record) => record.id === active.applicationId) : undefined;
  if (!active || !activeApplication) return <OfferGate offers={offers} records={records} archived={workspaces.filter((workspace) => workspace.status === "archived")} />;
  return <VisaWorkspaceView initial={active} application={activeApplication} archived={workspaces.filter((workspace) => workspace.status === "archived")} />;
}

function OfferGate({ offers, records, archived }: { offers: ApplicationRecord[]; records: ApplicationRecord[]; archived: VisaWorkspace[] }) {
  return <DashboardShell><div className="mx-auto max-w-3xl space-y-5">
    <Card className="p-7 text-center"><Lock className="mx-auto text-[#8f847a]" /><h1 className="mt-4 font-editorial text-4xl font-semibold text-[#2f2924]">确认最终入读学校后，Atlas 会生成签证流程</h1><p className="mt-3 text-sm leading-6 text-[#6f6256]">签证国家不会读取最初的留学偏好，只读取满足条件且由你最终接受的 Offer。</p>
      {!offers.length ? <Link href="/dashboard/applications" className="mt-5 inline-flex rounded-full bg-[#2f2924] px-5 py-3 text-sm text-white">返回申请进展</Link> : <div className="mt-6 grid gap-3 text-left">{offers.map((offer) => <article key={offer.id} className="rounded-2xl border border-[#ded3c6] bg-white p-4"><h2 className="font-semibold text-[#2f2924]">{offer.universityName}</h2><p className="mt-1 text-sm text-[#6f6256]">{offer.programName} · {offer.country} · {offer.intake}</p>{offer.offerConditionsSatisfied === true ? <button type="button" onClick={() => confirmFinalOffer(offer, records)} className="mt-4 rounded-full bg-[#2f2924] px-4 py-2.5 text-sm text-white">确认作为最终接受的 Offer</button> : <button type="button" onClick={() => updateApplicationRecord(offer.id, { offerConditionsSatisfied: true, nextAction: "确认最终入读学校" })} className="mt-4 rounded-full border border-[#c7aa7b] px-4 py-2.5 text-sm text-[#6b5434]">确认 Offer 条件已满足</button>}</article>)}</div>}
    </Card>
    <ArchivedWorkspaces items={archived} />
  </div></DashboardShell>;
}

function VisaWorkspaceView({ initial, application, archived }: { initial: VisaWorkspace; application: ApplicationRecord; archived: VisaWorkspace[] }) {
  const [workspace, setWorkspace] = useState(initial);
  const [factsOpen, setFactsOpen] = useState(!workspace.tasks.find((task) => task.id === "facts_confirmed" && task.status === "completed"));
  const [facts, setFacts] = useState<VisaApplicantFacts>({ ...emptyVisaFacts, ...workspace.facts });
  const [uploadTarget, setUploadTarget] = useState<VisaMaterial | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const current = workspace.tasks.find((task) => !["completed", "not_applicable", "waiting_for_dependency"].includes(task.status))
    ?? workspace.tasks.find((task) => task.status === "waiting_for_dependency");
  const blockers = workspace.tasks.filter((task) => ["blocked", "user_action_required", "needs_confirmation", "expired"].includes(task.status));
  const materialMap = useMemo(() => new Map(workspace.materials.map((material) => [material.id, material])), [workspace.materials]);

  function persist(next: VisaWorkspace) { setWorkspace(next); saveVisaWorkspace(next); }
  function completeTask(id: string) { persist(updateVisaTask(workspace, id, "completed")); }
  function submitFacts(event: React.FormEvent) { event.preventDefault(); const next = saveVisaFacts(workspace, facts, application); setWorkspace(next); setFactsOpen(false); }
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file || !uploadTarget) return;
    const stored = await saveMaterialFile(file, "other", application.id);
    const materials = workspace.materials.map((item) => item.id === uploadTarget.id ? { ...item, storedMaterialId: stored.id, status: "needs_confirmation" as const, atlasRecognized: false, needsHumanConfirmation: true } : item);
    persist({ ...workspace, materials, updatedAt: new Date().toISOString() }); event.target.value = "";
  }
  async function removeMaterial(item: VisaMaterial) {
    if (item.storedMaterialId) await deleteMaterialFile(item.storedMaterialId);
    const materials = workspace.materials.map((value) => value.id === item.id ? { ...value, storedMaterialId: undefined, status: "not_started" as const, atlasRecognized: false, needsHumanConfirmation: true } : value);
    persist({ ...workspace, materials, updatedAt: new Date().toISOString() });
  }
  function confirmMaterial(item: VisaMaterial) {
    const materials = workspace.materials.map((value) => value.id === item.id ? { ...value, status: "completed" as const, needsHumanConfirmation: false } : value);
    persist({ ...workspace, materials, updatedAt: new Date().toISOString() });
  }

  return <DashboardShell><div className="space-y-6">
    <input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="sr-only" onChange={(event) => { void upload(event); }} />
    <header><p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">Visa workspace</p><h1 className="mt-2 font-editorial text-5xl font-semibold text-[#2f2924]">{workspace.visaType}</h1><p className="mt-3 text-sm text-[#6f6256]">{workspace.universityName} · {workspace.programmeName}</p></header>

    {current ? <Card className="border border-[#c9dbc5] bg-[#f0f5ef] p-6"><p className="text-xs font-medium uppercase tracking-[0.2em] text-[#5f805f]">现在只做这一件事</p><h2 className="mt-2 text-2xl font-semibold text-[#2f2924]">{current.title}</h2><p className="mt-2 text-sm leading-6 text-[#58705b]">{current.description}</p>{current.status !== "waiting_for_dependency" && current.status !== "completed" ? <button type="button" onClick={() => current.id === "facts_confirmed" ? setFactsOpen(true) : completeTask(current.id)} className="mt-4 rounded-full bg-[#36573c] px-5 py-2.5 text-sm text-white">{current.id === "facts_confirmed" ? "集中确认信息" : "确认已完成"}</button> : null}</Card> : null}

    {blockers.length ? <Card className="border border-red-200 bg-red-50 p-5"><div className="flex gap-3"><AlertTriangle className="mt-0.5 text-red-700" /><div><h2 className="font-semibold text-red-900">当前阻塞与待确认</h2><div className="mt-3 space-y-3">{blockers.map((item) => <div key={item.id}><p className="text-sm font-medium text-red-900">{item.title} · {statusCopy[item.status]}</p><p className="mt-1 text-xs leading-5 text-red-700">{item.description}</p></div>)}</div></div></div></Card> : null}

    {factsOpen ? <FactsForm facts={facts} setFacts={setFacts} onSubmit={submitFacts} /> : <button type="button" onClick={() => setFactsOpen(true)} className="text-sm font-medium text-[#4f6d54] underline underline-offset-4">查看或修改个人签证信息</button>}

    <Card><h2 className="font-editorial text-3xl font-semibold text-[#2f2924]">完整时间线</h2><div className="mt-5 space-y-3">{workspace.tasks.map((task, index) => <article key={task.id} className="rounded-2xl border border-[#e8dfd3] p-4"><div className="flex items-start justify-between gap-4"><div><p className="text-xs text-[#9a8b7c]">步骤 {index + 1}</p><h3 className="mt-1 font-medium text-[#2f2924]">{task.title}</h3><p className="mt-1 text-sm text-[#6f6256]">{task.description}</p>{task.blockedBy.length ? <p className="mt-2 text-xs text-[#8a5a51]">等待：{task.blockedBy.map((id) => workspace.tasks.find((item) => item.id === id)?.title ?? id).join("、")}</p> : null}</div><span className={`shrink-0 rounded-full border px-3 py-1 text-xs ${statusClass[task.status]}`}>{statusCopy[task.status]}</span></div>{task.officialSource ? <a href={task.officialSource.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-[#4f6d54] underline">{task.officialSource.title}<ExternalLink size={12} /></a> : null}</article>)}</div></Card>

    <Card><h2 className="font-editorial text-3xl font-semibold text-[#2f2924]">动态材料清单</h2><p className="mt-2 text-sm text-[#6f6256]">Atlas 仅显示流程所需状态，不展示完整账户号、护照号或认证凭据。</p><div className="mt-5 grid gap-3 md:grid-cols-2">{[...materialMap.values()].map((item) => <article key={item.id} className="rounded-2xl border border-[#e8dfd3] p-4"><div className="flex items-start justify-between gap-3"><h3 className="font-medium text-[#2f2924]">{item.name}</h3><span className={`rounded-full border px-2.5 py-1 text-xs ${statusClass[item.status]}`}>{statusCopy[item.status]}</span></div><p className="mt-2 text-xs leading-5 text-[#6f6256]">{item.applicableReason}</p><p className="mt-2 text-xs text-[#8f847a]">完成标准：{item.completionCriteria}</p><a href={item.officialSource.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-[#4f6d54] underline">官方来源<ExternalLink size={12} /></a><div className="mt-3 flex flex-wrap gap-2">{!item.storedMaterialId ? <button type="button" onClick={() => { setUploadTarget(item); inputRef.current?.click(); }} className="inline-flex items-center gap-1 rounded-full border border-[#d8ccbe] px-3 py-2 text-xs"><FileUp size={13} />上传</button> : <><button type="button" onClick={() => confirmMaterial(item)} className="inline-flex items-center gap-1 rounded-full bg-[#36573c] px-3 py-2 text-xs text-white"><CheckCircle2 size={13} />确认正确</button><button type="button" onClick={() => void removeMaterial(item)} className="rounded-full border border-[#d8ccbe] px-3 py-2 text-xs">删除并重传</button></>}</div></article>)}</div></Card>

    <Card className="p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold text-[#2f2924]">规则版本与复核</h2><p className="mt-2 text-sm text-[#6f6256]">版本 {workspace.ruleVersion} · 最后核验 {workspace.ruleVerifiedAt}</p><p className="mt-1 text-xs text-[#8f847a]">正式递交前必须再次使用官方工具核对个人清单；复杂身份、拒签史、家属或政策变化将进入人工复核。</p></div><a href={workspace.tasks.find((task) => task.officialSource)?.officialSource?.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-sm text-[#4f6d54] underline">官方入口</a></div></Card>
    <ArchivedWorkspaces items={archived} />
  </div></DashboardShell>;
}

function FactsForm({ facts, setFacts, onSubmit }: { facts: VisaApplicantFacts; setFacts: (value: VisaApplicantFacts) => void; onSubmit: (event: React.FormEvent) => void }) {
  const text = (key: keyof VisaApplicantFacts) => (event: ChangeEvent<HTMLInputElement>) => setFacts({ ...facts, [key]: event.target.value || null });
  const number = (key: keyof VisaApplicantFacts) => (event: ChangeEvent<HTMLInputElement>) => setFacts({ ...facts, [key]: event.target.value ? Number(event.target.value) : null });
  const boolean = (key: keyof VisaApplicantFacts) => (event: ChangeEvent<HTMLSelectElement>) => setFacts({ ...facts, [key]: event.target.value === "" ? null : event.target.value === "yes" });
  return <Card><h2 className="font-editorial text-3xl font-semibold">一次性确认个人签证信息</h2><form onSubmit={onSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
    <Field label="国籍"><input required value={facts.nationality ?? ""} onChange={text("nationality")} className="atlas-input" /></Field>
    <Field label="当前居住国家"><input required value={facts.residenceCountry ?? ""} onChange={text("residenceCountry")} className="atlas-input" /></Field>
    <Field label="年龄"><input required min={0} type="number" value={facts.age ?? ""} onChange={number("age")} className="atlas-input" /></Field>
    <Field label="课程开课日期"><input required type="date" value={facts.courseStartDate ?? ""} onChange={text("courseStartDate")} className="atlas-input" /></Field>
    <Field label="课程时长（月）"><input required min={1} type="number" value={facts.courseDurationMonths ?? ""} onChange={number("courseDurationMonths")} className="atlas-input" /></Field>
    <Field label="是否携带家属"><YesNo value={facts.hasDependants} onChange={boolean("hasDependants")} /></Field>
    <Field label="是否已获得学校签证文件"><YesNo value={facts.hasSchoolVisaDocument} onChange={boolean("hasSchoolVisaDocument")} /></Field>
    <Field label="是否曾在该国学习或居住"><YesNo value={facts.previousStudyOrResidence} onChange={boolean("previousStudyOrResidence")} /></Field>
    <Field label="是否有拒签史"><YesNo value={facts.hasVisaRefusalHistory} onChange={boolean("hasVisaRefusalHistory")} /></Field>
    <Field label="是否涉及体检或特殊审批"><YesNo value={facts.hasSpecialApproval} onChange={boolean("hasSpecialApproval")} /></Field>
    <button type="submit" className="md:col-span-2 rounded-full bg-[#2f2924] px-5 py-3 text-sm text-white">确认并重新计算流程</button>
  </form></Card>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-2 text-sm text-[#5d5148]"><span>{label}</span>{children}</label>; }
function YesNo({ value, onChange }: { value: boolean | null; onChange: (event: ChangeEvent<HTMLSelectElement>) => void }) { return <select required value={value === null ? "" : value ? "yes" : "no"} onChange={onChange} className="atlas-input"><option value="">请选择</option><option value="yes">是</option><option value="no">否</option></select>; }
function ArchivedWorkspaces({ items }: { items: VisaWorkspace[] }) { if (!items.length) return null; return <Card className="p-5"><div className="flex gap-3"><Archive className="mt-0.5 text-[#8f847a]" /><div><h2 className="font-semibold text-[#2f2924]">历史签证工作区</h2>{items.map((item) => <div key={item.id} className="mt-3 text-sm text-[#6f6256]"><p>{item.universityName} · {item.visaType}</p><p className="mt-1 text-xs text-[#8f847a]">已归档：{item.archiveReason ?? "最终录取发生变化"}；原记录未删除。</p></div>)}</div></div></Card>; }

