"use client";

import { useState } from "react";
import { BookOpenText, Check, ChevronDown, ChevronUp, ExternalLink, GitCompareArrows, Plus } from "lucide-react";
import { Card } from "@/components/Card";
import { SchoolRecommendation } from "@/lib/application-prototype-data";
import { UniversityRankingRecord, qs2026SourceUrl } from "@/lib/university-rankings";

export function RecommendationSchoolCard({ school, ranking, isSelected, isCompared, onSelect, onCompare, onDetail }: {
  school: SchoolRecommendation;
  ranking?: UniversityRankingRecord;
  isSelected: boolean;
  isCompared: boolean;
  onSelect: () => void;
  onCompare: () => void;
  onDetail: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const rankingDisplay = ranking?.rankingDisplay ?? "暂无适用的QS排名数据";
  const rankingLabel = ranking?.rankingType === "subject" && ranking.rankingSubject
    ? `QS 2026 ${ranking.rankingSubject}排名`
    : ranking?.rankingType === "unavailable"
      ? "QS 2026"
      : "QS 2026 世界大学综合排名";
  return <Card className={`p-5 transition md:p-7 ${isCompared ? "border-2 border-[#5f805f] bg-[#fbfdf9] shadow-[0_12px_32px_rgba(72,101,74,0.10)]" : ""}`}>
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h3 className="text-xl font-semibold text-[#2f2924]">{school.universityName}</h3>
        <p className="mt-1 text-sm text-[#8f847a]">{school.country} · {school.city}</p>
      </div>
      <a href={ranking?.sourceUrl ?? qs2026SourceUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-xl border border-[#e1d7ca] bg-[#f7f0e8] px-3 py-2 text-right transition hover:bg-[#f1e7db]">
        <span className="block whitespace-nowrap text-[10px] tracking-[0.08em] text-[#8f847a]">{rankingLabel}</span>
        <span className="mt-0.5 block text-sm font-semibold text-[#4a3d34]">{rankingDisplay}</span>
      </a>
    </div>

    <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-base font-medium text-[#4a3d34]">{school.programName}</p>{school.atlasMatch ? <div className="rounded-full border border-[#d8ccbe] bg-[#fffaf3] px-3 py-1.5 text-xs text-[#5d5148]"><strong className="text-[#2f2924]">Atlas 方案匹配度 {school.atlasMatch.score}</strong><span className="ml-1 text-[#8f847a]">/ 100</span></div> : null}</div>
    <div className="mt-5 rounded-2xl bg-[#f7f0e8] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[#9a8b7c]">Atlas 为什么推荐</p>
      <p className="mt-2 text-sm leading-6 text-[#4a3d34]">{school.recommendationContent.summary}</p>
    </div>

    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <ContentSection title="学校特点" body={school.recommendationContent.schoolHighlights} />
      <ContentSection title="专业亮点" body={school.recommendationContent.programHighlights} />
    </div>
    <div className="mt-3 rounded-2xl border border-[#eadfce] p-4"><p className="text-xs uppercase tracking-[0.16em] text-[#9a8b7c]">需要注意的事项</p><p className="mt-2 text-sm leading-6 text-[#6f6256]">{school.recommendationContent.cautions[0] ?? "部分条件仍需结合完整申请材料确认"}</p></div>

    <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#4a3d34] underline decoration-[#c8a96b] underline-offset-4">{expanded ? "收起完整推荐分析" : "查看完整推荐分析"}{expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button>
    {expanded ? <div className="mt-4 space-y-4 border-t border-[#e8dfd3] pt-4">
      <ExpandedSection title="个人背景匹配原因" body={school.recommendationContent.personalFit} />
      <ExpandedSection title="学校特点" body={school.recommendationContent.schoolHighlights} />
      <ExpandedSection title="专业课程亮点" body={school.recommendationContent.programHighlights} />
      <div><h4 className="text-sm font-semibold text-[#2f2924]">可能需要注意的事项</h4><ul className="mt-2 space-y-1 text-sm leading-6 text-[#6f6256]">{school.recommendationContent.cautions.map((item) => <li key={item}>• {item}</li>)}</ul></div>
      <div><h4 className="text-sm font-semibold text-[#2f2924]">信息来源</h4><div className="mt-2 flex flex-wrap gap-2">{school.recommendationContent.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-[#d8ccbe] px-3 py-2 text-xs text-[#4f6d54]">{source.label}<ExternalLink size={12} /></a>)}</div></div>
    </div> : null}

    <div className="mt-5 flex flex-col gap-3 border-t border-[#e8dfd3] pt-5 lg:flex-row lg:items-center lg:justify-between">
      <button type="button" onClick={onDetail} className="inline-flex w-fit items-center gap-2 whitespace-nowrap rounded-full border border-[#d8ccbe] px-4 py-2.5 text-sm text-[#4a3d34]"><BookOpenText size={15} />查看课程与专业方向</button>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button type="button" onClick={onCompare} className={`inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full border px-4 py-2.5 text-sm ${isCompared ? "border-[#789276] bg-[#e7ece7] text-[#4f6d54]" : "border-[#d8ccbe] text-[#4a3d34]"}`}><GitCompareArrows size={15} />{isCompared ? "移出学校对比" : "加入学校对比"}</button>
        <button type="button" onClick={onSelect} className={`inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium ${isSelected ? "border border-[#c9dbc5] bg-[#e7ece7] text-[#4f6d54]" : "bg-[#2f2924] text-white"}`}>{isSelected ? <Check size={15} /> : <Plus size={15} />}{isSelected ? "已加入名单" : "加入申请名单"}</button>
      </div>
    </div>
    <p className="mt-3 text-xs leading-5 text-[#8f847a]">Atlas 方案匹配度用于帮助排序申请方案，不代表学校录取概率。推荐不等于获得录取资格，最终结果仍以学校官方审核为准。</p>
  </Card>;
}

function ContentSection({ title, body }: { title: string; body: string }) { return <div className="rounded-2xl border border-[#e8dfd3] p-4"><p className="text-xs uppercase tracking-[0.16em] text-[#9a8b7c]">{title}</p><p className="mt-2 text-sm leading-6 text-[#5d5148]">{body}</p></div>; }
function ExpandedSection({ title, body }: { title: string; body: string }) { return <div><h4 className="text-sm font-semibold text-[#2f2924]">{title}</h4><p className="mt-2 text-sm leading-6 text-[#6f6256]">{body}</p></div>; }
