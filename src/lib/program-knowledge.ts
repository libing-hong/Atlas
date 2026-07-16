export type KnowledgeCoverageStatus = "verified" | "partially_verified" | "fetching" | "manual_review" | "source_unavailable" | "not_available";
export type ProgramVerificationStatus = "verified_official" | "partially_verified" | "pending_review" | "outdated";
export type CourseModuleType = "core" | "optional" | "project" | "internship" | "dissertation";

export type CourseModule = {
  code?: string;
  name: string;
  credits?: number;
  type: CourseModuleType;
};

export type ProgramContentProfile = {
  programId: string;
  introduction: string;
  targetStudents?: string;
  learningFocus: string[];
  coreModules: CourseModule[];
  optionalModules: CourseModule[];
  learningOutcomes: string[];
  practicalComponents: string[];
  careerDirections: string[];
  durationOptions?: Array<{ label: string; months?: number; description?: string }>;
  accreditation?: string[];
  teachingLocation?: string;
  teachingFormat?: string;
  officialProgramUrl: string;
  officialCurriculumUrl?: string;
  sourceRetrievedAt: string;
  lastVerifiedAt: string;
  verificationStatus: ProgramVerificationStatus;
  coverageStatus: KnowledgeCoverageStatus;
};

const pending = "Atlas 正在核实该专业的最新官方信息。";
const notSpecified = "官网未明确说明";

const profiles: Record<string, ProgramContentProfile> = {};

export function getProgramContent(programId: string): ProgramContentProfile | undefined {
  return profiles[programId];
}

export function listProgramContent(): ProgramContentProfile[] {
  return Object.values(profiles);
}

export function programKnowledgeStatusCopy(status: KnowledgeCoverageStatus) {
  if (status === "verified") return "官方信息已核实";
  if (status === "partially_verified") return "官方信息已部分核实";
  if (status === "fetching") return "Atlas 正在核实最新官方信息";
  if (status === "manual_review") return "该专业需要进一步人工确认";
  if (status === "source_unavailable" || status === "not_available") return "暂未获得可靠的官方公开信息";
  return "暂未获得可靠公开信息";
}

export const programKnowledgeFallback = {
  pending,
  notSpecified
};



