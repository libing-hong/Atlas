import type { FieldRelation, ProgrammeCandidate, RecommendationBand, UnderstoodProfile, VerifiedProgramme } from "./types";
import { sourcesFor } from "./official-verification";

const relationCopy: Record<FieldRelation, string> = { synonym: "属于同一专业方向", highly_related: "与目标专业高度相关", adjacent: "属于相邻专业方向", cross_discipline: "属于明显跨专业方向" };
const pending = (value: unknown) => value === null || value === undefined;

export function fieldRelationLabel(relation: FieldRelation) { return relationCopy[relation]; }

export function assessEligibility(profile: UnderstoodProfile, programme: VerifiedProgramme): ProgrammeCandidate {
  const missing: string[] = [];
  for (const [label, value] of [["招生年份", programme.intake.value], ["授课语言", programme.teachingLanguage.value], ["学历要求", programme.degreeRequirement.value], ["本科专业要求", programme.subjectRequirement.value], ["成绩要求", programme.gradeRequirement.value], ["语言要求", programme.languageRequirement.value], ["校区", programme.campus.value], ["学费", programme.tuition.value], ["截止日期", programme.deadline.value], ["官方申请链接", programme.applicationUrl.value]] as const) if (pending(value)) missing.push(label);
  const academicStatus = programme.degreeLevel === profile.targetDegreeLevel && programme.degreeRequirement.value ? "meets" : "pending";
  const languageStatus = !profile.languageTests.length || !programme.languageRequirement.value ? "pending" : "meets";
  const budgetStatus = profile.maxAnnualTuition === null || programme.tuition.value === null || profile.tuitionCurrency !== programme.tuitionCurrency.value ? "pending" : programme.tuition.value <= profile.maxAnnualTuition ? "meets" : "does_not_meet";
  const targetYear = profile.intakeYear ? String(profile.intakeYear) : null; const timelineStatus = !targetYear || !programme.intake.value ? "pending" : programme.intake.value.includes(targetYear) ? "meets" : "pending";
  const explicitFailure = programme.active.value === false || budgetStatus === "does_not_meet";
  const verificationStatus = missing.length ? "partially_verified" : "verified"; let score = programme.fieldRelation === "synonym" ? 82 : programme.fieldRelation === "highly_related" ? 76 : programme.fieldRelation === "adjacent" ? 64 : 45;
  score += academicStatus === "meets" ? 5 : 0; score += languageStatus === "meets" ? 4 : 0; score += budgetStatus === "meets" ? 4 : 0; score += timelineStatus === "meets" ? 5 : 0; score -= missing.length * 2;
  const recommendationBand: RecommendationBand = explicitFailure ? "currently_not_suitable" : verificationStatus !== "verified" ? "needs_confirmation" : score >= 88 ? "safer" : score >= 75 ? "target" : "reach";
  return { institution: programme.institutionName, programme: programme.programmeName, institutionName: programme.institutionName, programmeName: programme.programmeName, country: programme.country, degreeLevel: programme.degreeLevel, officialUrl: programme.officialProgrammeUrl, officialProgrammeUrl: programme.officialProgrammeUrl, fieldRelation: programme.fieldRelation, academicStatus, languageStatus, budgetStatus, timelineStatus, verificationStatus, missingInformation: missing, sources: sourcesFor(programme), matchExplanation: `项目${relationCopy[programme.fieldRelation]}。${missing.length ? `尚需核验：${missing.join("、")}。` : "公开字段已完成核验。"}`, recommendationBand, score: Math.max(0, Math.min(100, score)), verifiedProgramme: programme };
}

export function validateProgrammeForDisplay(candidate: ProgrammeCandidate, profile?: UnderstoodProfile): boolean {
  if (!candidate.institutionName.trim() || !candidate.programmeName.trim() || !candidate.country || !candidate.degreeLevel || !candidate.officialProgrammeUrl) return false;
  if (candidate.generatedByAI) return !profile || (profile.targetCountries.includes(candidate.country) && (!profile.targetDegreeLevel || candidate.degreeLevel === profile.targetDegreeLevel));
  if (candidate.verifiedProgramme.sourceType !== "official" || candidate.verifiedProgramme.officialProgrammeUrl !== candidate.officialProgrammeUrl) return false;
  if (!candidate.sources.length || candidate.sources.some(source => source.sourceType !== "official")) return false;
  if (profile && (!profile.targetCountries.includes(candidate.country) || !profile.targetDegreeLevel || candidate.degreeLevel !== profile.targetDegreeLevel)) return false;
  return true;
}

