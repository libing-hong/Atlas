"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DashboardShell } from "@/components/PageShell";
import { commonMaterials, type SchoolRecommendation } from "@/lib/application-prototype-data";
import { readApplicationRecords } from "@/lib/application-store";
import { readRecommendationCandidates } from "@/lib/planning-store";
import { MaterialsWorkspaceClient } from "./MaterialsWorkspaceClient";

export function ApplicationMaterialsPageClient({ applicationId }: { applicationId: string }) {
  const record = readApplicationRecords().find((item) => item.id === applicationId);
  if (!record) return <DashboardShell><div className="mx-auto max-w-xl rounded-[24px] border border-[#e7d0c7] bg-[#fffaf3] p-7 text-center"><h1 className="font-editorial text-4xl font-semibold">没有找到这条申请记录</h1><Link href="/applications" className="mt-6 inline-flex rounded-full bg-[#2f2924] px-6 py-3 text-sm text-white">返回我的申请</Link></div></DashboardShell>;

  const candidate = readRecommendationCandidates(record.planningRunId)?.find((item) => item.officialProgrammeUrl === record.schoolRecommendationId);
  const school: SchoolRecommendation = {
    id: record.schoolRecommendationId,
    universityId: candidate?.verifiedProgramme.officialRootDomain ?? record.universityName,
    universityName: record.universityName,
    programName: record.programName,
    country: record.country,
    city: candidate?.verifiedProgramme.campus.value ?? "待确认",
    intake: record.intake,
    duration: "待确认",
    tuition: candidate?.verifiedProgramme.tuition.value ?? 0,
    currency: candidate?.verifiedProgramme.tuitionCurrency.value ?? "",
    deadline: record.nextDeadline ?? "待确认",
    deadlineType: "official",
    category: candidate?.recommendationBand === "safer" ? "safer" : candidate?.recommendationBand === "target" ? "target" : candidate?.recommendationBand === "reach" ? "reach" : "manual_review",
    reasons: candidate ? [candidate.matchExplanation] : [],
    matchedRequirements: [],
    risks: candidate?.missingInformation ?? [],
    requirements: commonMaterials.map((item) => item.name),
    materialsReady: record.detectedMaterialCount,
    materialsTotal: Math.max(record.totalMaterials, commonMaterials.length),
    isSelected: true,
    isConfirmed: true,
    officialProgramUrl: candidate?.officialProgrammeUrl,
    applicationUrl: candidate?.verifiedProgramme.applicationUrl.value ?? undefined,
    applicationLinkStatus: candidate?.verifiedProgramme.applicationUrl.value ? "verified" : "needs_review",
    recommendationContent: { summary: candidate?.matchExplanation ?? "Atlas 已根据本次规划创建材料工作区。", personalFit: candidate?.matchExplanation ?? "", schoolHighlights: "", programHighlights: "", cautions: candidate?.missingInformation ?? [], sources: [] },
  };

  return <DashboardShell><div className="space-y-6"><Link href="/applications" className="inline-flex items-center gap-2 text-sm text-[#6f6256]"><ArrowLeft size={16} />返回我的申请</Link><header><p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">申请材料准备</p><h1 className="mt-2 font-editorial text-5xl font-semibold text-[#2f2924]">准备 {school.universityName} 的申请材料</h1><p className="mt-3 max-w-2xl text-base leading-7 text-[#6f6256]">Atlas 已根据这所学校的要求生成材料清单，并标记可以复用的已有材料。</p></header><MaterialsWorkspaceClient school={school} applicationId={applicationId} /></div></DashboardShell>;
}

