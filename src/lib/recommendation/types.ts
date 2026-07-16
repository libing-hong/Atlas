import type { CrossDisciplinePreference, LanguageTest } from "../student-profile";

export type VerificationStatus = "verified" | "partially_verified" | "pending" | "unavailable";
export type AssessmentStatus = "meets" | "does_not_meet" | "pending";
export type FieldRelation = "synonym" | "highly_related" | "adjacent" | "cross_discipline";
export type RecommendationBand = "reach" | "target" | "safer" | "needs_confirmation" | "currently_not_suitable";
export type SourceEvidence = { sourceUrl: string; retrievedAt: string; verificationStatus: VerificationStatus; fields: string[] };
export type VerifiedField<T> = { value: T | null; sourceUrl: string | null; retrievedAt: string; verificationStatus: VerificationStatus };

export type UnderstoodProfile = {
  educationCountry: string | null; institution: string | null; degreeLevel: string | null; undergraduateMajor: string | null;
  grade: number | null; gradeSystem: string | null; targetCountries: string[]; targetField: string | null;
  intakeYear: number | null; intakeTerm: string | null; languageTests: LanguageTest[]; maxAnnualTuition: number | null;
  tuitionCurrency: string | null; crossDisciplinePreference: CrossDisciplinePreference; plannedApplicationCount: number;
};

export type FieldExpansion = { term: string; locale: string; relation: FieldRelation };
export type DiscoveredProgramme = { institution: string; programme: string; officialUrl: string; fieldRelation: FieldRelation; discoveryQuery: string; discoveredAt: string };
export type VerifiedProgramme = DiscoveredProgramme & {
  active: VerifiedField<boolean>; intake: VerifiedField<string>; teachingLanguage: VerifiedField<string>; degreeRequirement: VerifiedField<string>;
  subjectRequirement: VerifiedField<string>; gradeRequirement: VerifiedField<string>; languageRequirement: VerifiedField<string>;
  campus: VerifiedField<string>; tuition: VerifiedField<number>; tuitionCurrency: VerifiedField<string>; deadline: VerifiedField<string>;
  applicationUrl: VerifiedField<string>;
};
export type ProgrammeCandidate = {
  institution: string; programme: string; officialUrl: string; fieldRelation: FieldRelation;
  academicStatus: AssessmentStatus; languageStatus: AssessmentStatus; budgetStatus: AssessmentStatus; timelineStatus: AssessmentStatus;
  verificationStatus: VerificationStatus; missingInformation: string[]; sources: SourceEvidence[]; matchExplanation: string;
  recommendationBand: RecommendationBand; score: number; verifiedProgramme: VerifiedProgramme;
};
export type OrchestratorStage = "profile_understanding" | "field_expansion" | "internal_search" | "programme_discovery" | "official_verification" | "eligibility_assessment" | "ranking" | "supervisor" | "complete";
export type OrchestratorEvent = { stage: OrchestratorStage; label: string; status: "running" | "completed"; detail?: string };
export type OrchestratorResult = { profile: UnderstoodProfile; expansions: FieldExpansion[]; candidates: ProgrammeCandidate[]; events: OrchestratorEvent[]; supervisor: { sufficient: boolean; issues: string[]; discoveryPasses: number } };


