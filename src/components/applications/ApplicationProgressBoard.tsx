"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowUpRight, FileUp } from "lucide-react";
import { Card } from "@/components/Card";
import type { ApplicationRecord, ApplicationSubmissionMode } from "@/lib/application-prototype-data";
import {
  applicationJourneySummary,
  attachOfferEvidence,
  chooseSubmissionMode,
  confirmApplicationSubmitted,
  getVerifiedApplicationPortal,
  markPortalOpened,
} from "@/lib/application-journey";
import { updateApplicationRecord } from "@/lib/application-store";
import { saveMaterialFile } from "@/lib/material-repository";

const statusCopy: Record<string, string> = {
  selected: "已确认申请",
  preparing_materials: "准备材料",
  ready_to_submit: "可以提交",
  submission_in_progress: "正在填写官方申请",
  submitted: "已提交",
  waiting_result: "等待学校结果",
  supplement_required: "需要补件",
  conditional_offer: "收到有条件 Offer",
  unconditional_offer: "收到无条件 Offer",
  accepted: "已确认最终入读",
  rejected: "未录取",
  withdrawn: "已撤回",
};

const modeCopy: Record<ApplicationSubmissionMode, string> = {
  unselected: "尚未选择",
  diy: "用户自行提交",
  atlas_single: "Atlas 单校服务",
  atlas_full_service: "Atlas 全流程服务",
};

function providerAction(provider?: string) {
  if (provider === "UCAS") return "前往 UCAS 申请";
  if (provider === "Campus France") return "前往 Campus France";
  if (provider === "Mon Master") return "前往 Mon Master";
  if (provider === "university") return "前往学校申请系统";
  return "查看学校官方申请步骤";
}

export function ApplicationProgressBoard({ records }: { records: ApplicationRecord[] }) {
  const summary = applicationJourneySummary(records);
  return <section>
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs uppercase tracking-[0.24em] text-[#9a8b7c]">全部学校申请进度</p><h2 className="mt-2 font-editorial text-3xl font-semibold text-[#2f2924]">多校申请总览</h2></div>
      {summary.offers ? <Link href="/dashboard/visa" className="rounded-full bg-[#36573c] px-4 py-2.5 text-sm text-white">进入我的签证</Link> : null}
    </div>
    <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
      <Metric label="共申请" value={summary.total} />
      <Metric label="准备中" value={summary.preparing} />
      <Metric label="已提交" value={summary.submitted} />
      <Metric label="等待结果" value={summary.waiting} />
      <Metric label="已收 Offer" value={summary.offers} />
    </div>
    <div className="grid gap-4">{records.map((record) => <ApplicationProgressCard key={record.id} record={record} />)}</div>
  </section>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl bg-[#f7f0e8] p-4"><p className="text-xs text-[#8f847a]">{label}</p><p className="mt-1 text-2xl font-semibold text-[#2f2924]">{value}</p></div>;
}

function ApplicationProgressCard({ record }: { record: ApplicationRecord }) {
  const [confirming, setConfirming] = useState(false);
  const [reference, setReference] = useState(record.applicationReference ?? "");
  const [submittedAt, setSubmittedAt] = useState(new Date().toISOString().slice(0, 10));
  const [evidenceName, setEvidenceName] = useState(record.submissionEvidenceFileName ?? "");
  const offerInput = useRef<HTMLInputElement>(null);
  const evidenceInput = useRef<HTMLInputElement>(null);
  const portal = getVerifiedApplicationPortal(record);

  function persist(next: ApplicationRecord) { updateApplicationRecord(record.id, next); }
  function selectMode(mode: ApplicationSubmissionMode) { persist(chooseSubmissionMode(record, mode)); }
  function openPortal() {
    if (!portal) return;
    persist(markPortalOpened(record));
    window.open(portal, "_blank", "noopener,noreferrer");
  }
  function confirmSubmitted() {
    persist(confirmApplicationSubmitted(record, {
      submittedAt: new Date(`${submittedAt}T12:00:00`).toISOString(),
      applicationReference: reference,
      submissionEvidenceFileName: evidenceName,
    }));
    setConfirming(false);
  }
  async function uploadOffer(file?: File) {
    if (!file) return;
    await saveMaterialFile(file, "other", record.id);
    persist(attachOfferEvidence(record, file.name));
  }

  return <div data-testid={`application-progress-${record.id}`}><Card className="p-5">
    <input ref={offerInput} className="sr-only" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => { void uploadOffer(event.target.files?.[0]); }} />
    <input ref={evidenceInput} className="sr-only" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setEvidenceName(event.target.files?.[0]?.name ?? "")} />
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
      <div><p className="text-xs text-[#8f847a]">{record.country} · {record.intake}</p><h3 className="mt-1 text-xl font-semibold text-[#2f2924]">{record.universityName}</h3><p className="mt-1 text-sm text-[#6f6256]">{record.programName}</p></div>
      <span className="self-start rounded-full border border-[#d8ccbe] bg-[#f7f0e8] px-3 py-1 text-xs text-[#5d5148]">{statusCopy[record.status] ?? record.status}</span>
    </div>
    <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e8dfd3]"><div className="h-full rounded-full bg-[#6f856a]" style={{ width: `${record.applicationProgress}%` }} /></div>
    <div className="mt-2 flex justify-between text-xs text-[#8f847a]"><span>流程进度 {record.applicationProgress}%（不是录取概率）</span><span>{record.preparedMaterials}/{record.totalMaterials} 项材料</span></div>
    <div className="mt-4 grid gap-2 text-sm text-[#5d5148] md:grid-cols-3"><p>申请方式：{modeCopy[record.submissionMode]}</p><p>最近更新：{new Date(record.updatedAt).toLocaleDateString("zh-CN")}</p><p>截止日期：{record.nextDeadline ?? "待确认"}</p></div>
    <p className="mt-3 text-sm font-medium text-[#2f2924]">下一步：{record.nextAction}</p>

    {record.status === "ready_to_submit" || record.status === "preparing_materials" ? <div className="mt-4 flex flex-wrap gap-2">
      <button type="button" onClick={() => selectMode("diy")} className="rounded-full bg-[#2f2924] px-4 py-2.5 text-sm text-white">用户自行提交</button>
      <button type="button" onClick={() => selectMode("atlas_single")} className="rounded-full border border-[#d8ccbe] px-4 py-2.5 text-sm">选择单校服务</button>
    </div> : null}

    {record.submissionMode === "diy" ? <div className="mt-4 rounded-2xl bg-[#fffaf3] p-4">
      {portal ? <button type="button" onClick={openPortal} className="inline-flex items-center gap-2 rounded-full bg-[#2f2924] px-4 py-2.5 text-sm text-white">{providerAction(record.applicationProvider)}<ArrowUpRight size={14} /></button> : <p className="text-sm text-[#8a5a51]">正式申请入口仍在核验。请在材料工作区查看经过核验的专业官方页面。</p>}
      {record.applicationPortalOpenedAt ? <div className="mt-3"><p className="text-sm font-medium text-[#4f6d54]">已打开官方申请系统</p><p className="mt-1 text-xs text-[#6f6256]">完成提交后，请返回 Atlas 更新状态。打开外部网站不代表已经提交。</p><button type="button" onClick={() => setConfirming(true)} className="mt-3 rounded-full border border-[#c7aa7b] px-4 py-2 text-sm">我已提交申请</button></div> : null}
    </div> : null}

    {confirming ? <div className="mt-4 grid gap-3 rounded-2xl border border-[#d8ccbe] p-4 md:grid-cols-2">
      <label className="grid gap-1 text-sm">提交日期<input type="date" value={submittedAt} onChange={(event) => setSubmittedAt(event.target.value)} className="atlas-input" /></label>
      <label className="grid gap-1 text-sm">Application Reference（可选）<input value={reference} onChange={(event) => setReference(event.target.value)} className="atlas-input" /></label>
      <button type="button" onClick={() => evidenceInput.current?.click()} className="rounded-full border border-[#d8ccbe] px-4 py-2 text-sm">{evidenceName || "上传提交确认（可选）"}</button>
      <button type="button" onClick={confirmSubmitted} className="rounded-full bg-[#36573c] px-4 py-2 text-sm text-white">确认已完成正式提交</button>
    </div> : null}

    {["submitted", "waiting_result", "supplement_required", "conditional_offer", "unconditional_offer"].includes(record.status) ? <div className="mt-4 flex flex-wrap gap-2">
      <button type="button" onClick={() => offerInput.current?.click()} className="inline-flex items-center gap-2 rounded-full bg-[#36573c] px-4 py-2.5 text-sm text-white"><FileUp size={14} />上传录取通知书</button>
      {record.status === "waiting_result" ? <><button type="button" onClick={() => updateApplicationRecord(record.id, { status: "supplement_required", nextAction: "查看并提交学校要求的补充材料", applicationProgress: 90 })} className="rounded-full border border-[#d8ccbe] px-4 py-2.5 text-sm">学校要求补件</button><button type="button" onClick={() => updateApplicationRecord(record.id, { status: "rejected", decisionStatus: "rejected", applicationProgress: 100, nextAction: "查看其他学校申请进度" })} className="rounded-full border border-[#d8ccbe] px-4 py-2.5 text-sm">标记未录取</button></> : null}
    </div> : null}
    <Link href={`/applications/${encodeURIComponent(record.id)}/materials`} className="mt-4 inline-flex text-sm font-medium text-[#4f6d54] underline underline-offset-4">进入工作区</Link>
  </Card></div>;
}

