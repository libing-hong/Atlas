"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { BackHome } from "@/components/PageShell";

type Term = { year: number; term: "spring" | "fall" };

export default function PlannerPage() {
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: 7 }, (_, index) => currentYear - 2 + index), [currentYear]);
  const terms = useMemo<Term[]>(() => years.slice(2, 5).flatMap((year) => [{ year, term: "spring" }, { year, term: "fall" }]), [years]);
  const [graduationStatus, setGraduationStatus] = useState<"graduated" | "expected">("expected");
  const [graduationYear, setGraduationYear] = useState(currentYear);
  const [graduationMonth, setGraduationMonth] = useState(6);
  const [intake, setIntake] = useState<Term>(terms[1] ?? { year: currentYear + 1, term: "fall" });
  const intakeBeforeGraduation = intake.year < graduationYear || (intake.year === graduationYear && intake.term === "spring" && graduationMonth > 6);
  const termLabel = (term: Term) => `${term.year}年${term.term === "spring" ? "春季" : "秋季"}`;

  return <main className="atlas-shell py-8"><BackHome /><section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]"><div className="pt-4"><p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">Free planner</p><h1 className="mt-3 font-editorial text-6xl font-semibold leading-none">先看清方向，再投入申请</h1><p className="mt-6 leading-8 text-[#6f6256]">填写基础背景后，Atlas 会免费生成完整申请分析、学校推荐、录取要求对照和申请时间规划。</p></div><form className="soft-card rounded-[24px] p-6" onSubmit={(event) => event.preventDefault()}><div className="grid gap-4 md:grid-cols-2"><Field label="姓名" /><Field label="当前本科院校" /><Field label="本科专业" /><Field label="GPA／均分" /><Field label="语言成绩" /><Field label="目标专业" />
          <div className="md:col-span-2"><span className="mb-2 block text-sm text-[#5d5148]">毕业状态</span><div className="grid gap-3 sm:grid-cols-2">{([["graduated", "已经毕业"], ["expected", "预计毕业／仍在读"]] as const).map(([value, label]) => <label key={value} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-sm ${graduationStatus === value ? "border-[#8ea08b] bg-[#e7ece7]" : "border-[#e8dfd3] bg-[#fffaf3]/70"}`}><input type="radio" name="graduationStatus" checked={graduationStatus === value} onChange={() => setGraduationStatus(value)} />{label}</label>)}</div></div>
          <label className="block"><span className="mb-2 block text-sm text-[#5d5148]">预计／实际毕业时间</span><div className="grid grid-cols-2 gap-2"><select className="quiet-input rounded-2xl" value={graduationYear} onChange={(event) => setGraduationYear(Number(event.target.value))}>{years.map((year) => <option key={year} value={year}>{year}年</option>)}</select><select className="quiet-input rounded-2xl" value={graduationMonth} onChange={(event) => setGraduationMonth(Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => index + 1).map((month) => <option key={month} value={month}>{month}月</option>)}</select></div></label>
          <label className="block"><span className="mb-2 block text-sm text-[#5d5148]">计划入学时间</span><select className="quiet-input rounded-2xl" value={`${intake.year}-${intake.term}`} onChange={(event) => { const [year, term] = event.target.value.split("-"); setIntake({ year: Number(year), term: term as Term["term"] }); }}>{terms.map((term) => <option key={`${term.year}-${term.term}`} value={`${term.year}-${term.term}`}>{termLabel(term)}</option>)}</select></label>
          {intakeBeforeGraduation ? <p className="md:col-span-2 rounded-2xl border border-[#e5cfaa] bg-[#fbf2df] p-4 text-sm leading-6 text-[#7b6541]">你选择的入学时间早于预计毕业时间，请确认是否可以在入学前取得完整学历证明。</p> : null}
          <Field label="学费预算" /><Field label="目标国家" />
        </div><Link href="/result" className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2f2924] px-6 py-4 text-sm font-medium text-[#fffaf3]">生成免费完整分析 <ArrowRight size={17} /></Link></form></section></main>;
}

function Field({ label }: { label: string }) { return <label className="block"><span className="mb-2 block text-sm text-[#5d5148]">{label}</span><input className="quiet-input rounded-2xl" placeholder={`请输入${label}`} /></label>; }
