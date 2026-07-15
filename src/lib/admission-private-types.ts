import "server-only";

export type InstitutionAdmissionRule = {
  targetUniversityId: string;
  facultyName?: string;
  programId?: string;
  ruleType:
    | "explicit_institution_list"
    | "tier_list"
    | "985_211_double_first_class"
    | "key_non_key_institution"
    | "all_recognized_institutions"
    | "case_by_case"
    | "program_specific";
  acceptedInstitutionId?: string;
  institutionTier?: string;
  requiredAverage?: number;
  requiredAverageMax?: number;
  sourceYear?: number;
  verificationStatus: "partner_reference" | "verified_official" | "needs_official_check" | "outdated";
  confidential: true;
};

export type InstitutionEligibilityResponse = {
  status: "accepted" | "not_found" | "needs_confirmation";
  explanation: string;
  sourceFreshness: "current" | "outdated" | "unknown";
};

// Confidential source rows must only be imported by server-side jobs and repositories.
// Browser responses may return one student/program decision, never the underlying list or tier dataset.
