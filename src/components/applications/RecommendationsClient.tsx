"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ChevronDown, ExternalLink, LoaderCircle, SlidersHorizontal, X } from "lucide-react";
import { RecommendationSchoolCard } from "./RecommendationSchoolCard";
import { DashboardShell } from "@/components/PageShell";
import { recommendations, applicationProfile, RecommendationCategory, SchoolRecommendation } from "@/lib/application-prototype-data";
import { confirmApplications, purchaseService, readApplicationSelection, writeApplicationMode, writeApplicationSelection } from "@/lib/application-store";
import { formatCNY } from "@/lib/format-currency";
import { UniversityRankingRecord } from "@/lib/university-rankings";

const categoryCopy: Record<RecommendationCategory, { label: string; description: string }> = {
  reach: { label: "冲刺选择", description: "与目标匹配，但录取要求相对较高，需要重点准备申请材料。" },
  target: { label: "重点选择", description: "你的背景与学校主要要求整体匹配，适合作为申请名单核心。" },
  safer: { label: "相对稳妥", description: "主要要求基本匹配，可用于平衡整体申请方案。" },
};

const comparisonSelectionKey = "atlas.school-comparison.selection.v1";

export function RecommendationsClient() {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const saved = readApplicationSelection();
    return saved.length ? saved : recommendations.filter((school) => school.isSelected).map((school) => school.id);
  });
  const [category, setCategory] = useState<RecommendationCategory | "all">("all");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState("");
  const [rankings, setRankings] = useState<Record<string, UniversityRankingRecord>>({});
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [targetCountries, setTargetCountries] = useState(applicationProfile.targetCountries.join("、"));
  const [targetSubjects, setTargetSubjects] = useState(applicationProfile.targetSubjects.join("、"));
  const regeneratedRecommendations = useMemo(() => {
    const wantsFrance = targetCountries.includes("法国");
    const wantsUnitedKingdom = targetCountries.includes("英国");
    return [...recommendations].sort((left, right) => {
      const leftPriority = wantsFrance && !wantsUnitedKingdom && left.country === "法国" ? -1 : 0;
      const rightPriority = wantsFrance && !wantsUnitedKingdom && right.country === "法国" ? -1 : 0;
      return leftPriority - rightPriority;
    });
  }, [targetCountries]);
  const filtered = useMemo(() => category === "all" ? regeneratedRecommendations : regeneratedRecommendations.filter((school) => school.category === category), [category, regeneratedRecommendations]);

  useEffect(() => {
    if (!readApplicationSelection().length && selectedIds.length) writeApplicationSelection(selectedIds);
  }, [selectedIds]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(window.localStorage.getItem(comparisonSelectionKey) ?? "[]") as string[];
        setCompareIds(saved.filter((id) => recommendations.some((school) => school.id === id)).slice(0, 3));
      } catch { setCompareIds([]); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const universityIds = recommendations.map((school) => school.universityId).join(",");
    fetch(`/api/rankings/qs-2026?universityIds=${encodeURIComponent(universityIds)}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("ranking request failed")))
      .then((value: { rankings: UniversityRankingRecord[] }) => setRankings(Object.fromEntries(value.rankings.map((ranking) => [ranking.universityId, ranking]))))
      .catch(() => setRankings({}));
  }, []);

  function toggleSelected(id: string) { setSelectedIds((ids) => { const next = ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]; writeApplicationSelection(next); return next; }); }
  function updateCompare(next: string[]) { setCompareIds(next); window.localStorage.setItem(comparisonSelectionKey, JSON.stringify(next)); setCompareError(""); }
  function toggleCompare(id: string) { const next = compareIds.includes(id) ? compareIds.filter((item) => item !== id) : compareIds.length < 3 ? [...compareIds, id] : compareIds; updateCompare(next); if (next === compareIds && !compareIds.includes(id)) setCompareError("最多选择 3 所学校，请先移除一所。"); }
  async function handleCompare() {
    if (compareIds.length !== 3 || compareLoading) return;
    setCompareLoading(true); setCompareError("");
    try {
      window.localStorage.setItem(comparisonSelectionKey, JSON.stringify(compareIds));
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      router.push("/applications/recommendations/compare");
    } catch { setCompareError("暂时无法生成学校对比，请重新尝试。"); setCompareLoading(false); }
  }
  async function handleConfirm() {
    if (!selectedIds.length || confirming) return;
    setConfirming(true);
    setError("");
    try {
      writeApplicationSelection(selectedIds);
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      setCheckoutOpen(true);
      setConfirming(false);
    } catch {
      setError("申请名单暂时无法保存，请重新尝试。");
      setConfirming(false);
    }
  }

  return <DashboardShell>
    <div className="space-y-6 pb-24">
      <header className="soft-card rounded-[24px] p-5 md:p-7">
        <p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">Atlas 推荐结果</p>
        <h1 className="mt-2 max-w-3xl font-editorial text-5xl font-semibold leading-tight text-[#2f2924] md:text-6xl">确认你准备申请的学校</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#6f6256]">Atlas 根据你的背景、目标专业、预算和入学时间整理了以下建议。建议最终确认 4–6 所学校。</p>
        <div className="mt-5 flex flex-wrap gap-2 text-sm text-[#5d5148]"><span className="rounded-full bg-[#f7f0e8] px-3 py-2">入学时间：{applicationProfile.intake}</span><span className="rounded-full bg-[#f7f0e8] px-3 py-2">目标国家：{applicationProfile.targetCountries.join("、")}</span><span className="rounded-full bg-[#f7f0e8] px-3 py-2">目标方向：{applicationProfile.targetSubjects.join("、")}</span><span className="rounded-full bg-[#f7f0e8] px-3 py-2">预算：{applicationProfile.budget}</span></div>
        <button type="button" onClick={() => setAdjustOpen(true)} className="mt-5 inline-flex items-center gap-2 text-sm text-[#4a3d34] underline underline-offset-4"><SlidersHorizontal size={16} />调整申请目标</button>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2"><FilterButton active={category === "all"} onClick={() => setCategory("all")}>全部学校</FilterButton>{(Object.keys(categoryCopy) as RecommendationCategory[]).map((key) => <FilterButton key={key} active={category === key} onClick={() => setCategory(key)}>{categoryCopy[key].label}</FilterButton>)}</div><button type="button" className="inline-flex items-center gap-2 rounded-full border border-[#d8ccbe] px-4 py-2 text-sm text-[#5d5148]"><ChevronDown size={15} />Atlas 推荐顺序</button></div>

      {(Object.keys(categoryCopy) as RecommendationCategory[]).map((key) => { const schools = filtered.filter((school) => school.category === key); if (!schools.length) return null; return <section key={key}><div className="mb-4"><h2 className="font-editorial text-3xl font-semibold text-[#2f2924]">{categoryCopy[key].label}</h2><p className="mt-1 text-sm text-[#6f6256]">{categoryCopy[key].description}</p></div><div className="grid grid-cols-1 gap-5">{schools.map((school) => <RecommendationSchoolCard key={school.id} school={school} ranking={rankings[school.universityId]} isSelected={selectedIds.includes(school.id)} isCompared={compareIds.includes(school.id)} onSelect={() => toggleSelected(school.id)} onCompare={() => toggleCompare(school.id)} onDetail={() => setDetailId(school.id)} />)}</div></section>; })}

      <section className={`${compareIds.length ? "relative" : "sticky bottom-3 z-20"} rounded-[22px] border border-[#d8ccbe] bg-[#fffaf3]/95 p-4 shadow-[0_16px_40px_rgba(88,72,55,0.12)] backdrop-blur`}><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><p className="text-sm font-semibold text-[#2f2924]">已选择 {selectedIds.length} 所学校</p><p className="mt-1 text-xs text-[#6f6256]">建议确认 4–6 所，之后 Atlas 会为每所学校创建材料准备入口。</p>{error ? <p className="mt-2 text-sm text-[#8a5f54]">{error}</p> : null}</div><button type="button" onClick={handleConfirm} disabled={!selectedIds.length || confirming} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2f2924] px-5 py-3 text-sm font-medium text-[#fffaf3] disabled:cursor-not-allowed disabled:opacity-40"><Check size={16} />{confirming ? "正在保存申请名单…" : "确认申请名单"}</button></div></section>
      {compareIds.length ? <CompareBar ids={compareIds} loading={compareLoading} error={compareError} onRemove={toggleCompare} onClear={() => updateCompare([])} onConfirm={handleCompare} /> : null}
      {detailId ? <DetailPanel school={recommendations.find((school) => school.id === detailId)!} isSelected={selectedIds.includes(detailId)} onClose={() => setDetailId(null)} onSelect={() => toggleSelected(detailId)} /> : null}
      {checkoutOpen ? <ServiceChoice selectedCount={selectedIds.length} onCancel={() => setCheckoutOpen(false)} onSelf={() => { writeApplicationMode("DIY"); confirmApplications(selectedIds, recommendations); router.push("/applications?confirmed=1"); }} onSubmission={() => { writeApplicationMode("managed"); confirmApplications(selectedIds, recommendations); purchaseService("single_school_submission"); router.push("/applications?service=single-school"); }} onConsultation={() => { writeApplicationMode("advisor_assisted"); confirmApplications(selectedIds, recommendations); purchaseService("advisor_consultation"); router.push("/dashboard/order-application?service=consultation"); }} /> : null}
      {adjustOpen ? <GoalDrawer countries={targetCountries} subjects={targetSubjects} onCountries={setTargetCountries} onSubjects={setTargetSubjects} onClose={() => setAdjustOpen(false)} onSave={() => { window.localStorage.setItem("atlas.application.profile.v1", JSON.stringify({ targetCountries: targetCountries.split("、").map((item) => item.trim()).filter(Boolean), targetSubjects: targetSubjects.split("、").map((item) => item.trim()).filter(Boolean) })); setAdjustOpen(false); }} /> : null}
    </div>
  </DashboardShell>;
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className={`rounded-full border px-4 py-2 text-sm transition ${active ? "border-[#2f2924] bg-[#2f2924] text-[#fffaf3]" : "border-[#d8ccbe] text-[#5d5148] hover:bg-[#f7f0e8]"}`}>{children}</button>; }
function CompareBar({ ids, loading, error, onRemove, onClear, onConfirm }: { ids: string[]; loading: boolean; error: string; onRemove: (id: string) => void; onClear: () => void; onConfirm: () => void }) { const ready = ids.length === 3; return <div className="fixed bottom-4 left-1/2 z-40 w-[min(920px,calc(100%-32px))] -translate-x-1/2 rounded-[22px] border border-[#cdbfae] bg-[#fffaf3]/98 p-4 shadow-[0_18px_50px_rgba(88,72,55,0.22)] backdrop-blur"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div className="min-w-0"><div className="flex items-center gap-3"><p className="text-sm font-semibold text-[#2f2924]">已选择 {ids.length}/3</p><button type="button" onClick={onClear} disabled={loading} className="text-xs text-[#8f847a] underline underline-offset-4">清空选择</button></div><div className="mt-2 flex flex-wrap gap-2">{ids.map((id) => { const school = recommendations.find((item) => item.id === id)!; return <button key={id} type="button" onClick={() => onRemove(id)} disabled={loading} className="inline-flex items-center gap-2 rounded-full bg-[#f7f0e8] px-3 py-2 text-xs text-[#4a3d34] disabled:opacity-60">{school.universityName}<X size={13} /></button>; })}</div>{error ? <p className="mt-2 text-xs text-[#9a574d]">{error}</p> : null}</div><button type="button" onClick={onConfirm} disabled={!ready || loading} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#2f2924] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#493d34] disabled:cursor-not-allowed disabled:bg-[#ded5ca] disabled:text-[#8f847a]">{loading ? <><LoaderCircle size={16} className="animate-spin" />正在生成对比……</> : ready ? <>确认并查看对比结果<ArrowRight size={16} /></> : "请选择3所学校"}</button></div></div>; }
function DetailPanel({ school, isSelected, onClose, onSelect }: { school: SchoolRecommendation; isSelected: boolean; onClose: () => void; onSelect: () => void }) {
  const detail = school.programDetails;
  const unavailable = "该项公开信息暂未确认";
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#2f2924]/20 p-4 md:items-center"><div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[24px] bg-[#fffaf3] p-6 shadow-2xl md:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-[#8f847a]">{school.country} · {school.city}</p><h2 className="mt-2 font-editorial text-4xl font-semibold text-[#2f2924]">课程与专业方向</h2><p className="mt-2 font-medium text-[#4a3d34]">{school.universityName} · {school.programName}</p></div><button type="button" onClick={onClose} aria-label="关闭" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#d8ccbe] text-[#5d5148]"><X size={17} /></button></div><div className="mt-6 space-y-5"><ProgramText title="专业介绍" body={detail?.introduction ?? unavailable} /><div className="grid gap-4 md:grid-cols-2"><DetailSection title="培养方向" items={detail?.directions ?? [unavailable]} /><DetailSection title="核心课程" items={detail?.coreCourses ?? [unavailable]} /><DetailSection title="选修课程" items={detail?.electiveCourses ?? [unavailable]} /><DetailSection title="学习成果" items={detail?.learningOutcomes ?? [unavailable]} /></div><div className="grid gap-3 sm:grid-cols-3"><ProgramFact label="项目时长" value={school.duration} /><ProgramFact label="授课地点" value={detail?.teachingLocation ?? `${school.city}, ${school.country}`} /><ProgramFact label="教学形式" value={detail?.teachingFormat ?? unavailable} /></div><div className="grid gap-4 md:grid-cols-2"><DetailSection title="实践项目" items={detail?.practicalProjects ?? [unavailable]} /><DetailSection title="职业方向" items={detail?.careerDirections ?? [unavailable]} /></div><div><p className="text-xs uppercase tracking-[0.18em] text-[#9a8b7c]">官方信息来源</p>{school.officialProgramUrl ? <a href={school.officialProgramUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-[#d8ccbe] px-4 py-2.5 text-sm text-[#4a3d34]">查看学校官方专业页面 <ExternalLink size={14} /></a> : <p className="mt-2 text-sm text-[#6f6256]">{unavailable}</p>}</div></div><p className="mt-6 border-t border-[#e8dfd3] pt-4 text-xs leading-5 text-[#8f847a]">录取条件、语言要求和均分要求请前往“公开要求对照”查看。</p><div className="mt-5 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={onSelect} className={`whitespace-nowrap rounded-full px-5 py-3 text-sm font-medium ${isSelected ? "border border-[#c9dbc5] bg-[#e7ece7] text-[#4f6d54]" : "bg-[#2f2924] text-[#fffaf3]"}`}>{isSelected ? "从申请名单移除" : "加入申请名单"}</button><button type="button" onClick={onClose} className="whitespace-nowrap rounded-full border border-[#d8ccbe] px-5 py-3 text-sm text-[#4a3d34]">返回推荐结果</button></div></div></div>;
}
function ProgramText({ title, body }: { title: string; body: string }) { return <div className="rounded-2xl bg-[#f7f0e8] p-4"><p className="text-xs uppercase tracking-[0.16em] text-[#9a8b7c]">{title}</p><p className="mt-2 text-sm leading-6 text-[#5d5148]">{body}</p></div>; }
function ProgramFact({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-[#e8dfd3] p-4"><p className="text-xs text-[#9a8b7c]">{label}</p><p className="mt-2 text-sm font-medium leading-6 text-[#4a3d34]">{value}</p></div>; }
function DetailSection({ title, items }: { title: string; items: string[] }) { return <div className="rounded-2xl border border-[#e8dfd3] p-4"><h3 className="text-sm font-semibold text-[#2f2924]">{title}</h3><ul className="mt-3 space-y-2 text-sm leading-6 text-[#6f6256]">{items.map((item) => <li key={item} className="flex gap-2"><span className="text-[#8ea08b]">•</span>{item}</li>)}</ul></div>; }


function ServiceChoice({ selectedCount, onCancel, onSelf, onSubmission, onConsultation }: { selectedCount: number; onCancel: () => void; onSelf: () => void; onSubmission: () => void; onConsultation: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#2f2924]/20 p-4 md:items-center"><div className="w-full max-w-xl rounded-[24px] bg-[#fffaf3] p-6 shadow-2xl md:p-8"><p className="text-xs uppercase tracking-[0.24em] text-[#9a8b7c]">确认申请名单</p><h2 className="mt-2 font-editorial text-4xl font-semibold text-[#2f2924]">选择如何完成申请</h2><p className="mt-3 text-sm leading-6 text-[#6f6256]">你已确认 {selectedCount} 所学校。完整规划和学校推荐免费开放，接下来选择最适合你的方式。</p><div className="mt-6 grid gap-3"><button type="button" onClick={onSelf} className="rounded-2xl border border-[#d8ccbe] bg-[#f7f0e8] p-4 text-left"><strong className="block text-[#2f2924]">自己准备申请</strong><span className="mt-1 block text-sm text-[#6f6256]">免费创建申请记录、要求对照和材料清单。</span></button><button type="button" onClick={onSubmission} className="rounded-2xl bg-[#2f2924] p-4 text-left text-[#fffaf3]"><strong className="block">交给 Atlas 递交 {formatCNY(29.9)}／学校</strong><span className="mt-1 block text-sm text-[#eee5db]">根据确认信息填写申请系统，提交前由你确认。</span></button><button type="button" onClick={onConsultation} className="rounded-2xl border border-[#d8ccbe] p-4 text-left"><strong className="block text-[#2f2924]">预约一对一留学规划 {formatCNY(299)}／次</strong><span className="mt-1 block text-sm text-[#6f6256]">人工复核背景、方向和申请优先级。</span></button></div><button type="button" onClick={onCancel} className="mt-5 w-full rounded-full border border-[#d8ccbe] px-5 py-3 text-sm text-[#4a3d34]">暂时不申请</button></div></div>;
}

function GoalDrawer({ countries, subjects, onCountries, onSubjects, onClose, onSave }: { countries: string; subjects: string; onCountries: (value: string) => void; onSubjects: (value: string) => void; onClose: () => void; onSave: () => void }) {
  return <div className="fixed inset-0 z-50 flex justify-end bg-[#2f2924]/20"><aside className="h-full w-full max-w-lg overflow-y-auto bg-[#fffaf3] p-6 shadow-2xl md:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.24em] text-[#9a8b7c]">申请目标</p><h2 className="mt-2 font-editorial text-4xl font-semibold text-[#2f2924]">调整申请目标</h2></div><button type="button" onClick={onClose} className="text-sm text-[#6f6256]">关闭</button></div><p className="mt-4 rounded-2xl border border-[#e7d0c7] bg-[#f6e7df] p-4 text-sm leading-6 text-[#8a5f54]">修改申请目标可能影响已经确认的学校和材料要求。</p><div className="mt-6 space-y-4"><label className="block text-sm text-[#4a3d34]">入学时间<input className="quiet-input mt-2 rounded-xl" defaultValue={applicationProfile.intake} /></label><label className="block text-sm text-[#4a3d34]">目标国家<span className="mt-2 block text-xs text-[#8f847a]">使用“、”分隔</span><input className="quiet-input mt-2 rounded-xl" value={countries} onChange={(event) => onCountries(event.target.value)} /></label><label className="block text-sm text-[#4a3d34]">目标专业<span className="mt-2 block text-xs text-[#8f847a]">使用“、”分隔</span><input className="quiet-input mt-2 rounded-xl" value={subjects} onChange={(event) => onSubjects(event.target.value)} /></label><label className="block text-sm text-[#4a3d34]">学位层级<select className="quiet-input mt-2 rounded-xl" defaultValue="硕士"><option>硕士</option><option>本科</option><option>博士</option></select></label><label className="block text-sm text-[#4a3d34]">计划申请学校数量<select className="quiet-input mt-2 rounded-xl" defaultValue="4–6 所"><option>1–2 所</option><option>4–6 所</option><option>7–10 所</option></select></label><label className="block text-sm text-[#4a3d34]">学费预算<input className="quiet-input mt-2 rounded-xl" defaultValue={applicationProfile.budget} /></label><label className="block text-sm text-[#4a3d34]">城市偏好<input className="quiet-input mt-2 rounded-xl" placeholder="例如：伦敦、Leeds、巴黎" /></label><label className="flex items-center gap-3 text-sm text-[#4a3d34]"><input type="checkbox" /> 接受跨专业</label><label className="flex items-center gap-3 text-sm text-[#4a3d34]"><input type="checkbox" /> 接受预科或语言班</label></div><div className="mt-8 flex gap-3"><button type="button" onClick={onClose} className="flex-1 rounded-full border border-[#d8ccbe] px-5 py-3 text-sm text-[#4a3d34]">取消</button><button type="button" onClick={onSave} className="flex-1 rounded-full bg-[#2f2924] px-5 py-3 text-sm font-medium text-[#fffaf3]">保存并重新生成建议</button></div></aside></div>;
}
