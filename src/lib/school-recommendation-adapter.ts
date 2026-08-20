import { commonMaterials, type AdmissionRequirement, type SchoolRecommendation } from "./application-prototype-data";
import { getCandidatePresentation } from "./recommendation/presentation";
import type { ProgrammeCandidate } from "./recommendation/types";

const requirementLabels: Record<NonNullable<ProgrammeCandidate["admissionRequirements"]>[number]["category"], string> = {
  degree: "学位要求",
  grade: "成绩或 GPA 要求",
  subject: "本科专业背景",
  language: "语言成绩",
  experience: "工作或实习经历",
  prerequisite: "先修课程",
  portfolio: "作品集或其他特殊要求",
};

function candidateCategory(candidate: ProgrammeCandidate): SchoolRecommendation["category"] {
  if (candidate.verificationStatus !== "verified" || candidate.recommendationBand === "needs_confirmation") return "manual_review";
  return candidate.recommendationBand === "currently_not_suitable" ? "currently_not_eligible" : candidate.recommendationBand;
}

function candidateRequirements(candidate: ProgrammeCandidate): AdmissionRequirement[] | undefined {
  return candidate.admissionRequirements
    ?.filter((item) => Boolean(item.requirement?.trim()) || Boolean(item.applicantAssessment.trim()))
    .map((item) => ({
      id: item.category,
      label: requirementLabels[item.category],
      schoolRequirement: item.requirement?.trim() || "官方要求正在核验",
      userSituation: item.applicantAssessment,
      status: item.status,
      officialProgramUrl: item.sourceUrl ?? candidate.officialProgrammeUrl,
    }));
}

export function programmeCandidateToSchoolRecommendation(candidate: ProgrammeCandidate): SchoolRecommendation {
  const presentation = getCandidatePresentation(candidate);
  return {
    id: candidate.officialProgrammeUrl,
    universityId: candidate.verifiedProgramme.officialRootDomain,
    universityName: candidate.institutionName,
    programName: candidate.programmeName,
    country: candidate.country,
    city: candidate.verifiedProgramme.campus.value ?? "待确认",
    intake: candidate.verifiedProgramme.intake.value ?? "待确认",
    duration: "待确认",
    tuition: candidate.verifiedProgramme.tuition.value ?? 0,
    currency: candidate.verifiedProgramme.tuitionCurrency.value ?? "",
    deadline: candidate.verifiedProgramme.deadline.value ?? "待确认",
    deadlineType: candidate.verifiedProgramme.deadline.value?.toLowerCase().includes("rolling") ? "rolling" : "official",
    category: candidateCategory(candidate),
    reasons: [candidate.matchExplanation],
    matchedRequirements: [],
    risks: candidate.missingInformation,
    requirements: commonMaterials.map((item) => item.name),
    admissionRequirements: candidateRequirements(candidate),
    materialsReady: 0,
    materialsTotal: commonMaterials.length,
    isSelected: false,
    isConfirmed: false,
    officialProgramUrl: candidate.officialProgrammeUrl,
    applicationUrl: presentation.applicationUrl,
    applicationProvider: candidate.verifiedProgramme.applicationUrl.value ? "university" : undefined,
    applicationLinkStatus: presentation.applicationUrl ? "verified" : "needs_review",
    recommendationContent: {
      summary: candidate.matchExplanation,
      personalFit: candidate.matchExplanation,
      schoolHighlights: presentation.schoolHighlights,
      programHighlights: presentation.programHighlights,
      cautions: candidate.missingInformation,
      sources: presentation.sources.map((source) => ({ label: "学校官方项目页", url: source.sourceUrl })),
    },
  };
}
