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
import { readActivePlanningRun, readPlanningRun, readRecommendationCandidates, writePlanningReport, writeRecommendationCandidates } from "@/lib/planning-store";
import type { ProgrammeCandidate } from "@/lib/recommendation/types";

export default function ResultPage() {
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [report, setReport] = useState<PlanningReport>();
  const [runId, setRunId] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [programmeCandidates, setProgrammeCandidates] = useState<ProgrammeCandidate[]>([]);
  const [recommendationStatus, setRecommendationStatus] = useState<"loading" | "ready" | "error">("loading");
  const [recommendationMessage, setRecommendationMessage] = useState("");

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
        const cachedCandidates = readRecommendationCandidates(run.id, run.profile);
        if (cachedCandidates?.length) {
          setProgrammeCandidates(cachedCandidates);
          setRecommendationStatus("ready");
          return;
        }
        const response = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Idempotency-Key": run.id },
          body: JSON.stringify({ profile: run.profile, plannedApplicationCount: 6 }),
          signal: controller.signal,
        });
        const data = await response.json() as { candidates?: ProgrammeCandidate[]; emptyReason?: string; generationStatus?: "complete" | "partial" | "empty"; aiStatus?: "completed" | "unavailable"; message?: string; code?: string };
        if (!response.ok) throw new Error(data.message ?? "鎺ㄨ崘鐢熸垚澶辫触锛岃绋嶅悗閲嶈瘯");
        if (!Array.isArray(data.candidates) || !["complete", "partial", "empty"].includes(data.generationStatus ?? "") || !["completed", "unavailable"].includes(data.aiStatus ?? "")) {
          throw new Error("RECOMMENDATION_RESPONSE_CONTRACT_INVALID");
        }
        if (data.candidates.some((candidate) => !candidate.institutionName || !candidate.programmeName || !candidate.country || !candidate.degreeLevel || !candidate.officialProgrammeUrl)) {
          throw new Error("RECOMMENDATION_RESPONSE_CONTRACT_INVALID");
        }
        const candidates = data.candidates ?? [];
        setRecommendationMessage(data.emptyReason ?? (data.generationStatus === "partial" ? "閮ㄥ垎缁撴灉浠嶅湪鏍搁獙锛岃绋嶅悗閲嶈瘯浠ヨ幏鍙栨洿澶氶」鐩€? : ""));
        console.info("[school-recommendation-result]", {
          apiCandidateCount: candidates.length,
          stateCandidateCount: candidates.length,
          renderedCardCount: Math.min(candidates.length, 6),
        });
        setProgrammeCandidates(candidates);
        writeRecommendationCandidates(run.id, run.profile, candidates);
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

  if (status === "loading") return <main className="atlas-shell grid min-h-[70vh] place-items-center py-8"><div className="text-center text-sm text-[#6f6256]"><LoaderCircle className="mx-auto mb-3 animate-spin" size={26} />Atlas 姝ｅ湪鏍规嵁浣犵殑鑳屾櫙鏁寸悊鐢宠鏂规鈥︹€?/div></main>;
  if (status === "missing") return <main className="atlas-shell py-8"><BackHome /><Card className="mx-auto max-w-xl text-center"><h1 className="font-editorial text-4xl font-semibold">娌℃湁鎵惧埌鏈鐢宠瑙勫垝銆?/h1><Link href="/planner" className="mt-6 inline-flex rounded-full bg-[#2f2924] px-6 py-3 text-sm text-white">閲嶆柊寮€濮嬪厤璐硅鍒?/Link></Card></main>;
  if (status === "error" || !report) return <main className="atlas-shell py-8"><BackHome /><Card className="mx-auto max-w-xl text-center"><h1 className="font-editorial text-4xl font-semibold">瑙勫垝鎶ュ憡鏆傛椂鏃犳硶鐢熸垚</h1><p className="mt-3 text-sm text-[#8a5f54]">璇锋鏌ヨ祫鏂欏悗閲嶆柊灏濊瘯銆?/p><Link href="/planner" className="mt-6 inline-flex rounded-full bg-[#2f2924] px-6 py-3 text-sm text-white">杩斿洖鍏嶈垂瑙勫垝</Link></Card></main>;

  return <main className="atlas-shell py-8"><BackHome /><section className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
    <Card><p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">Free result</p><h1 className="mt-3 font-editorial text-6xl font-semibold leading-none">鏈瑙勫垝鍒嗘瀽宸茬敓鎴?/h1><p className="mt-5 text-sm leading-6 text-[#6f6256]">{report.profileSummary}</p><div className="mt-8 rounded-[22px] bg-[#f4ede4] p-6 text-center"><p className="text-sm text-[#6f6256]">鐢宠绔炰簤鍔涘垎鏁?/p><p className="font-editorial text-7xl font-semibold text-[#2f2924]">{report.competitivenessScore}</p><ProgressBar value={report.competitivenessScore} className="mt-4" /></div><p className="mt-4 text-xs leading-5 text-[#8f847a]">璇ュ垎鏁扮敤浜庤瘑鍒綋鍓嶄紭鍔垮拰鍑嗗閲嶇偣锛屼笉浠ｈ〃褰曞彇姒傜巼鎴栧鏍℃渶缁堝喅瀹氥€?/p><div className="mt-6 grid gap-3"><button type="button" onClick={() => setExpanded((value) => !value)} className="rounded-full border border-[#2f2924] px-6 py-4 text-sm font-medium text-[#2f2924]">{expanded ? "鏀惰捣瀹屾暣瑙勫垝鍒嗘瀽" : "鏌ョ湅瀹屾暣瑙勫垝鍒嗘瀽"}</button><Link href={`/applications/recommendations?runId=${encodeURIComponent(runId)}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2f2924] px-6 py-4 text-sm font-medium text-[#fffaf3]">鏌ョ湅鎺ㄨ崘瀛︽牎 <ArrowRight size={17} /></Link></div></Card>
    <div className="space-y-6"><Card><CardHeader title="鎺ㄨ崘鍥藉鍖归厤搴? /><div className="space-y-5">{report.countryFit.map((item) => <div key={item.country}><div className="mb-2 flex items-center justify-between text-sm"><span className="font-medium">{item.country}</span><span className="text-[#8f847a]">{item.fit}%</span></div><ProgressBar value={item.fit} /><p className="mt-2 text-sm text-[#6f6256]">{item.note}</p></div>)}</div></Card>
      <div className="grid gap-6 md:grid-cols-2"><Card><CardHeader title="鐢宠浼樺娍" /><ul className="space-y-3 text-sm text-[#5d5148]">{report.strengths.map((item) => <li key={item}>路 {item}</li>)}</ul></Card><Card><CardHeader title="闇€瑕侀噸鐐瑰噯澶? /><ul className="space-y-3 text-sm text-[#5d5148]">{report.preparationItems.map((item) => <li key={item}>路 {item}</li>)}</ul></Card></div>
      <Card><CardHeader title="涓昏鎺ㄨ崘椤圭洰" />{recommendationStatus === "loading" ? <RecommendationGenerationProgress /> : programmeCandidates.length ? <div className="grid gap-3 md:grid-cols-3">{programmeCandidates.slice(0, 6).map((candidate) => <div key={candidate.officialProgrammeUrl} data-testid="recommendation-card" data-country={candidate.country} className="rounded-2xl border border-[#e8dfd3] bg-[#f7f0e8] p-4"><p data-testid="institution-name" className="font-medium">{candidate.institutionName}</p><p data-testid="programme-name" className="mt-1 text-sm text-[#6f6256]">{candidate.programmeName}</p><p className="mt-3 text-xs text-[#8f847a]">鏂规鍖归厤搴?{candidate.score} 路 {candidate.verificationStatus !== "verified" ? "寰?Atlas 鏍搁獙" : "宸叉牳楠?}</p></div>)}</div> : recommendationStatus === "error" ? <div data-testid="recommendation-error" className="rounded-2xl bg-[#f6e7df] p-5 text-sm leading-6 text-[#8a5f54]"><p>鎺ㄨ崘鐢熸垚澶辫触锛屾湰娆¤鍒掕祫鏂欎粛宸蹭繚瀛樸€?/p><button type="button" onClick={() => window.location.reload()} className="mt-3 rounded-full bg-[#2f2924] px-5 py-2.5 text-xs font-medium text-white">閲嶆柊鐢熸垚鎺ㄨ崘</button></div> : <div data-testid="recommendation-empty" className="rounded-2xl bg-[#fbf2df] p-5 text-sm leading-6 text-[#7b6541]">{recommendationMessage || "Atlas 鏆傛湭鐢熸垚鍙敤鐨勫鏍℃帹鑽愶紝璇烽噸鏂板皾璇曘€?}</div>}</Card>
      {expanded ? <Card><CardHeader title="鏈瑙勫垝鏃堕棿绾? /><div className="space-y-3">{report.timeline.map((item) => <div key={item.label} className="flex justify-between gap-4 rounded-2xl bg-[#f7f0e8] p-4 text-sm"><span>{item.label}</span><span className="shrink-0 text-[#8f847a]">{item.targetDate}</span></div>)}</div></Card> : null}
    </div>
  </section></main>;
}

function RecommendationGenerationProgress() {
  return <div className="rounded-2xl bg-[#f7f0e8] p-5"><div className="flex items-center gap-2 text-sm text-[#6f6256]"><LoaderCircle className="animate-spin" size={18} />Atlas 姝ｅ湪妫€绱€佹牳楠屽苟鎺掑簭椤圭洰</div><p className="mt-3 text-xs text-[#8f847a]">宸叉牳楠岀粨鏋滀細浼樺厛杩斿洖锛岄儴鍒嗘帰绱㈡€у€欓€夊彲鑳界户缁瓑寰?Atlas 鏍搁獙銆?/p></div>;
}

