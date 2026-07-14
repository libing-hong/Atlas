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

export const admissionKnowledge: Record<string, ProgramRequirementSet> = {
  "leeds-marketing": {
    id: "req-leeds-marketing-2027-fall-cn", institutionId: "university-of-leeds", programId: "leeds-marketing", intakeYear: 2027, intakeTerm: "fall", applicantCountry: "CN", coverageStatus: "partially_verified", lastVerifiedAt: checkedAt,
    sources: [
      source("leeds-entry", "https://business.leeds.ac.uk/masters/doc/entry-requirements-2/page/1", "Leeds University Business School Entry requirements", "admission_page"),
      source("leeds-language", "https://business.leeds.ac.uk/masters/doc/english-language-requirements-2/", "Leeds University Business School English language requirements", "language_page"),
      source("leeds-cn-list", "https://business.leeds.ac.uk/masters/doc/accepted-chinese-institutions", "Accepted Chinese institutions", "institution_list"),
    ],
    requirements: [
      { id: "leeds-degree", kind: "degree", label: "学位要求", officialRequirement: "英国 2:1 荣誉学位或国际同等学历。", userSituation: "已提供本科教育背景，仍需结合最终学历证明核对。", status: "needs_confirmation", sourceId: "leeds-entry" },
      { id: "leeds-background", kind: "academic_background", label: "本科专业背景", officialRequirement: "MSc Marketing Management with Advertising 接受任何本科专业。", userSituation: "当前专业方向与市场营销相关。", status: "meets", sourceId: "leeds-entry" },
      { id: "leeds-language", kind: "language", label: "英语成绩", officialRequirement: "IELTS 总分 6.5，单项不低于 6.0；学校同时列出 PTE、TOEFL 等替代考试要求。", userSituation: "已检测到英语成绩，仍需核对考试类型、单项和有效期。", status: "needs_confirmation", sourceId: "leeds-language" },
      { id: "leeds-grade", kind: "grade", label: "中国院校成绩标准", officialRequirement: "中国申请者的成绩要求需要结合 Leeds Business School 接受的中国院校名单和对应分数档位核对。", userSituation: "本科院校信息已填写，尚未完成院校名单与分数档位匹配。", status: "needs_confirmation", sourceId: "leeds-cn-list", explanation: "未完成院校档位核验前，不直接判断是否符合。" },
      { id: "leeds-work", kind: "work_experience", label: "工作或实习经历", officialRequirement: "官网未明确要求必须有工作经历。", userSituation: "已有经历记录，可用于申请材料叙事。", status: "meets", sourceId: "leeds-entry" },
      { id: "leeds-documents", kind: "documents", label: "申请材料", officialRequirement: "通常需要成绩单、学历证明、个人陈述、CV、推荐信和英语成绩等，最终以申请页面要求为准。", userSituation: "部分通用材料已检测到。", status: "needs_confirmation", sourceId: "leeds-entry" },
    ],
    institutionEligibility: { status: "needs_manual_review", institutionName: "Shenzhen University", note: "需要在官方中国院校名单中进一步核对英文名称与分数档位。", sourceId: "leeds-cn-list" },
  },
  "birmingham-business": {
    id: "req-birmingham-business-2027-fall-cn", institutionId: "university-of-birmingham", programId: "birmingham-business", intakeYear: 2027, intakeTerm: "fall", applicantCountry: "CN", coverageStatus: "verified", lastVerifiedAt: checkedAt,
    sources: [source("birmingham-program", "https://www.birmingham.ac.uk/study/postgraduate/subjects/business-and-management-courses/international-business-msc", "University of Birmingham International Business MSc", "program_page")],
    requirements: [
      { id: "birmingham-degree", kind: "degree", label: "学位要求", officialRequirement: "Honours degree 2:1 或更高，或 postgraduate diploma。", userSituation: "已提供本科教育背景，需核对最终成绩与学历等同性。", status: "needs_confirmation", sourceId: "birmingham-program" },
      { id: "birmingham-language", kind: "language", label: "英语成绩", officialRequirement: "IELTS 6.5，单项不低于 6.0；官网同时列出 TOEFL、PTE、Cambridge 和 LanguageCert 等替代方式。", userSituation: "已检测到英语成绩，需核对考试类型和单项。", status: "needs_confirmation", sourceId: "birmingham-program" },
      { id: "birmingham-background", kind: "academic_background", label: "本科专业背景", officialRequirement: "该页面未列出必须的本科专业背景。", userSituation: "当前专业方向与商科申请目标相关。", status: "meets", sourceId: "birmingham-program" },
      { id: "birmingham-work", kind: "work_experience", label: "工作或实习经历", officialRequirement: "官网未明确要求必须有工作经历。", userSituation: "已有经历记录。", status: "meets", sourceId: "birmingham-program" },
    ],
  },
  "essec-management": {
    id: "req-essec-management-2027-fall-cn", institutionId: "essec-business-school", programId: "essec-management", intakeYear: 2027, intakeTerm: "fall", applicantCountry: "CN", coverageStatus: "verified", lastVerifiedAt: checkedAt,
    sources: [source("essec-admission", "https://www.essec.edu/en/program/master-in-management-international/?tab=admissions", "ESSEC Master in Management admissions", "admission_page")],
    requirements: [
      { id: "essec-degree", kind: "degree", label: "学位要求", officialRequirement: "非法国三年制 Bachelor 或同等学历，接受不同学科背景。", userSituation: "已提供本科教育背景，需确认学制和最终学历证明。", status: "needs_confirmation", sourceId: "essec-admission" },
      { id: "essec-test", kind: "test", label: "管理类考试", officialRequirement: "需要 1 项管理类考试成绩，例如 GMAT、GRE、TAGE MAGE 或符合条件的 CAT。", userSituation: "尚未检测到管理类考试成绩。", status: "gap_detected", sourceId: "essec-admission", explanation: "建议先确认申请路径和考试计划。" },
      { id: "essec-language", kind: "language", label: "英语成绩", officialRequirement: "IELTS Academic 最低 6.5；官网列出 TOEFL、TOEIC、Cambridge 等替代方式，部分全英文高等教育经历可申请豁免。", userSituation: "已检测到英语成绩，仍需确认是否满足当前申请轮次要求。", status: "needs_confirmation", sourceId: "essec-admission" },
      { id: "essec-work", kind: "work_experience", label: "工作或实习经历", officialRequirement: "Intensive 1-year Track 要求累计至少 6 个月相关专业经历，实习和学徒经历可计入；Flexible Track 可无研究生工作经历申请。", userSituation: "已记录部分经历，需确认申请 Track。", status: "needs_confirmation", sourceId: "essec-admission" },
      { id: "essec-documents", kind: "documents", label: "申请材料", officialRequirement: "包括 CV、学历和成绩单、推荐信、管理类考试、英语成绩、身份证明等。", userSituation: "通用材料部分已检测到。", status: "needs_confirmation", sourceId: "essec-admission" },
    ],
  },
  "exeter-marketing": {
    id: "req-exeter-marketing-2027-fall-cn", institutionId: "university-of-exeter", programId: "exeter-marketing", intakeYear: 2027, intakeTerm: "fall", applicantCountry: "CN", coverageStatus: "partially_verified", lastVerifiedAt: checkedAt,
    sources: [source("exeter-program", "https://www.exeter.ac.uk/masters-degrees/msc-marketing/", "University of Exeter MSc Marketing", "program_page")],
    requirements: [
      { id: "exeter-degree", kind: "degree", label: "学位要求", officialRequirement: "2:2 Honours degree，任何学科均可；相关课程表现、工作经历或专业资格也会被考虑。", userSituation: "已提供本科教育背景，需核对最终学历等同性。", status: "needs_confirmation", sourceId: "exeter-program" },
      { id: "exeter-background", kind: "academic_background", label: "本科专业背景", officialRequirement: "任何本科专业均可，相关课程表现可能被纳入评估。", userSituation: "当前专业方向与市场营销相关。", status: "meets", sourceId: "exeter-program" },
      { id: "exeter-language", kind: "language", label: "英语成绩", officialRequirement: "当前专业页面未在摘要中列出具体语言分数，官网要求需进一步核对。", userSituation: "已检测到英语成绩。", status: "needs_confirmation", sourceId: "exeter-program", explanation: "官网未明确要求，不将其推断为具体分数。" },
      { id: "exeter-work", kind: "work_experience", label: "工作或实习经历", officialRequirement: "官网未明确要求必须有工作经历，但相关经历可能被纳入申请评估。", userSituation: "已有经历记录。", status: "meets", sourceId: "exeter-program" },
    ],
  },
};

export function getAdmissionKnowledge(schoolId: string) {
  return admissionKnowledge[schoolId];
}
