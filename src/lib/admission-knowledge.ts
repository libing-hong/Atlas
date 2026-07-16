export type KnowledgeCoverageStatus = "verified" | "partially_verified" | "fetching" | "manual_review" | "not_available";
export type RequirementKind = "degree" | "grade" | "academic_background" | "language" | "work_experience" | "prerequisite_courses" | "test" | "documents" | "interview" | "other";
export type InstitutionEligibilityStatus = "accepted" | "not_found" | "needs_manual_review" | "not_checked";

export type OfficialSource = {
  id: string;
  url: string;
  title: string;
  sourceType: "program_page" | "admission_page" | "country_equivalence_page" | "institution_list" | "language_page" | "application_page" | "curriculum_page";
  retrievedAt: string;
  lastCheckedAt: string;
  official: true;
};

export type ProgramRequirement = {
  id: string;
  kind: RequirementKind;
  label: string;
  officialRequirement: string;
  userSituation: string;
  status: "meets" | "mostly_meets" | "needs_confirmation" | "gap_detected" | "unknown";
  sourceId: string;
  explanation?: string;
};

export type ProgramRequirementSet = {
  id: string;
  institutionId: string;
  programId: string;
  intakeYear: number;
  intakeTerm: "spring" | "summer" | "fall";
  applicantCountry: string;
  coverageStatus: KnowledgeCoverageStatus;
  lastVerifiedAt: string;
  sources: OfficialSource[];
  requirements: ProgramRequirement[];
  institutionEligibility?: { status: InstitutionEligibilityStatus; institutionName: string; note: string; sourceId: string };
};

const checkedAt = "2026-07-14";

const source = (id: string, url: string, title: string, sourceType: OfficialSource["sourceType"]): OfficialSource => ({ id, url, title, sourceType, retrievedAt: checkedAt, lastCheckedAt: checkedAt, official: true });

export const admissionKnowledge: Record<string, ProgramRequirementSet> = {};

export function getAdmissionKnowledge(schoolId: string) {
  return admissionKnowledge[schoolId];
}



