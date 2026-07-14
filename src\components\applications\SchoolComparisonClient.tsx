"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, LoaderCircle, RefreshCw } from "lucide-react";
import { DashboardShell } from "@/components/PageShell";
import { getAdmissionRequirements, recommendations, SchoolRecommendation } from "@/lib/application-prototype-data";
import { readApplicationSelection, writeApplicationSelection } from "@/lib/application-store";

const selectionKey = "atlas.school-comparison.selection.v1";
const resultKey = "atlas.school-comparison.result.v1";

type CompareStatus = "ready" | "loading" | "error";
type PublicVerification = { completed?: Record<string, boolean>; average?: number; result?: "accepted" | "not_found" | "needs_confirmation" };

export function SchoolComparisonClient() {
  const router = useRouter();
  const [ids, setIds] = useState<string[]>([]);
  const [status, setStatus] = useState<CompareStatus>("loading");
  const [message, setMessage] = useState("");
  const schools = useMemo(() => ids.map((id) => recommendations.find((school) => school.id === id)).filter((school): school is SchoolRecommendation => Boolean(school)), [ids]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(window.localStorage.getItem(selectionKey) ?? "[]") as string[];
        const valid = saved.filter((id) => recommendations.some((school) => school.id === id)).slice(0, 3);
        setIds(valid);
        setStatus(valid.length === 3 ? "ready" : "error");
      } catch { setStatus("error"); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function regenerate() {
    setStatus("loading"); setMessage("");
    window.setTimeout(() => {
      try {
        const saved = JSON.parse(window.localStorage.getItem(selectionKey) ?? "[]") as string[];
        const valid = saved.filter((id) => recommendations.some((school) => school.id === id)).slice(0, 3);
        setIds(valid); setStatus(valid.length === 3 ? "ready" : "error");
      } catch { setStatus("error"); }
    }, 450);
  }

  function saveResult() {
    window.localStorage.setItem(resultKey, JSON.stringify({ schoolIds: ids, savedAt: new Date().toISOString() }));
    setMessage("对比结果已保存。刷新或返回后仍可继续查看。");
  }

  function addToPlan() {
    writeApplicationSelection([...new Set([...readApplicationSelection(), ...ids])]);
    setMessage("3 所学校已加入我的申请计划。");
  }

  if (status === "loading") return <DashboardShell><div className="grid min-h-[55vh] place-items-center"><div className="text-center text-sm text-[#6f6256]"><LoaderCircle className="mx-auto mb-3 animate-spin" size={24} />正在生成学校对比……</div></div></DashboardShell>;
  if (status === "error" || schools.length !== 3) return <DashboardShell><div className="mx-auto max-w-xl rounded-[24px] border border-[#e7d0c7] bg-[#fffaf3] p-7 text-center"><h1 className="font-editorial text-4xl font-semibold text-[#2f2924]">暂时无法生成对比</h1><p className="mt-3 text-sm leading-6 text-[#8a5f54]">没有找到完整的 3 所学校选择。请返回重新选择，或尝试重新生成。</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><button type="button" onClick={regenerate} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2f2924] px-5 py-3 text-sm text-white"><RefreshCw size={15} />重新生成对比</button><Link href="/applications/recommendations" className="rounded-full border border-[#d8ccbe] px-5 py-3 text-sm text-[#4a3d34]">返回选择学校</Link></div></div></DashboardShell>;

  return <DashboardShell>
    <div className="space-y-6 pb-8">
      <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div><p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">Atlas 学校对比</p><h1 className="mt-2 font-editorial text-5xl font-semibold text-[#2f2924]">学校对比结果</h1><p className="mt-3 text-base text-[#6f6256]">根据你的背景信息和学校公开要求生成</p></div>
        <Link href="/applications/recommendations" className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d8ccbe] px-4 py-2.5 text-sm text-[#4a3d34]"><ArrowLeft size={15} />返回修改学校</Link>
      </header>

      <div className="overflow-x-auto rounded-[22px] border border-[#d8ccbe] bg-[#fffaf3] shadow-[0_12px_36px_rgba(88,72,55,0.08)]">
        <table className="w-full min-w-[980px] table-fixed border-collapse text-left">
          <thead><tr className="bg-[#f7f0e8]"><th className="w-44 border-b border-r border-[#e2d7c9] p-4 text-xs uppercase tracking-[0.16em] text-[#8f847a]">对比项目</th>{schools.map((school) => <th key={school.id} className="border-b border-r border-[#e2d7c9] p-5 align-top last:border-r-0"><p className="text-lg font-semibold text-[#2f2924]">{school.universityName}</p><p className="mt-1 text-sm font-normal leading-5 text-[#6f6256]">{school.programName}</p><ComparisonStatus school={school} /></th>)}</tr></thead>
          <tbody>{comparisonRows.map((row) => <tr key={row.label} className="border-b border-[#e8dfd3] last:border-b-0"><th className="border-r border-[#e8dfd3] bg-[#fcf8f2] p-4 align-top text-sm font-medium text-[#4a3d34]">{row.label}</th>{schools.map((school) => <td key={school.id} className="border-r border-[#e8dfd3] p-4 align-top text-sm leading-6 text-[#5d5148] last:border-r-0">{row.value(school)}</td>)}</tr>)}</tbody>
        </table>
      </div>

      {message ? <p role="status" className="rounded-2xl border border-[#c9dbc5] bg-[#eef4ed] p-4 text-sm text-[#4f6d54]">{message}</p> : null}
      <div className="flex flex-col justify-between gap-3 rounded-[22px] border border-[#d8ccbe] bg-[#fffaf3] p-4 sm:flex-row sm:items-center"><button type="button" onClick={() => router.push("/applications/recommendations")} className="rounded-full border border-[#d8ccbe] px-5 py-3 text-sm text-[#4a3d34]">返回修改对比</button><div className="flex flex-col gap-3 sm:flex-row"><button type="button" onClick={addToPlan} className="rounded-full border border-[#789276] px-5 py-3 text-sm font-medium text-[#4f6d54]">加入我的申请计划</button><button type="button" onClick={saveResult} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2f2924] px-5 py-3 text-sm font-medium text-white"><Check size={16} />保存对比结果</button></div></div>
    </div>
  </DashboardShell>;
}

const comparisonRows: Array<{ label: string; value: (school: SchoolRecommendation) => React.ReactNode }> = [
  { label: "学校名称", value: (school) => school.universityName },
  { label: "专业名称", value: (school) => school.programName },
  { label: "当前匹配结果", value: (school) => publicMatchStatus(school) },
  { label: "本科院校是否被接受", value: (school) => publicInstitutionResult(school).institution },
  { label: "成绩与公开要求", value: (school) => publicInstitutionResult(school).grade },
  { label: "语言成绩要求", value: (school) => getAdmissionRequirements(school).find((requirement) => requirement.label.includes("语言") || requirement.label.includes("英语"))?.schoolRequirement ?? "暂无公开信息" },
  { label: "申请截止时间", value: (school) => school.deadline || "暂无公开信息" },
  { label: "学费", value: (school) => school.tuition ? `${school.currency} ${school.tuition.toLocaleString()}` : "暂无公开信息" },
  { label: "需要补充的材料", value: (school) => school.materialsReady < school.materialsTotal ? school.requirements.slice(0, Math.max(1, school.materialsTotal - school.materialsReady)).join("、") || "需要进一步确认" : "当前未发现缺少材料" },
  { label: "当前风险或待确认事项", value: (school) => school.risks.length ? school.risks.join("；") : "需要进一步确认" },
  { label: "Atlas 建议的下一步", value: (school) => school.materialsReady < school.materialsTotal ? "补充缺少材料，并确认尚未核实的公开要求" : "确认申请轮次与截止日期后加入申请计划" },
];

function publicMatchStatus(school: SchoolRecommendation) {
  const requirements = getAdmissionRequirements(school);
  if (requirements.some((item) => item.status === "gap_detected")) return "存在明显差距";
  if (requirements.some((item) => item.status === "needs_confirmation" || item.status === "unknown")) return "基本符合，仍需补充材料";
  return "符合公开要求";
}

function publicInstitutionResult(school: SchoolRecommendation) {
  if (typeof window === "undefined") return { institution: "需要进一步确认", grade: "需要进一步确认" };
  try {
    const saved = JSON.parse(window.localStorage.getItem(`atlas.institution-verification.${school.id}`) ?? "{}") as PublicVerification;
    const complete = saved.completed && Object.values(saved.completed).every(Boolean);
    if (!complete) return { institution: "需要进一步确认", grade: "需要进一步确认" };
    if (saved.result === "not_found") return { institution: "未找到", grade: "暂未达到当前公开成绩标准" };
    if (saved.result === "accepted") return { institution: "已在接受范围内找到", grade: saved.average === undefined ? "已达到当前公开成绩标准" : `${saved.average}%：已达到当前公开成绩标准` };
  } catch { /* Fall through to the public fallback. */ }
  return { institution: "需要进一步确认", grade: "需要进一步确认" };
}

function ComparisonStatus({ school }: { school: SchoolRecommendation }) {
  const label = publicMatchStatus(school);
  const tone = label === "符合公开要求" ? "bg-[#dfeade] text-[#4f6d54]" : label === "存在明显差距" ? "bg-[#f6e7df] text-[#8a5f54]" : "bg-[#fbf2df] text-[#7b6541]";
  return <span className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${tone}`}>{label}</span>;
}
