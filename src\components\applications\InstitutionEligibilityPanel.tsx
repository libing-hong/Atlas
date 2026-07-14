"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, ChevronRight, LoaderCircle, Pencil, Upload, X } from "lucide-react";
import { Card } from "@/components/Card";

export type InstitutionVerification = {
  complete: boolean;
  institutionName: string;
  englishName: string;
  average: number;
  result?: "accepted" | "not_found" | "needs_confirmation";
};

type Step = "name" | "scope" | "average";
type InstitutionForm = {
  chineseName: string;
  englishName: string;
  aliases: string;
  city: string;
  campus: string;
  institutionType: string;
  degreeAwardingInstitution: string;
};

const greenButton = "inline-flex items-center justify-center gap-2 rounded-full bg-[#5f805f] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#6f906f] disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButton = "inline-flex items-center justify-center gap-2 rounded-full border border-[#d8ccbe] px-5 py-3 text-sm text-[#4a3d34] transition hover:bg-[#f7f0e8] disabled:cursor-not-allowed disabled:opacity-60";

export function InstitutionEligibilityPanel({
  targetUniversityId,
  targetUniversityName = "University of Leeds",
  institutionName = "Shenzhen University",
  average = 78,
  programName = "MSc International Marketing",
  intake = "2027 秋季",
  onStatusChange,
}: {
  targetUniversityId: string;
  targetUniversityName?: string;
  institutionName?: string;
  average?: number;
  programName?: string;
  intake?: string;
  onStatusChange?: (status: InstitutionVerification) => void;
}) {
  const [activeStep, setActiveStep] = useState<Step | null>(null);
  const [editing, setEditing] = useState(false);
  const [completed, setCompleted] = useState<Record<Step, boolean>>({ name: false, scope: false, average: false });
  const [selectedAverage, setSelectedAverage] = useState(average);
  const [averageMethod, setAverageMethod] = useState("成绩单官方均分");
  const [form, setForm] = useState<InstitutionForm>({
    chineseName: "深圳大学",
    englishName: institutionName,
    aliases: "",
    city: "深圳",
    campus: "",
    institutionType: "普通本科",
    degreeAwardingInstitution: institutionName,
  });
  const [actionState, setActionState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const allComplete = Object.values(completed).every(Boolean);
  const pendingCount = Object.values(completed).filter((value) => !value).length;
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(`atlas.institution-verification.${targetUniversityId}`);
        if (!saved) return;
        const value = JSON.parse(saved) as { completed?: Record<Step, boolean>; form?: InstitutionForm; average?: number; averageMethod?: string };
        const nextCompleted = value.completed ?? completed;
        const nextForm = value.form ?? form;
        const nextAverage = value.average ?? selectedAverage;
        setCompleted(nextCompleted);
        setForm(nextForm);
        setSelectedAverage(nextAverage);
        setAverageMethod(value.averageMethod ?? averageMethod);
        notify(nextCompleted, nextForm, nextAverage);
      } catch { /* Ignore invalid prototype data and use defaults. */ }
    }, 0);
    return () => window.clearTimeout(timer);
  // Load once for the selected target school.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUniversityId]);

  function persist(nextCompleted: Record<Step, boolean>, nextForm = form, nextAverage = selectedAverage, nextMethod = averageMethod) {
    const complete = Object.values(nextCompleted).every(Boolean);
    window.localStorage.setItem(`atlas.institution-verification.${targetUniversityId}`, JSON.stringify({ completed: nextCompleted, form: nextForm, average: nextAverage, averageMethod: nextMethod, result: complete ? "accepted" : undefined }));
  }

  function notify(nextCompleted = completed, nextForm = form, nextAverage = selectedAverage) {
    const complete = Object.values(nextCompleted).every(Boolean);
    onStatusChange?.({
      complete,
      institutionName: nextForm.chineseName,
      englishName: nextForm.englishName,
      average: nextAverage,
      result: complete ? "accepted" : undefined,
    });
  }

  async function completeStep(step: Step) {
    setActionState("loading");
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      const next = { ...completed, [step]: true };
      setCompleted(next);
      persist(next);
      setActionState("success");
      notify(next);
      window.setTimeout(() => { setActiveStep(null); setActionState("idle"); }, 450);
    } catch {
      setActionState("error");
    }
  }

  async function saveInstitution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.chineseName.trim() || !form.englishName.trim() || !form.degreeAwardingInstitution.trim()) return;
    setActionState("loading");
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 650));
      const next = { ...completed, name: true };
      setCompleted(next);
      persist(next, form);
      setActionState("success");
      notify(next, form);
      window.setTimeout(() => { setEditing(false); setActiveStep(null); setActionState("idle"); }, 500);
    } catch {
      setActionState("error");
    }
  }

  return <>
    <Card className="p-5 md:p-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#9a8b7c]">中国本科院校核验</p>
          <h3 className="mt-2 font-editorial text-3xl font-semibold text-[#2f2924]">核对院校、规则与均分</h3>
        </div>
        <span className={`w-fit rounded-full border px-3 py-1 text-xs ${allComplete ? "border-[#c9dbc5] bg-[#e7ece7] text-[#4f6d54]" : "border-[#e5cfaa] bg-[#fbf2df] text-[#7b6541]"}`}>
          {allComplete ? "核验完成" : `待完成 ${pendingCount} 项确认`}
        </span>
      </div>

      <dl className="mt-5 grid gap-x-8 gap-y-3 rounded-2xl bg-[#f7f0e8] p-4 text-sm md:grid-cols-2">
        <Summary label="目标学校" value={targetUniversityName} />
        <Summary label="目标学院" value="Leeds University Business School" />
        <Summary label="目标专业" value={programName} />
        <Summary label="你的本科院校" value={form.englishName} />
      </dl>

      <div className="mt-5 space-y-3">
        <VerificationStep number="1" title="确认本科院校" status={completed.name} onClick={() => setActiveStep("name")}>
          <p>中文名称：{form.chineseName}</p><p>英文名称：{form.englishName}</p><p>学历颁发院校：{form.degreeAwardingInstitution}</p>
        </VerificationStep>
        <VerificationStep number="2" title="确认学院与专业" status={completed.scope} onClick={() => setActiveStep("scope")}>
          <p>当前规则：Leeds University Business School 中国申请规则</p><p>适用专业：{programName}</p><p>入学时间：{intake}</p>
        </VerificationStep>
        <VerificationStep number="3" title="确认本科平均成绩" status={completed.average} onClick={() => setActiveStep("average")}>
          <p>成绩单官方均分：78%</p><p>算术平均分：77.6%</p><p>加权平均分：78.3%</p><p>当前采用：{averageMethod}</p>
        </VerificationStep>
      </div>

      <div className={`mt-4 rounded-2xl border p-5 ${allComplete ? "border-[#c9dbc5] bg-[#f0f5ef]" : "border-[#e8dfd3] bg-[#fffaf3]"}`}>
        <div className="flex items-center justify-between gap-3"><h4 className="font-semibold text-[#2f2924]">4. 核验结果</h4><span className="text-xs text-[#8f847a]">{allComplete ? "已自动更新" : "完成前三项后自动运行"}</span></div>
        {allComplete ? <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <Result label="本科院校" value="已在接受范围内找到" />
          <Result label="你的确认均分" value={`${selectedAverage}%`} />
          <div className="sm:col-span-2"><Result label="当前结果" value="已达到当前公开成绩标准" positive /></div>
          <div className="sm:col-span-2"><a href="https://business.leeds.ac.uk/masters/doc/accepted-chinese-institutions" target="_blank" rel="noreferrer" className={secondaryButton}>查看学校官方名单</a></div>
        </div> : <p className="mt-3 text-sm leading-6 text-[#6f6256]">确认院校名称、规则适用范围和均分口径后，Atlas 会重新核对当前公开成绩标准。</p>}
      </div>
    </Card>

    {activeStep ? <StepModal
      step={activeStep}
      actionState={actionState}
      form={form}
      programName={programName}
      intake={intake}
      averageMethod={averageMethod}
      onAverageMethod={(method, value) => { setAverageMethod(method); setSelectedAverage(value); persist(completed, form, value, method); }}
      onClose={() => { if (actionState !== "loading") { setActiveStep(null); setEditing(false); setActionState("idle"); } }}
      onConfirm={() => completeStep(activeStep)}
      onEdit={() => setEditing(true)}
      editing={editing}
      onFormChange={setForm}
      onSave={saveInstitution}
    /> : null}
  </>;
}

function Summary({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-[#8f847a]">{label}</dt><dd className="mt-1 text-[#3f352e]">{value}</dd></div>; }
function Result({ label, value, positive }: { label: string; value: string; positive?: boolean }) { return <div><p className="text-xs text-[#8f847a]">{label}</p><p className={`mt-1 font-medium ${positive ? "text-[#4f6d54]" : "text-[#2f2924]"}`}>{value}</p></div>; }

function VerificationStep({ number, title, status, children, onClick }: { number: string; title: string; status: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="group flex w-full items-start gap-4 rounded-2xl border border-[#e8dfd3] bg-[#fffaf3] p-4 text-left transition hover:border-[#cdbfae] hover:bg-[#fdf8f1]">
    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm ${status ? "bg-[#dfeade] text-[#4f6d54]" : "bg-[#f1e8dc] text-[#6f6256]"}`}>{status ? <Check size={16} /> : number}</span>
    <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-3"><strong className="text-[#2f2924]">{title}</strong><span className={`text-xs ${status ? "text-[#4f6d54]" : "text-[#8a6b42]"}`}>{status ? "已确认" : "待确认"}</span></span><span className="mt-2 block space-y-1 text-sm leading-6 text-[#6f6256]">{children}</span></span>
    <ChevronRight size={18} className="mt-1 shrink-0 text-[#9a8b7c] transition group-hover:translate-x-0.5" />
  </button>;
}

function StepModal({ step, actionState, form, programName, intake, averageMethod, onAverageMethod, onClose, onConfirm, onEdit, editing, onFormChange, onSave }: {
  step: Step; actionState: "idle" | "loading" | "success" | "error"; form: InstitutionForm; programName: string; intake: string; averageMethod: string;
  onAverageMethod: (method: string, value: number) => void; onClose: () => void; onConfirm: () => void; onEdit: () => void; editing: boolean; onFormChange: (form: InstitutionForm) => void; onSave: (event: FormEvent<HTMLFormElement>) => void;
}) {
  if (editing) return <InstitutionEditModal form={form} actionState={actionState} onChange={onFormChange} onClose={onClose} onSave={onSave} />;
  const title = step === "name" ? "确认本科院校" : step === "scope" ? "确认学院与专业" : "确认本科平均成绩";
  const primaryLabel = step === "name" ? "确认信息正确" : step === "scope" ? "确认适用范围" : "确认使用该均分";
  return <ModalShell title={title} onClose={onClose} disabled={actionState === "loading"}>
    {step === "name" ? <div className="rounded-2xl bg-[#f7f0e8] p-4 text-sm leading-7 text-[#4a3d34]"><p>中文名称：{form.chineseName}</p><p>英文名称：{form.englishName}</p><p>学历颁发院校：{form.degreeAwardingInstitution}</p></div> : null}
    {step === "scope" ? <div className="rounded-2xl bg-[#f7f0e8] p-4 text-sm leading-7 text-[#4a3d34]"><p>当前使用规则：Leeds University Business School 中国申请规则</p><p>适用专业：{programName}</p><p>入学时间：{intake}</p></div> : null}
    {step === "average" ? <div className="space-y-2">{[["成绩单官方均分", 78], ["算术平均分", 77.6], ["加权平均分", 78.3]].map(([method, value]) => <button key={method} type="button" onClick={() => onAverageMethod(String(method), Number(value))} className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-sm ${averageMethod === method ? "border-[#7f9b7d] bg-[#eef4ed]" : "border-[#d8ccbe]"}`}><span>{method}</span><strong>{value}%</strong></button>)}</div> : null}
    {actionState === "error" ? <p className="mt-3 text-sm text-[#9a574d]">暂时无法更新信息，请重新尝试。</p> : null}
    {actionState === "success" ? <p className="mt-3 text-sm text-[#4f6d54]">信息已确认，录取要求正在更新。</p> : null}
    <button type="button" onClick={onConfirm} disabled={actionState !== "idle"} className={`${greenButton} mt-5 w-full`}>{actionState === "loading" ? <><LoaderCircle size={16} className="animate-spin" />正在重新核验……</> : actionState === "success" ? <><Check size={16} />核验已更新</> : primaryLabel}</button>
    <button type="button" onClick={onEdit} disabled={actionState === "loading"} className={`${secondaryButton} mt-3 w-full`}><Pencil size={15} />{step === "scope" ? "修改目标学院或专业" : step === "average" ? "修改均分或计算方式" : "修改院校信息"}</button>
    {step === "average" ? <button type="button" className={`${secondaryButton} mt-3 w-full`}><Upload size={15} />上传成绩单</button> : null}
    <button type="button" className="mt-4 w-full text-center text-xs text-[#7b6e62] underline underline-offset-4">仍然无法确认？提交人工审核</button>
  </ModalShell>;
}

function InstitutionEditModal({ form, actionState, onChange, onClose, onSave }: { form: InstitutionForm; actionState: "idle" | "loading" | "success" | "error"; onChange: (form: InstitutionForm) => void; onClose: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }) {
  const field = (key: keyof InstitutionForm, value: string) => onChange({ ...form, [key]: value });
  return <ModalShell title="修改本科院校信息" onClose={onClose} disabled={actionState === "loading"}>
    <form onSubmit={onSave} className="space-y-4">
      <label className="block text-sm text-[#4a3d34]">搜索标准院校库<input className="quiet-input mt-2 rounded-xl" placeholder="搜索学校中文名称或英文名称" /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <EditField label="学校中文名称" value={form.chineseName} onChange={(value) => field("chineseName", value)} />
        <EditField label="学校英文名称" value={form.englishName} onChange={(value) => field("englishName", value)} />
        <EditField label="历史名称或别名（可选）" value={form.aliases} onChange={(value) => field("aliases", value)} />
        <EditField label="所在城市" value={form.city} onChange={(value) => field("city", value)} />
        <EditField label="校区（可选）" value={form.campus} onChange={(value) => field("campus", value)} />
        <label className="block text-sm text-[#4a3d34]">院校类型<select value={form.institutionType} onChange={(event) => field("institutionType", event.target.value)} className="quiet-input mt-2 rounded-xl"><option>普通本科</option><option>独立学院</option><option>中外合作办学</option><option>其他</option></select></label>
        <div className="sm:col-span-2"><EditField label="实际学历颁发学校" value={form.degreeAwardingInstitution} onChange={(value) => field("degreeAwardingInstitution", value)} /></div>
      </div>
      {actionState === "error" ? <p className="text-sm text-[#9a574d]">暂时无法更新院校信息，请重新尝试。</p> : null}
      {actionState === "success" ? <p className="text-sm text-[#4f6d54]">院校信息已保存，核验已更新。</p> : null}
      <div className="flex flex-col-reverse gap-3 sm:flex-row"><button type="button" onClick={onClose} disabled={actionState === "loading"} className={`${secondaryButton} flex-1`}>取消</button><button type="submit" disabled={actionState !== "idle" || !form.chineseName || !form.englishName || !form.degreeAwardingInstitution} className={`${greenButton} flex-1`}>{actionState === "loading" ? <><LoaderCircle size={16} className="animate-spin" />正在重新核验……</> : actionState === "success" ? "核验已更新" : "保存并重新核验"}</button></div>
      <p className="text-center text-xs text-[#7b6e62]">仍然无法找到正确院校？ <button type="button" className="underline underline-offset-4">提交人工审核</button></p>
    </form>
  </ModalShell>;
}

function EditField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block text-sm text-[#4a3d34]">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="quiet-input mt-2 rounded-xl" /></label>; }
function ModalShell({ title, children, onClose, disabled }: { title: string; children: React.ReactNode; onClose: () => void; disabled: boolean }) { return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#2f2924]/25 p-4 md:items-center"><div role="dialog" aria-modal="true" aria-label={title} className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[24px] bg-[#fffaf3] p-6 shadow-2xl"><div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.2em] text-[#9a8b7c]">院校核验</p><h2 className="mt-2 font-editorial text-3xl font-semibold text-[#2f2924]">{title}</h2></div><button type="button" onClick={onClose} disabled={disabled} aria-label="关闭" className="grid h-9 w-9 place-items-center rounded-full border border-[#d8ccbe] text-[#6f6256] disabled:opacity-50"><X size={16} /></button></div>{children}</div></div>; }
