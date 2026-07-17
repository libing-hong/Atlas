import type { CrossDisciplinePreference, LanguageTest } from "../student-profile";

export type VerificationStatus = "verified" | "partially_verified" | "pending" | "unavailable";
export type AssessmentStatus = "meets" | "does_not_meet" | "pending";
export type FieldRelation = "synonym" | "highly_related" | "adjacent" | "cross_discipline";
export type RecommendationBand = "reach" | "target" | "safer" | "needs_confirmation" | "currently_not_suitable";
export type EntityType = "official_programme" | "official_institution" | "programme_directory" | "article" | "blog" | "book" | "marketplace" | "news" | "association" | "aggregator" | "unknown";
export type RejectionReason = "NOT_A_PROGRAMME" | "NOT_AN_INSTITUTION" | "NON_OFFICIAL_SOURCE" | "COUNTRY_NOT_SELECTED" | "WRONG_DEGREE_LEVEL" | "INSTITUTION_NOT_VERIFIED" | "PROGRAMME_NOT_VERIFIED" | "MISSING_PROGRAMME_NAME" | "MISSING_INSTITUTION_NAME" | "DUPLICATE_RESULT";
export type DegreeLevel = "bachelor" | "master" | "doctorate";
export type SourceEvidence = { sourceUrl: string; retrievedAt: string; verificationStatus: VerificationStatus; fields: string[]; sourceType: "official" };
export type VerifiedField<T> = { value: T | null; sourceUrl: string | null; retrievedAt: string; verificationStatus: VerificationStatus };

export type UnderstoodProfile = {
  educationCountry: string | null; institution: string | null; degreeLevel: string | null; targetDegreeLevel: DegreeLevel | null; undergraduateMajor: string | null;
  grade: number | null; gradeSystem: string | null; targetCountries: string[]; targetField: string | null;
  intakeYear: number | null; intakeTerm: string | null; languageTests: LanguageTest[]; maxAnnualTuition: number | null;
  tuitionCurrency: string | null; crossDisciplinePreference: CrossDisciplinePreference; plannedApplicationCount: number;
};

export type FieldExpansion = { term: string; locale: string; relation: FieldRelation };
export type ProgrammeLead = {
  url: string; searchTitle: string; snippet: string | null; entityType: EntityType; fieldRelation: FieldRelation;
  discoveryQuery: string; discoveredAt: string;
};
export type InstitutionVerification = { institutionVerified: boolean; institutionName: string | null; country: string | null; officialRootDomain: string | null };
export type ProgrammeVerification = { programmeVerified: boolean; programmeName: string | null; degreeType: string | null; degreeLevel: DegreeLevel | null; campus: string | null; hasAdmissionsInformation: boolean; officialProgrammeUrl: string | null };
export type VerifiedProgramme = {
  institutionName: string; programmeName: string; country: string; officialProgrammeUrl: string; officialRootDomain: string;
  degreeType: string; degreeLevel: DegreeLevel; campus: VerifiedField<string>; fieldRelation: FieldRelation; sourceType: "official";
  active: VerifiedField<boolean>; intake: VerifiedField<string>; teachingLanguage: VerifiedField<string>; degreeRequirement: VerifiedField<string>;
  subjectRequirement: VerifiedField<string>; gradeRequirement: VerifiedField<string>; languageRequirement: VerifiedField<string>;
  tuition: VerifiedField<number>; tuitionCurrency: VerifiedField<string>; deadline: VerifiedField<string>; applicationUrl: VerifiedField<string>;
  discoveryQuery: string; discoveredAt: string;
};
export type RejectedProgrammeLead = { lead: ProgrammeLead; reasons: RejectionReason[]; institutionVerification?: InstitutionVerification; programmeVerification?: ProgrammeVerification };
export type ProgrammeCandidate = {
  institution: string; programme: string; institutionName: string; programmeName: string; country: string; degreeLevel: DegreeLevel;
  officialUrl: string; officialProgrammeUrl: string; fieldRelation: FieldRelation;
  academicStatus: AssessmentStatus; languageStatus: AssessmentStatus; budgetStatus: AssessmentStatus; timelineStatus: AssessmentStatus;
  verificationStatus: VerificationStatus; missingInformation: string[]; sources: SourceEvidence[]; matchExplanation: string;
  recommendationBand: RecommendationBand; score: number; verifiedProgramme: VerifiedProgramme;
};
export type OrchestratorStage = "profile_understanding" | "field_expansion" | "internal_search" | "programme_discovery" | "entity_verification" | "official_verification" | "eligibility_assessment" | "ranking" | "supervisor" | "complete";
export type OrchestratorEvent = { stage: OrchestratorStage; label: string; status: "running" | "completed"; detail?: string };
export type RecommendationDebug = { initialCandidates: number; afterCountryFilter: number; afterDegreeFilter: number; afterSubjectMatch: number; afterEligibilityCheck: number; afterValidation: number };
export type OrchestratorResult = { profile: UnderstoodProfile; expansions: FieldExpansion[]; candidates: ProgrammeCandidate[]; reviewQueue: RejectedProgrammeLead[]; events: OrchestratorEvent[]; fallbackLevel: number; emptyReason?: string; debug: RecommendationDebug; supervisor: { sufficient: boolean; issues: string[]; discoveryPasses: number } };

