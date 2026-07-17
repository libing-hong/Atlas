"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { ProgressBar } from "@/components/ProgressBar";
import { BackHome } from "@/components/PageShell";
import { recommendations } from "@/lib/application-prototype-data";
import { buildProgramPortfolio } from "@/lib/program-matching";
import { buildPlanningReport, PlanningReport } from "@/lib/planning-report";
import { readActivePlanningRun, readPlanningRun, writePlanningReport } from "@/lib/planning-store";
import type { ProgrammeCandidate } from "@/lib/recommendation/types";

export default function ResultPage() {
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [report, setReport] = useState<PlanningReport>();
  const [runId, setRunId] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [programmeCandidates, setProgrammeCandidates] = useState<ProgrammeCandidate[]>([]);
  const [recommendationStatus, setRecommendationStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const requested = new URLSearchParams(window.location.search).get("runId");
        const run = requested ? readPlanningRun(requested) : readActivePlanningRun();
        if (!run) { setStatus("missing"); return; }
        const portfolio = buildProgramPortfolio(run.profile, recommendations);
        const generated = buildPlanningReport(run.profile, portfolio, run.id);
        writePlanningReport(generated);
        setRunId(run.id);
        setReport(generated);
        setStatus("ready");
        const response = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile: run.profile, plannedApplicationCount: 6 }),
          signal: controller.signal,
        });
        const data = await response.json() as { candidates?: ProgrammeCandidate[]; message?: string };
        if (!response.ok) throw new Error(data.message ?? "推荐生成失败，请稍后重试");
        const candidates = data.candidates ?? [];
        console.info("[school-recommendation-result]", {
          apiCandidateCount: candidates.length,
          stateCandidateCount: candidates.length,
          renderedCardCount: Math.min(candidates.length, 6),
        });
        setProgrammeCandidates(candidates);
        setRecommendationStatus("ready");
      } catch {
        if (!controller.signal.aborted) {
          setRecommendationStatus("error");
          setStatus((current) => current === "loading" ? "error" : current);
        }
      }
    }, 250);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, []);

  if (status === "loading") return <main className="atlas-shell grid min-h-[70vh] place-items-center py-8"><div className="text-center text-sm text-[#6f6256]"><LoaderCircle className="mx-auto mb-3 animate-spin" size={26} />Atlas 正在根据你的背景整理申请方案……</div></main>;
  if (status === "missing") return <main className="atlas-shell py-8"><BackHome /><Card className="mx-auto max-w-xl text-center"><h1 className="font-editorial text-4xl font-semibold">没有找到本次申请规划。</h1><Link href="/planner" className="mt-6 inline-flex rounded-full bg-[#2f2924] px-6 py-3 text-sm text-white">重新开始免费规划</Link></Card></main>;
  if (status === "error" || !report) return <main className="atlas-shell py-8"><BackHome /><Card className="mx-auto max-w-xl text-center"><h1 className="font-editorial text-4xl font-semibold">规划报告暂时无法生成</h1><p className="mt-3 text-sm text-[#8a5f54]">请检查资料后重新尝试。</p><Link href="/planner" className="mt-6 inline-flex rounded-full bg-[#2f2924] px-6 py-3 text-sm text-white">返回免费规划</Link></Card></main>;

  return <main className="atlas-shell py-8"><BackHome /><section className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
    <Card><p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">Free result</p><h1 className="mt-3 font-editorial text-6xl font-semibold leading-none">本次规划分析已生成</h1><p className="mt-5 text-sm leading-6 text-[#6f6256]">{report.profileSummary}</p><div className="mt-8 rounded-[22px] bg-[#f4ede4] p-6 text-center"><p className="text-sm text-[#6f6256]">申请竞争力分数</p><p className="font-editorial text-7xl font-semibold text-[#2f2924]">{report.competitivenessScore}</p><ProgressBar value={report.competitivenessScore} className="mt-4" /></div><p className="mt-4 text-xs leading-5 text-[#8f847a]">该分数用于识别当前优势和准备重点，不代表录取概率或学校最终决定。</p><div className="mt-6 grid gap-3"><button type="button" onClick={() => setExpanded((value) => !value)} className="rounded-full border border-[#2f2924] px-6 py-4 text-sm font-medium text-[#2f2924]">{expanded ? "收起完整规划分析" : "查看完整规划分析"}</button><Link href={`/applications/recommendations?runId=${encodeURIComponent(runId)}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2f2924] px-6 py-4 text-sm font-medium text-[#fffaf3]">查看推荐学校 <ArrowRight size={17} /></Link></div></Card>
    <div className="space-y-6"><Card><CardHeader title="推荐国家匹配度" /><div className="space-y-5">{report.countryFit.map((item) => <div key={item.country}><div className="mb-2 flex items-center justify-between text-sm"><span className="font-medium">{item.country}</span><span className="text-[#8f847a]">{item.fit}%</span></div><ProgressBar value={item.fit} /><p className="mt-2 text-sm text-[#6f6256]">{item.note}</p></div>)}</div></Card>
      <div className="grid gap-6 md:grid-cols-2"><Card><CardHeader title="申请优势" /><ul className="space-y-3 text-sm text-[#5d5148]">{report.strengths.map((item) => <li key={item}>· {item}</li>)}</ul></Card><Card><CardHeader title="需要重点准备" /><ul className="space-y-3 text-sm text-[#5d5148]">{report.preparationItems.map((item) => <li key={item}>· {item}</li>)}</ul></Card></div>
      <Card><CardHeader title="主要推荐项目" />{recommendationStatus === "loading" ? <div className="flex items-center gap-3 rounded-2xl bg-[#f7f0e8] p-5 text-sm text-[#6f6256]"><LoaderCircle className="animate-spin" size={18} />ChatGPT 正在根据你的真实背景生成选校方案…</div> : programmeCandidates.length ? <div className="grid gap-3 md:grid-cols-3">{programmeCandidates.slice(0, 6).map((candidate) => <div key={candidate.officialProgrammeUrl} className="rounded-2xl border border-[#e8dfd3] bg-[#f7f0e8] p-4"><p className="font-medium">{candidate.institutionName}</p><p className="mt-1 text-sm text-[#6f6256]">{candidate.programmeName}</p><p className="mt-3 text-xs text-[#8f847a]">方案匹配度 {candidate.score} · {candidate.generatedByAI ? "待 Atlas 核验" : "已核验"}</p></div>)}</div> : recommendationStatus === "error" ? <div className="rounded-2xl bg-[#f6e7df] p-5 text-sm leading-6 text-[#8a5f54]">推荐生成失败，请稍后重试。</div> : <div className="rounded-2xl bg-[#fbf2df] p-5 text-sm leading-6 text-[#7b6541]">ChatGPT 未返回可用的学校推荐，请重新生成。</div>}</Card>
      {expanded ? <Card><CardHeader title="本次规划时间线" /><div className="space-y-3">{report.timeline.map((item) => <div key={item.label} className="flex justify-between gap-4 rounded-2xl bg-[#f7f0e8] p-4 text-sm"><span>{item.label}</span><span className="shrink-0 text-[#8f847a]">{item.targetDate}</span></div>)}</div></Card> : null}
    </div>
  </section></main>;
}

