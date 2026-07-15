"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle, RotateCcw } from "lucide-react";
import { BackHome } from "@/components/PageShell";
import { clearPrototypePlanningData, createPlanningRun, readPlanningRun, resetDerivedPlanningState } from "@/lib/planning-store";
import { StudentProfile, validateStudentProfile, writeStudentProfile } from "@/lib/student-profile";

type PlannerForm = {
  name: string; institutionNameZh: string; institutionNameEn: string; currentMajor: string;
  score: string; gradingSystem: string; languageType: string; languageOverall: string;
  listening: string; reading: string; writing: string; speaking: string; experience: string;
  graduationYear: string; graduationMonth: string; targetCountries: string; targetSubjects: string;
  intakeYear: string; intakeTerm: "spring" | "summer" | "fall"; budgetMin: string; budgetMax: string;
  acceptsCrossDiscipline: boolean; acceptsLanguageCourse: boolean; acceptsPreMaster: boolean;
};

function splitList(value: string) {
  return value.split(/[、,，/]/).map((item) => item.trim()).filter(Boolean);
}
function optionalNumber(value: string) {
  const parsed = Number(value);
  return value.trim() && Number.isFinite(parsed) ? parsed : undefined;
}

export default function PlannerPage() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: 8 }, (_, index) => currentYear - 2 + index), [currentYear]);
  const [form, setForm] = useState<PlannerForm>({
    name: "", institutionNameZh: "", institutionNameEn: "", currentMajor: "", score: "", gradingSystem: "百分制",
    languageType: "none", languageOverall: "", listening: "", reading: "", writing: "", speaking: "", experience: "",
    graduationYear: String(currentYear), graduationMonth: "6", targetCountries: "", targetSubjects: "",
    intakeYear: String(currentYear + 1), intakeTerm: "fall", budgetMin: "", budgetMax: "",
    acceptsCrossDiscipline: false, acceptsLanguageCourse: true, acceptsPreMaster: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const showTestReset = process.env.NEXT_PUBLIC_ATLAS_PROTOTYPE !== "false";

  function setValue<K extends keyof PlannerForm>(key: K, value: PlannerForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  function buildStudentProfileFromForm(): StudentProfile {
    const score = optionalNumber(form.score);
    const languageOverall = optionalNumber(form.languageOverall);
    return {
      name: form.name.trim(),
      degreeLevel: "本科",
      institutionNameZh: form.institutionNameZh.trim(),
      institutionNameEn: form.institutionNameEn.trim(),
      institutionCountry: "中国",
      graduationDate: { year: Number(form.graduationYear), month: Number(form.graduationMonth) },
      currentMajor: form.currentMajor.trim(),
      averageScore: form.gradingSystem === "百分制" ? score : undefined,
      gpa: form.gradingSystem !== "百分制" ? score : undefined,
      gradingSystem: form.gradingSystem,
      languageTests: form.languageType === "none" ? [] : [{
        type: form.languageType as "IELTS Academic" | "TOEFL iBT" | "PTE Academic" | "other",
        overall: languageOverall,
        listening: optionalNumber(form.listening),
        reading: optionalNumber(form.reading),
        writing: optionalNumber(form.writing),
        speaking: optionalNumber(form.speaking),
      }],
      workExperiences: form.experience.trim() ? [{ role: "工作或实习经历", description: form.experience.trim() }] : [],
      internships: [],
      targetCountries: splitList(form.targetCountries),
      targetSubjects: splitList(form.targetSubjects),
      targetIntake: { year: Number(form.intakeYear), term: form.intakeTerm },
      budgetMin: optionalNumber(form.budgetMin),
      budgetMax: optionalNumber(form.budgetMax),
      preferredCities: [],
      acceptsCrossDiscipline: form.acceptsCrossDiscipline,
      acceptsLanguageCourse: form.acceptsLanguageCourse,
      acceptsPreMaster: form.acceptsPreMaster,
    };
  }
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError("");
    try {
      const profile = validateStudentProfile(buildStudentProfileFromForm());
      writeStudentProfile(profile);
      const run = createPlanningRun(profile);
      resetDerivedPlanningState(run.id);
      if (!readPlanningRun(run.id)) throw new Error("你的规划资料暂时无法保存，请重新尝试。");
      router.push(`/result?runId=${encodeURIComponent(run.id)}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "你的规划资料暂时无法保存，请重新尝试。");
      setSaving(false);
    }
  }
  function clearAndRestart() {
    clearPrototypePlanningData();
    setResetOpen(false);
    window.location.assign("/planner");
  }

  return <main className="atlas-shell py-8"><BackHome /><section className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]"><div className="pt-4"><p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">Free planner</p><h1 className="mt-3 font-editorial text-6xl font-semibold leading-none">先看清方向，再投入申请</h1><p className="mt-6 leading-8 text-[#6f6256]">填写当前真实背景后，Atlas 会为本次规划单独生成报告、学校推荐和申请状态。</p>{showTestReset ? <button type="button" onClick={() => setResetOpen(true)} className="mt-6 inline-flex items-center gap-2 text-sm text-[#7f594d] underline underline-offset-4"><RotateCcw size={15} />开始新的测试用户</button> : null}</div>
    <form className="soft-card rounded-[24px] p-6" onSubmit={handleSubmit}>
      <Section title="学生背景"><div className="grid gap-4 md:grid-cols-2"><Field label="姓名" value={form.name} onChange={(value) => setValue("name", value)} /><Field label="当前本科院校中文名" value={form.institutionNameZh} onChange={(value) => setValue("institutionNameZh", value)} /><Field label="当前本科院校英文名" value={form.institutionNameEn} onChange={(value) => setValue("institutionNameEn", value)} /><Field label="本科专业" value={form.currentMajor} onChange={(value) => setValue("currentMajor", value)} /><Field label="GPA／平均分" type="number" value={form.score} onChange={(value) => setValue("score", value)} /><SelectField label="评分体系" value={form.gradingSystem} onChange={(value) => setValue("gradingSystem", value)} options={["百分制", "4.0 GPA", "5.0 GPA", "其他"]} /></div></Section>
      <Section title="语言成绩"><div className="grid gap-4 md:grid-cols-3"><SelectField label="语言考试类型" value={form.languageType} onChange={(value) => setValue("languageType", value)} options={["none|暂无语言成绩", "IELTS Academic", "TOEFL iBT", "PTE Academic", "other|其他"]} /><Field label="语言总分" type="number" value={form.languageOverall} onChange={(value) => setValue("languageOverall", value)} disabled={form.languageType === "none"} /><Field label="听力" type="number" value={form.listening} onChange={(value) => setValue("listening", value)} disabled={form.languageType === "none"} /><Field label="阅读" type="number" value={form.reading} onChange={(value) => setValue("reading", value)} disabled={form.languageType === "none"} /><Field label="写作" type="number" value={form.writing} onChange={(value) => setValue("writing", value)} disabled={form.languageType === "none"} /><Field label="口语" type="number" value={form.speaking} onChange={(value) => setValue("speaking", value)} disabled={form.languageType === "none"} /></div></Section>
      <Section title="经历与时间"><label className="block"><span className="mb-2 block text-sm text-[#5d5148]">实习和工作经历</span><textarea className="quiet-input min-h-28 rounded-2xl" value={form.experience} onChange={(event) => setValue("experience", event.target.value)} placeholder="请简要填写岗位、行业、时间和主要工作" /></label><div className="mt-4 grid gap-4 md:grid-cols-2"><SelectField label="毕业年份" value={form.graduationYear} onChange={(value) => setValue("graduationYear", value)} options={years.map(String)} /><SelectField label="毕业月份" value={form.graduationMonth} onChange={(value) => setValue("graduationMonth", value)} options={Array.from({ length: 12 }, (_, index) => String(index + 1))} /></div></Section>
      <Section title="申请目标"><div className="grid gap-4 md:grid-cols-2"><Field label="目标国家" value={form.targetCountries} onChange={(value) => setValue("targetCountries", value)} placeholder="英国、法国" /><Field label="目标专业" value={form.targetSubjects} onChange={(value) => setValue("targetSubjects", value)} placeholder="市场营销、国际商务" /><SelectField label="目标入学年份" value={form.intakeYear} onChange={(value) => setValue("intakeYear", value)} options={years.slice(2).map(String)} /><SelectField label="目标入学学期" value={form.intakeTerm} onChange={(value) => setValue("intakeTerm", value as PlannerForm["intakeTerm"])} options={["spring|春季", "summer|夏季", "fall|秋季"]} /><Field label="学费预算下限" type="number" value={form.budgetMin} onChange={(value) => setValue("budgetMin", value)} placeholder="20000" /><Field label="学费预算上限" type="number" value={form.budgetMax} onChange={(value) => setValue("budgetMax", value)} placeholder="35000" /></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><CheckField label="接受跨专业" checked={form.acceptsCrossDiscipline} onChange={(value) => setValue("acceptsCrossDiscipline", value)} /><CheckField label="接受语言班" checked={form.acceptsLanguageCourse} onChange={(value) => setValue("acceptsLanguageCourse", value)} /><CheckField label="接受预科" checked={form.acceptsPreMaster} onChange={(value) => setValue("acceptsPreMaster", value)} /></div></Section>
      {error ? <p role="alert" className="mt-5 rounded-2xl border border-[#e7d0c7] bg-[#f6e7df] p-4 text-sm text-[#8a5f54]">{error}</p> : null}
      <button type="submit" disabled={saving} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2f2924] px-6 py-4 text-sm font-medium text-[#fffaf3] disabled:opacity-55">{saving ? <><LoaderCircle size={17} className="animate-spin" />正在保存并生成分析……</> : <>生成免费完整分析 <ArrowRight size={17} /></>}</button>
    </form></section>
    {resetOpen ? <div className="fixed inset-0 z-50 grid place-items-center bg-[#2f2924]/25 p-4"><div className="w-full max-w-md rounded-[24px] bg-[#fffaf3] p-6 shadow-2xl"><h2 className="font-editorial text-3xl font-semibold text-[#2f2924]">开始新的测试用户</h2><p className="mt-3 text-sm leading-6 text-[#6f6256]">这会清除当前浏览器中的测试规划、学校选择和未完成申请记录，不影响 GitHub 代码。已支付订单和已正式递交申请会保留。</p><div className="mt-6 flex gap-3"><button type="button" onClick={() => setResetOpen(false)} className="flex-1 rounded-full border border-[#d8ccbe] px-5 py-3 text-sm">取消</button><button type="button" onClick={clearAndRestart} className="flex-1 rounded-full bg-[#2f2924] px-5 py-3 text-sm text-white">清除并重新测试</button></div></div></div> : null}
  </main>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <fieldset className="mb-7 border-b border-[#e8dfd3] pb-7 last:mb-0 last:border-0 last:pb-0"><legend className="mb-4 text-lg font-semibold text-[#2f2924]">{title}</legend>{children}</fieldset>; }
function Field({ label, value, onChange, type = "text", placeholder, disabled }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; disabled?: boolean }) { return <label className="block"><span className="mb-2 block text-sm text-[#5d5148]">{label}</span><input className="quiet-input rounded-2xl disabled:opacity-45" type={type} step="any" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} placeholder={placeholder ?? `请输入${label}`} /></label>; }
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) { return <label className="block"><span className="mb-2 block text-sm text-[#5d5148]">{label}</span><select className="quiet-input rounded-2xl" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => { const [optionValue, optionLabel] = option.split("|"); return <option key={optionValue} value={optionValue}>{optionLabel ?? optionValue}</option>; })}</select></label>; }
function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="flex items-center gap-3 rounded-2xl border border-[#e8dfd3] p-4 text-sm text-[#4a3d34]"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />{label}</label>; }
