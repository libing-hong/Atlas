"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Check, CheckCircle2, CircleAlert, Copy, FileUp, LoaderCircle, Upload, X } from "lucide-react";
import { Card } from "@/components/Card";
import { ApplicationMode, getMaterialsForApplication, readApplicationMode, readApplicationRecords, updateApplicationRecord } from "@/lib/application-store";
import { AdmissionRequirement, ApplicationMaterial, ApplicationRecord, getAdmissionRequirements, RequirementStatus, SchoolRecommendation } from "@/lib/application-prototype-data";
import { getAdmissionKnowledge } from "@/lib/admission-knowledge";
import { readActivePlanningRun } from "@/lib/planning-store";
import { InstitutionEligibilityPanel, InstitutionVerification } from "./InstitutionEligibilityPanel";

const requirementLabels: Record<RequirementStatus, string> = { meets: "已达标", mostly_meets: "基本符合", needs_confirmation: "需要确认", gap_detected: "尚未达标", unknown: "信息不足" };
const materialLabels: Record<string, string> = { not_detected: "未检测到", uploading: "上传中", processing: "Atlas 正在读取", needs_confirmation: "等待你确认", confirmed: "已确认", prepared: "已确认", review_required: "需要进一步检查", rejected: "文件无法使用" };
const primaryButton = "inline-flex items-center justify-center gap-2 rounded-full bg-[#2f2924] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#493d34] disabled:cursor-not-allowed disabled:opacity-60";
const greenButton = "inline-flex items-center justify-center gap-2 rounded-full bg-[#5f805f] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#6f906f] disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButton = "inline-flex items-center justify-center gap-2 rounded-full border border-[#d8ccbe] px-5 py-3 text-sm text-[#4a3d34] transition hover:bg-[#f7f0e8] disabled:cursor-not-allowed disabled:opacity-60";

type VerificationState = "idle" | "loading" | "success" | "error";

export function MaterialsWorkspaceClient({ school, applicationId }: { school: SchoolRecommendation; applicationId: string }) {
  const record = useMemo<ApplicationRecord>(() => readApplicationRecords().find((item) => item.id === applicationId) ?? {
    id: applicationId, planningRunId: readActivePlanningRun()?.id ?? "legacy", schoolRecommendationId: school.id, universityName: school.universityName, programName: school.programName,
    country: school.country, intake: school.intake, status: "materials_in_progress", detectedMaterialCount: school.materialsReady, preparedMaterials: school.materialsReady,
    totalMaterials: school.materialsTotal, missingMaterials: [], applicationProgress: Math.round((school.materialsReady / school.materialsTotal) * 45), nextAction: "准备申请材料", serviceType: "none",
  }, [applicationId, school]);
  const requirements = useMemo(() => getAdmissionRequirements(school), [school]);
  const knowledge = getAdmissionKnowledge(school.id);
  const baseMaterials = useMemo(() => getMaterialsForApplication(record, school), [record, school]);
  const [statuses, setStatuses] = useState<Record<string, string>>(() => Object.fromEntries(baseMaterials.map((item) => [item.id, item.status])));
  const [files, setFiles] = useState<Record<string, string>>({});
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [activeRequirement, setActiveRequirement] = useState<AdmissionRequirement | null>(null);
  const [confirmedIds, setConfirmedIds] = useState<string[]>([]);
  const [institution, setInstitution] = useState<InstitutionVerification>({ complete: false, institutionName: "深圳大学", englishName: "Shenzhen University", average: 78 });
  const [applicationMode, setApplicationMode] = useState<ApplicationMode>("unselected");
  const institutionRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(`atlas.requirement-confirmations.${applicationId}`);
        if (saved) setConfirmedIds(JSON.parse(saved) as string[]);
        setApplicationMode(readApplicationMode());
      } catch { /* Ignore invalid prototype data and use defaults. */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [applicationId]);

  const gradeRequirement = requirements.find((item) => item.sourceId?.includes("cn-list") || item.label.includes("院校成绩"));
  const effectiveConfirmedIds = institution.complete && gradeRequirement ? [...new Set([...confirmedIds, gradeRequirement.id])] : confirmedIds;
  const pending = requirements.filter((item) => item.status === "needs_confirmation" && !effectiveConfirmedIds.includes(item.id));

  function persistConfirmations(ids: string[]) {
    setConfirmedIds(ids);
    window.localStorage.setItem(`atlas.requirement-confirmations.${applicationId}`, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent("atlas:requirements-updated", { detail: { applicationId, pending: requirements.filter((item) => item.status === "needs_confirmation" && !ids.includes(item.id)).map((item) => item.label) } }));
  }

  function syncMaterialStatus(nextStatuses: Record<string, string>) {
    const detectedMaterialCount = Object.values(nextStatuses).filter((status) => status === "prepared" || status === "confirmed").length;
    const missingMaterials = baseMaterials.filter((material) => !["prepared", "confirmed"].includes(nextStatuses[material.id] ?? material.status)).map((material) => material.name);
    const readyToApply = missingMaterials.length === 0;
    updateApplicationRecord(applicationId, {
      detectedMaterialCount,
      preparedMaterials: detectedMaterialCount,
      missingMaterials,
      applicationProgress: readyToApply ? 78 : Math.max(20, Math.round((detectedMaterialCount / Math.max(baseMaterials.length, 1)) * 70)),
      status: readyToApply ? "ready_to_apply" : "materials_in_progress",
      nextAction: readyToApply ? "核对申请信息并提交申请" : `补充 ${missingMaterials[0] ?? "申请材料"}`,
    });
  }

  function openRequirement(requirement: AdmissionRequirement) {
    if (requirement.id === gradeRequirement?.id) {
      institutionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setNotice("请依次完成下方院校、规则范围与均分口径确认。完成后状态会自动更新。");
      return;
    }
    setActiveRequirement(requirement);
  }

  function openPicker(materialId: string) { setPreviewId(materialId); fileInputRef.current?.click(); }
  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !previewId) return;
    const material = baseMaterials.find((item) => item.id === previewId);
    if (!material) return;
    setFiles((current) => ({ ...current, [previewId]: file.name }));
    setStatuses((current) => ({ ...current, [previewId]: "uploading" }));
    setNotice("");
    window.setTimeout(() => {
      const looksWrong = material.name.includes("推荐") && /(transcript|成绩单|passport|护照)/i.test(file.name);
      if (looksWrong) { setStatuses((current) => ({ ...current, [previewId]: "rejected" })); setNotice("这份文件看起来不像推荐信，请检查后重新上传。"); }
      else { setStatuses((current) => ({ ...current, [previewId]: "processing" })); window.setTimeout(() => setStatuses((current) => ({ ...current, [previewId]: "needs_confirmation" })), 650); }
    }, 450);
    event.target.value = "";
  }
  function confirmFile(material: ApplicationMaterial) { setStatuses((current) => { const next = { ...current, [material.id]: "confirmed" }; syncMaterialStatus(next); return next; }); setNotice("Atlas 已记录你的确认，材料状态、申请进度和当前事项已同步更新。"); }

  function currentRequirement(requirement: AdmissionRequirement) {
    if (requirement.id === gradeRequirement?.id && institution.complete) return {
      ...requirement,
      status: institution.result === "accepted" ? "meets" as const : institution.result === "not_found" ? "gap_detected" as const : "needs_confirmation" as const,
      userSituation: `${institution.englishName} · ${institution.average}%（成绩单官方均分）`,
    };
    if (effectiveConfirmedIds.includes(requirement.id)) {
      if (requirement.label.includes("英语")) return { ...requirement, status: "gap_detected" as const, userSituation: "IELTS Academic 6.5；写作 5.5，低于单项要求 0.5 分" };
      return { ...requirement, status: "meets" as const };
    }
    return requirement;
  }

  return <div className="space-y-6">
    <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" className="hidden" onChange={handleFile} />

    <ConfirmationActions pending={pending} onOpen={openRequirement} />
    {notice ? <div role="status" className="rounded-2xl border border-[#d8ccbe] bg-[#f7f0e8] p-4 text-sm text-[#5d5148]">{notice}</div> : null}

    <Card className="border-2 border-[#2f2924] p-5 md:p-7">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div className="min-w-0"><p className="text-xs uppercase tracking-[0.22em] text-[#9a8b7c]">学校录取要求</p><h2 className="mt-2 font-editorial text-4xl font-semibold text-[#2f2924]">{school.universityName} · {school.programName}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f6256]">Atlas 仅对照学校公开要求与现有资料，不代替学校作出录取决定。</p></div><span className="w-fit shrink-0 whitespace-nowrap rounded-full border border-[#d2dce5] bg-[#e8edf1] px-3 py-1 text-xs text-[#52687a]">公开要求对照</span></div>
      <OfficialSourceSummary knowledge={knowledge} school={school} applicationId={applicationId} applicationMode={applicationMode} />
      <div className="mt-6 overflow-hidden rounded-2xl border border-[#e8dfd3]">
        <div className="hidden grid-cols-[1fr_1.2fr_1.2fr_0.8fr] gap-4 bg-[#f7f0e8] px-4 py-3 text-xs uppercase tracking-[0.14em] text-[#9a8b7c] md:grid"><span>要求项目</span><span>学校要求</span><span>你的情况</span><span>当前状态</span></div>
        {requirements.map((base) => {
          const requirement = currentRequirement(base);
          const clickable = base.status === "needs_confirmation" && !effectiveConfirmedIds.includes(base.id);
          return <div key={base.id} onClick={clickable ? () => openRequirement(base) : undefined} onKeyDown={clickable ? (event) => { if (event.key === "Enter" || event.key === " ") openRequirement(base); } : undefined} role={clickable ? "button" : undefined} tabIndex={clickable ? 0 : undefined} className={`grid gap-3 border-t border-[#e8dfd3] px-4 py-4 md:grid-cols-[1fr_1.2fr_1.2fr_0.8fr] md:gap-4 ${clickable ? "cursor-pointer transition hover:bg-[#fdf8f1]" : ""}`}>
            <Cell label="要求项目"><p className="font-medium text-[#2f2924]">{requirement.label}</p></Cell>
            <Cell label="学校要求"><p className="text-sm leading-6 text-[#6f6256]">{requirement.schoolRequirement}</p></Cell>
            <Cell label="你的情况"><p className="text-sm leading-6 text-[#6f6256]">{requirement.userSituation}</p></Cell>
            <Cell label="当前状态">{clickable ? <button type="button" onClick={(event) => { event.stopPropagation(); openRequirement(base); }} className="rounded-full bg-[#2f2924] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#493d34]">去确认</button> : <StatusBadge status={requirement.status} />}</Cell>
          </div>;
        })}
      </div>
    </Card>

    <div ref={institutionRef} className="scroll-mt-6"><InstitutionEligibilityPanel targetUniversityId={school.id} targetUniversityName={school.universityName} programName={school.programName} intake={school.intake} onStatusChange={(value) => { setInstitution(value); if (value.complete && gradeRequirement) { persistConfirmations([...new Set([...confirmedIds, gradeRequirement.id])]); setNotice("院校核验已更新，录取要求状态和待确认事项已自动重新计算。"); } }} /></div>

    <Card><div className="flex items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.22em] text-[#9a8b7c]">材料状态</p><h2 className="mt-2 font-editorial text-3xl font-semibold text-[#2f2924]">申请材料</h2><p className="mt-2 text-sm leading-6 text-[#6f6256]">Atlas 会将已上传的通用材料自动关联到符合要求的学校。</p></div><span className="text-sm text-[#8f847a]">已确认 {Object.values(statuses).filter((status) => status === "prepared" || status === "confirmed").length} 项</span></div><div className="mt-5 grid gap-3 md:grid-cols-2">{baseMaterials.map((material) => <MaterialRow key={material.id} material={material} status={statuses[material.id] ?? material.status} fileName={files[material.id]} onUpload={() => openPicker(material.id)} onConfirm={() => confirmFile(material)} onPreview={() => setNotice(`${material.name} 当前文件：${files[material.id] ?? "Atlas 已检测到的材料"}`)} />)}</div></Card>

    {activeRequirement ? <RequirementConfirmModal requirement={activeRequirement} materialStatuses={statuses} onClose={() => setActiveRequirement(null)} onMessage={setNotice} onConfirm={async () => { await new Promise((resolve) => window.setTimeout(resolve, 650)); persistConfirmations([...new Set([...confirmedIds, activeRequirement.id])]); setActiveRequirement(null); setNotice(`${activeRequirement.label}已确认，Atlas 已重新计算录取要求状态。`); }} /> : null}
  </div>;
}

function ConfirmationActions({ pending, onOpen }: { pending: AdmissionRequirement[]; onOpen: (requirement: AdmissionRequirement) => void }) {
  if (!pending.length) return <Card className="border border-[#c9dbc5] bg-[#f0f5ef] p-5"><div className="flex gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-[#5f805f]" size={20} /><div><p className="font-medium text-[#36573c]">主要信息已确认</p><p className="mt-1 text-sm leading-6 text-[#58705b]">Atlas 已根据目前资料完成学校要求对照。</p></div></div></Card>;
  return <Card className="p-5"><div className="flex items-end justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.2em] text-[#9a8b7c]">需要你的确认</p><p className="mt-2 text-sm text-[#6f6256]">只显示尚未完成的事项，完成后会自动移除。</p></div><span className="text-xs text-[#8f847a]">{pending.length} 项待处理</span></div><div className="mt-4 flex flex-wrap gap-2">{pending.map((item) => <button key={item.id} type="button" onClick={() => onOpen(item)} className={primaryButton}>{confirmationLabel(item)}</button>)}</div></Card>;
}

function confirmationLabel(item: AdmissionRequirement) {
  if (item.label.includes("学位")) return "确认学历信息";
  if (item.label.includes("英语") || item.label.includes("语言")) return "确认语言成绩";
  if (item.label.includes("院校成绩")) return "确认中国院校与均分";
  if (item.label.includes("材料")) return "确认申请材料";
  return `确认${item.label}`;
}

function OfficialSourceSummary({ knowledge, school, applicationId, applicationMode }: { knowledge: ReturnType<typeof getAdmissionKnowledge>; school: SchoolRecommendation; applicationId: string; applicationMode: ApplicationMode }) {
  if (!knowledge) return null;
  const label = (type: string) => type === "language_page" ? "查看官方语言要求" : type === "institution_list" ? "查看中国院校认可名单" : "查看专业官方要求";
  return <div className="mt-6 rounded-2xl border border-[#e8dfd3] bg-[#f7f0e8] p-4"><div className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><p className="text-xs uppercase tracking-[0.18em] text-[#9a8b7c]">官方来源</p><p className="mt-2 text-sm text-[#4a3d34]">{knowledge.coverageStatus === "verified" ? "官方要求已核实" : "官方要求已部分核实"} · 最近核实：{knowledge.lastVerifiedAt}</p></div><div className="flex flex-wrap gap-2">{knowledge.sources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-[#d8ccbe] bg-[#fffaf3] px-3 py-2 text-xs text-[#4f6d54] transition hover:bg-white">{label(source.sourceType)}<ArrowUpRight size={13} /></a>)}{applicationMode === "DIY" ? <ApplicationEntryAction school={school} applicationId={applicationId} /> : null}</div></div></div>;
}

function ApplicationEntryAction({ school, applicationId }: { school: SchoolRecommendation; applicationId: string }) {
  const [confirming, setConfirming] = useState(false);
  const verified = school.applicationLinkStatus === "verified" && Boolean(school.applicationUrl);
  const providerLabel = school.applicationProvider === "UCAS" ? "前往 UCAS 申请" : school.applicationProvider === "Campus France" ? "前往 Campus France" : school.applicationProvider === "Mon Master" ? "前往 Mon Master" : school.applicationUrlType === "application_instruction_page" ? "前往学校官方申请" : "前往学校申请系统";
  if (!verified) return <div className="w-full"><button type="button" disabled className="rounded-full bg-[#ded5ca] px-4 py-2 text-xs text-[#8f847a]">申请入口待核验</button><p className="mt-2 text-xs text-[#8f847a]">Atlas 暂未确认该专业的正式申请入口，请先查看学校官方专业页面。</p></div>;
  if (confirming) return <div className="w-full rounded-2xl border border-[#d8ccbe] bg-[#fffaf3] p-3"><p className="text-xs leading-5 text-[#5d5148]">你即将进入学校官方申请网站。提交申请前，建议先确认 Atlas 中的材料检查结果。</p><p className="mt-1 text-[11px] text-[#8f847a]">该项目通过学校或其指定的官方申请系统提交。</p><div className="mt-3 flex flex-wrap gap-2"><a href={school.applicationUrl} target="_blank" rel="noopener noreferrer" onClick={() => window.localStorage.setItem(`atlas.application.portal-opened.${applicationId}`, JSON.stringify({ applicationPortalOpened: true, openedAt: new Date().toISOString(), applicationSubmitted: false }))} className="inline-flex items-center gap-1 rounded-full bg-[#2f2924] px-4 py-2 text-xs font-medium text-white">继续前往<ArrowUpRight size={13} /></a><button type="button" onClick={() => setConfirming(false)} className="rounded-full border border-[#d8ccbe] px-4 py-2 text-xs text-[#4a3d34]">返回检查材料</button></div></div>;
  return <button type="button" onClick={() => setConfirming(true)} className="inline-flex items-center gap-1.5 rounded-full bg-[#2f2924] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#493d34]">{providerLabel}<ArrowUpRight size={13} /></button>;
}

function RequirementConfirmModal({ requirement, materialStatuses, onClose, onConfirm, onMessage }: { requirement: AdmissionRequirement; materialStatuses: Record<string, string>; onClose: () => void; onConfirm: () => Promise<void>; onMessage: (message: string) => void }) {
  const [state, setState] = useState<VerificationState>("idle");
  const [editMode, setEditMode] = useState(false);
  const [excluded, setExcluded] = useState(false);
  async function confirm() { setState("loading"); try { await onConfirm(); setState("success"); } catch { setState("error"); } }
  const isDegree = requirement.label.includes("学位");
  const isLanguage = requirement.label.includes("英语") || requirement.label.includes("语言");
  const isDocuments = requirement.label.includes("材料");
  const title = isDegree ? "确认学历信息" : isLanguage ? "确认语言成绩" : isDocuments ? "确认申请材料" : `确认${requirement.label}`;
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#2f2924]/25 p-4 md:items-center"><div role="dialog" aria-modal="true" aria-label={title} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[24px] bg-[#fffaf3] p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.2em] text-[#9a8b7c]">要求确认</p><h2 className="mt-2 font-editorial text-3xl font-semibold text-[#2f2924]">{title}</h2></div><button type="button" onClick={onClose} disabled={state === "loading"} aria-label="关闭" className="grid h-9 w-9 place-items-center rounded-full border border-[#d8ccbe] text-[#6f6256]"><X size={16} /></button></div>
    <div className="mt-5 space-y-4">
      {isDegree ? <DegreeDetails editable={editMode} /> : null}
      {isLanguage ? <LanguageDetails editable={editMode} excluded={excluded} /> : null}
      {isDocuments ? <MaterialChecklist materialStatuses={materialStatuses} /> : null}
      {!isDegree && !isLanguage && !isDocuments ? <div className="space-y-3 text-sm leading-6 text-[#4a3d34]"><p className="rounded-2xl bg-[#f7f0e8] p-4"><strong>学校要求：</strong>{requirement.schoolRequirement}</p><p className="rounded-2xl bg-[#f7f0e8] p-4"><strong>Atlas 已识别：</strong>{requirement.userSituation}</p></div> : null}
      {state === "error" ? <p className="text-sm text-[#9a574d]">暂时无法更新信息，请重新尝试。</p> : null}
      {state === "success" ? <p className="text-sm text-[#4f6d54]">信息已确认，录取要求状态已更新。</p> : null}
      {editMode ? <p className="rounded-xl bg-[#fbf2df] p-3 text-sm text-[#7b6541]">已进入修改模式。调整信息后，点击下方按钮保存并重新计算。</p> : null}
      <button type="button" onClick={confirm} disabled={state !== "idle" || excluded} className={`${greenButton} w-full`}>{state === "loading" ? <><LoaderCircle size={16} className="animate-spin" />正在重新计算……</> : state === "success" ? <><Check size={16} />状态已更新</> : editMode ? "保存并重新计算" : isLanguage ? "确认成绩信息" : "确认信息正确"}</button>
      <button type="button" onClick={() => setEditMode((value) => !value)} disabled={state === "loading"} className={`${secondaryButton} w-full`}>{editMode ? "取消修改" : isDegree ? "修改教育经历" : isLanguage ? "修改成绩" : "修改信息"}</button>
      {(isDegree || isLanguage) ? <button type="button" onClick={() => onMessage(isDegree ? "请选择新的学位或毕业证明文件。" : "请选择新的语言成绩单文件。") } className={`${secondaryButton} w-full`}><Upload size={15} />上传或替换{isDegree ? "证明" : "成绩单"}</button> : null}
      {isLanguage ? <button type="button" onClick={() => { setExcluded(true); onMessage("该语言成绩已标记为暂不向学校提交，Atlas 已更新材料状态。"); }} className="w-full text-center text-sm text-[#7b6e62] underline underline-offset-4">暂不向学校提交该成绩</button> : null}
      <button type="button" className="w-full text-center text-xs text-[#7b6e62] underline underline-offset-4">仍无法确认？提交人工审核</button>
    </div>
  </div></div>;
}

function DegreeDetails({ editable }: { editable: boolean }) {
  const rows = [["本科院校", "Shenzhen University"], ["学位名称", "Bachelor of Management"], ["学历层级", "本科"], ["专业", "市场营销"], ["毕业状态", "预计毕业"], ["毕业时间", "2027年6月"], ["学位证明", "已检测到"], ["毕业证明", "已检测到"]];
  return <div className="grid gap-3 rounded-2xl bg-[#f7f0e8] p-4 sm:grid-cols-2">{rows.map(([label, value]) => <label key={label} className="text-sm"><span className="block text-xs text-[#8f847a]">{label}</span>{editable ? <input defaultValue={value} className="quiet-input mt-1 rounded-lg" /> : <span className="mt-1 block text-[#3f352e]">{value}</span>}</label>)}</div>;
}

function LanguageDetails({ editable, excluded }: { editable: boolean; excluded: boolean }) {
  const rows = [["考试类型", "IELTS Academic"], ["总分", "6.5"], ["听力", "6.5"], ["阅读", "7.0"], ["写作", "5.5"], ["口语", "6.5"], ["考试日期", "2026年3月18日"]];
  return <><div className="grid gap-3 rounded-2xl bg-[#f7f0e8] p-4 sm:grid-cols-2">{rows.map(([label, value]) => <label key={label} className="text-sm"><span className="block text-xs text-[#8f847a]">{label}</span>{editable ? <input defaultValue={value} className="quiet-input mt-1 rounded-lg" /> : <span className="mt-1 block text-[#3f352e]">{value}</span>}</label>)}</div><div className="rounded-2xl border border-[#e8dfd3] p-4 text-sm"><p><strong>学校要求：</strong>IELTS 总分 6.5，单项不低于 6.0</p><p className="mt-2 font-medium text-[#9a574d]">尚未达标：写作低于要求 0.5 分</p>{excluded ? <p className="mt-2 text-[#6f6256]">已标记为暂不提交。</p> : null}</div></>;
}

function MaterialChecklist({ materialStatuses }: { materialStatuses: Record<string, string> }) {
  const rows = [["成绩单", "已确认"], ["学历证明", "已确认"], ["CV", "已确认"], ["个人陈述", "未检测到"], ["推荐人", "已检测到 1/2"], ["英语成绩", "已上传但尚未完全达标"]];
  return <div className="divide-y divide-[#e8dfd3] rounded-2xl border border-[#e8dfd3] px-4">{rows.map(([name, status]) => <div key={name} className="flex items-center justify-between gap-4 py-3 text-sm"><span className="text-[#3f352e]">{name}</span><span className={status === "已确认" ? "text-[#4f6d54]" : "text-[#8a5f54]"}>{status}</span></div>)}<span className="hidden">{Object.keys(materialStatuses).length}</span></div>;
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) { return <div><p className="text-xs text-[#9a8b7c] md:hidden">{label}</p>{children}</div>; }
function StatusBadge({ status }: { status: RequirementStatus }) { return <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${status === "meets" || status === "mostly_meets" ? "border-[#c9dbc5] bg-[#e7ece7] text-[#4f6d54]" : status === "gap_detected" ? "border-[#e7d0c7] bg-[#f6e7df] text-[#8a5f54]" : "border-[#d8ccbe] bg-[#f7f0e8] text-[#6f6256]"}`}>{requirementLabels[status]}</span>; }

function MaterialRow({ material, status, fileName, onUpload, onConfirm, onPreview }: { material: ApplicationMaterial; status: string; fileName?: string; onUpload: () => void; onConfirm: () => void; onPreview: () => void }) {
  const confirmed = status === "prepared" || status === "confirmed"; const waiting = status === "uploading" || status === "processing"; const rejected = status === "rejected";
  return <div className={`rounded-2xl border p-4 ${confirmed ? "border-[#c9dbc5] bg-[#e7ece7]" : rejected ? "border-[#e7d0c7] bg-[#f6e7df]" : "border-[#e8dfd3] bg-[#fffaf3]"}`}><div className="flex items-start justify-between gap-3"><div className="flex gap-3">{confirmed ? <CheckCircle2 className="mt-0.5 shrink-0 text-[#5f805f]" size={19} /> : <CircleAlert className="mt-0.5 shrink-0 text-[#9a6257]" size={19} />}<div><p className="font-medium text-[#2f2924]">{material.name}</p><p className={`mt-1 text-xs ${confirmed ? "text-[#4f6d54]" : rejected ? "text-[#8a5f54]" : "text-[#6f6256]"}`}>{materialLabels[status] ?? "未检测到"}</p></div></div>{material.reusableFor.includes("all") ? <span className="text-xs text-[#6f6256]">可复用</span> : null}</div><p className="mt-3 text-sm leading-6 text-[#6f6256]">{material.note}</p>{fileName ? <p className="mt-2 truncate text-xs text-[#8f847a]">文件：{fileName}</p> : null}<div className="mt-3 flex flex-wrap gap-2">{confirmed ? <><button type="button" onClick={onPreview} className="inline-flex items-center gap-2 text-xs text-[#4f6d54] underline underline-offset-4"><Copy size={14} />预览材料</button><button type="button" onClick={onUpload} className="inline-flex items-center gap-2 text-xs text-[#6f6256] underline underline-offset-4"><Upload size={14} />替换材料</button></> : waiting ? <button type="button" disabled className="rounded-full bg-[#e8dfd3] px-4 py-2 text-xs text-[#8f847a]">{materialLabels[status]}……</button> : status === "needs_confirmation" ? <button type="button" onClick={onConfirm} className="rounded-full bg-[#5f805f] px-4 py-2 text-xs font-medium text-white">确认材料</button> : <button type="button" onClick={onUpload} className="inline-flex items-center gap-2 rounded-full border border-[#d8ccbe] bg-[#f7f0e8] px-4 py-2 text-xs font-medium text-[#4a3d34]"><FileUp size={14} />{rejected ? "重新上传" : "上传材料"}</button>}</div></div>;
}
