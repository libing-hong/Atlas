"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DashboardShell } from "@/components/PageShell";
import { commonMaterials, type SchoolRecommendation } from "@/lib/application-prototype-data";
import { readApplicationRecords } from "@/lib/application-store";
import { readRecommendationCandidates } from "@/lib/planning-store";
import { readStudentProfile, type StudentProfile } from "@/lib/student-profile";
import { MaterialsWorkspaceClient } from "./MaterialsWorkspaceClient";

export function ApplicationMaterialsPageClient({ applicationId }: { applicationId: string }) {
  let decodedApplicationId = applicationId;
  try { decodedApplicationId = decodeURIComponent(applicationId); } catch { /* Keep the original route value. */ }
  const record = readApplicationRecords().find((item) => item.id === decodedApplicationId);
  if (!record) return <DashboardShell><div className="mx-auto max-w-xl rounded-[24px] border border-[#e7d0c7] bg-[#fffaf3] p-7 text-center"><h1 className="font-editorial text-4xl font-semibold">没有找到这条申请记录</h1><Link href="/applications" className="mt-6 inline-flex rounded-full bg-[#2f2924] px-6 py-3 text-sm text-white">返回我的申请</Link></div></DashboardShell>;

  const candidate = readRecommendationCandidates(record.planningRunId)?.find((item) => item.officialProgrammeUrl === record.schoolRecommendationId);
  const profile = readStudentProfile();
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
    admissionRequirements: candidate?.admissionRequirements?.map((item) => ({ id: item.category, label: { degree: "学位要求", grade: "成绩或 GPA 要求", subject: "本科专业背景", language: "语言成绩", experience: "工作或实习经历", prerequisite: "先修课程", portfolio: "作品集或其他特殊要求" }[item.category], schoolRequirement: item.requirement ?? "该项要求仍待官方核验", userSituation: applicantSituation(item.category, profile, decodedApplicationId), status: item.status, officialProgramUrl: item.sourceUrl ?? candidate.officialProgrammeUrl })),
    recommendationContent: { summary: candidate?.matchExplanation ?? "Atlas 已根据本次规划创建材料工作区。", personalFit: candidate?.matchExplanation ?? "", schoolHighlights: "", programHighlights: "", cautions: candidate?.missingInformation ?? [], sources: [] },
  };

  return <DashboardShell><div className="space-y-6"><Link href="/applications" className="inline-flex items-center gap-2 text-sm text-[#6f6256]"><ArrowLeft size={16} />返回我的申请</Link><header><p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">申请材料准备</p><h1 className="mt-2 max-w-5xl break-words font-editorial text-3xl font-semibold leading-tight text-[#2f2924] md:text-4xl">准备 {school.universityName} 的申请材料</h1><p className="mt-3 max-w-2xl text-base leading-7 text-[#6f6256]">Atlas 已根据这所学校的要求生成材料清单，并标记可以复用的已有材料。</p></header><MaterialsWorkspaceClient school={school} applicationId={decodedApplicationId} /></div></DashboardShell>;
}

function applicantSituation(category: string, profile: StudentProfile, applicationId: string) {
  const education = profile.educationHistory[0];
  const uploaded = typeof window !== "undefined" ? window.localStorage.getItem(`atlas.material-statuses.${applicationId}`) ?? "" : "";
  const score = education?.officialAverage ?? education?.weightedAverage ?? education?.arithmeticAverage ?? education?.gpa;
  if (category === "degree") return education ? `${education.institutionNameZh ?? education.institutionNameEn ?? "院校待确认"} · ${education.degreeName ?? education.degreeLevel ?? "学位名称待确认"}${uploaded.includes("degree") ? " · 学历材料已上传" : ""}` : "尚未填写教育背景";
  if (category === "grade") return score !== null && score !== undefined ? `已提供成绩：${score}${education?.gradingSystem ? `（${education.gradingSystem}）` : ""}${uploaded.includes("transcript") ? " · 成绩单已上传" : ""}` : "尚未提供可核验成绩";
  if (category === "subject") return education?.major ? `本科专业：${education.major}` : "尚未填写本科专业";
  if (category === "language") return profile.languageTests.length ? profile.languageTests.map((test) => `${test.type}：${test.overall ?? test.level ?? "分数待确认"}`).join("；") : "尚未提供语言成绩";
  if (category === "experience") { const experiences = [...profile.workExperiences, ...profile.internships]; return experiences.length ? experiences.map((item) => `${item.role}${item.months ? `（${item.months}个月）` : ""}`).join("；") : "尚未提供工作或实习经历"; }
  if (category === "prerequisite") return education?.prerequisiteCourses.length ? `已填写课程：${education.prerequisiteCourses.join("、")}` : "尚未填写可逐项核对的先修课程";
  return "当前资料中尚未提供作品集或其他特殊材料";
}

