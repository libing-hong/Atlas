import type { CourseModule, ProgramContentProfile } from "../program-knowledge";

export type ProgramKnowledgeStatus = "verified" | "partially_verified" | "fetching" | "manual_review" | "source_unavailable";
export type ProgramFieldName =
  | "introduction"
  | "learning_focus"
  | "core_module"
  | "optional_module"
  | "learning_outcome"
  | "practical_component"
  | "career_direction"
  | "target_students"
  | "duration"
  | "teaching_location"
  | "teaching_format"
  | "accreditation";

export type ExtractedProgramField = {
  field: ProgramFieldName;
  value: string;
  sourceUrl: string;
  sourcePageTitle: string;
  sourceText?: string;
  retrievedAt: string;
  confidence: number;
  verificationStatus: "verified" | "needs_review" | "outdated";
};

export type ProgramSourceType = "program_page" | "curriculum_page" | "module_catalogue" | "programme_specification_pdf" | "careers_page";
export type ExtractionMethod = "json_ld" | "static_html" | "browser_rendered" | "pdf" | "manual";

export type ProgramSourceCandidate = {
  url: string;
  type: ProgramSourceType;
  officialDomain: string;
  title?: string;
  intakeYear?: number;
  confidence: number;
  discoveryMethod: "registered" | "sitemap" | "official_search" | "linked_document";
};

export type ProgramDiscoveryInput = {
  programId: string;
  universityName: string;
  programName: string;
  degreeType: string;
  campus?: string;
  intakeYear?: number;
  officialDomains: string[];
  registeredUrls?: string[];
};

export type ProgramContentDraft = Omit<ProgramContentProfile, "verificationStatus" | "coverageStatus" | "sourceRetrievedAt" | "lastVerifiedAt"> & {
  coreModules: CourseModule[];
  optionalModules: CourseModule[];
  fields: ExtractedProgramField[];
};

export type ProgramIngestionJobStatus = "queued" | "discovering" | "fetching" | "extracting" | "validating" | "needs_review" | "published" | "failed";

export type ProgramIngestionJob = {
  id: string;
  programId: string;
  status: ProgramIngestionJobStatus;
  trigger: "preload" | "on_demand" | "scheduled_refresh" | "manual_retry";
  priority: number;
  attempts: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
};

export type BrowserRenderAdapter = {
  render(url: string): Promise<{ html: string; title: string }>;
};

export type PdfExtractionAdapter = {
  extract(url: string): Promise<{ text: string; title: string }>;
};

export type ChineseSummaryAdapter = {
  summarize(input: { programName: string; fields: ExtractedProgramField[] }): Promise<{
    introduction: string;
    learningFocus: string[];
    learningOutcomes: string[];
    careerDirections: string[];
  }>;
};
