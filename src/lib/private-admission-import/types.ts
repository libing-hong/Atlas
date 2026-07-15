import "server-only";

export type PrivateWorkbookSheet = {
  index: number;
  name: string;
  rows: Array<Array<string | number | boolean | null>>;
};

export type PrivateWorkbookAdapter = {
  sourceName: string;
  sourceHash: string;
  listSheets(): Promise<Array<{ index: number; name: string }>>;
  readSheet(index: number): Promise<PrivateWorkbookSheet>;
};

export type PrivateAdmissionRuleDraft = {
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
  verificationStatus: "partner_reference" | "needs_official_check" | "outdated";
  encryptedSourceReference: string;
};

export type PrivateImportIssue = {
  sheetName: string;
  row?: number;
  code: "parser_missing" | "unresolved_university" | "ambiguous_rule" | "invalid_average" | "conflicting_rows";
  summary: string;
  evidenceFingerprint?: string;
};

export type PrivateSheetParseResult = {
  rules: PrivateAdmissionRuleDraft[];
  issues: PrivateImportIssue[];
};

export type PrivateSchoolSheetParser = {
  id: string;
  canParse(sheet: Pick<PrivateWorkbookSheet, "name" | "rows">): boolean;
  parse(sheet: PrivateWorkbookSheet, sourceReference: string): Promise<PrivateSheetParseResult>;
};

export type PrivateAdmissionImportRepository = {
  begin(input: { sourceName: string; sourceHash: string; sheetCount: number }): Promise<string>;
  saveRules(importJobId: string, rules: PrivateAdmissionRuleDraft[]): Promise<void>;
  saveIssues(importJobId: string, issues: PrivateImportIssue[]): Promise<void>;
  complete(importJobId: string, result: { importedRules: number; reviewIssues: number; skippedSheets: number }): Promise<void>;
  fail(importJobId: string, message: string): Promise<void>;
};
