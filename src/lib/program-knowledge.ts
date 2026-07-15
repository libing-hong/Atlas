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

const profiles: Record<string, ProgramContentProfile> = {
  "exeter-marketing": {
    programId: "exeter-marketing",
    introduction: "该项目将市场营销作为连接组织战略、跨部门协作与顾客价值创造的核心商业活动，兼顾营销理论、研究能力与实际管理技能。学生可通过必修和选修课程形成品牌、消费者、数字营销或创新方向的个性化学习组合。",
    targetStudents: "面向应届毕业生、营销从业者及希望转入营销职业的人群；学校公开说明接受不同本科专业背景。",
    learningFocus: ["市场战略", "消费者行为", "整合营销传播", "营销研究", "品牌与创新", "数字营销"],
    coreModules: [
      { code: "BEMM103", name: "Advanced Marketing Seminars", credits: 15, type: "core" },
      { code: "BEMM115", name: "Marketing Analysis and Research", credits: 15, type: "core" },
      { code: "BEMM148", name: "Marketing Strategy", credits: 15, type: "core" },
      { code: "BEMM166", name: "Integrated Marketing Communications", credits: 15, type: "core" },
      { code: "BEMM869", name: "Consumer Behaviour in Contemporary Markets", credits: 15, type: "core" },
      { code: "BEMM215", name: "Marketing in Practice", credits: 30, type: "project" }
    ],
    optionalModules: [
      { code: "BEMM069", name: "Marketing and New Product Innovation", credits: 15, type: "optional" },
      { code: "BEMM128", name: "Brand Design", credits: 15, type: "optional" },
      { code: "BEMM190", name: "Digital Transformation", credits: 15, type: "optional" },
      { code: "BEMM778", name: "Applied Digital Marketing Analytics", credits: 15, type: "optional" },
      { code: "BEMM782", name: "Digital Marketing Planning", credits: 15, type: "optional" },
      { code: "BEMM827", name: "Marketing Technologies", credits: 15, type: "optional" }
    ],
    learningOutcomes: ["运用营销战略支持组织目标", "开展营销研究与分析", "理解消费者行为", "形成品牌和传播方案", "提升领导与沟通能力", "对商业问题进行批判性和创造性分析"],
    practicalComponents: ["12 个月路径可选择 Marketing in Practice 商业项目或 Dissertation", "教学包含项目工作与现实商业情境应用", "另有 2 年制 Industrial Experience 路径"],
    careerDirections: ["营销咨询", "品牌管理", "市场研究", "企业传播", "数字营销", "产品与创新营销"],
    durationOptions: [
      { label: "9 个月全日制", months: 9, description: "以授课模块完成 180 学分" },
      { label: "12 个月全日制", months: 12, description: "含 Dissertation 或 Marketing in Practice" },
      { label: "2 年全日制（Industrial Experience）", months: 24, description: "包含第二年行业实践" }
    ],
    accreditation: ["Chartered Institute of Marketing (CIM)"],
    teachingLocation: "Streatham Campus, Exeter",
    teachingFormat: "全日制；大学校内授课，包含研究导向教学与项目实践",
    officialProgramUrl: "https://www.exeter.ac.uk/masters-degrees/msc-marketing/",
    officialCurriculumUrl: "https://www.exeter.ac.uk/masters-degrees/msc-marketing/#course-content",
    sourceRetrievedAt: "2026-07-15",
    lastVerifiedAt: "2026-07-15",
    verificationStatus: "verified_official",
    coverageStatus: "verified"
  },
  "leeds-marketing": {
    programId: "leeds-marketing",
    introduction: "该项目围绕国际营销决策、市场分析和跨文化商业环境展开；Atlas 已核实部分公开内容，完整课程名称仍在更新。",
    learningFocus: ["国际营销分析", "跨文化市场策略", "营销决策", "商业问题解决"],
    coreModules: [],
    optionalModules: [],
    learningOutcomes: ["分析国际市场问题", "运用数据支持营销决策", "在跨文化环境中表达商业方案"],
    practicalComponents: ["Global Industry Programme（具体安排以当年官网为准）"],
    careerDirections: ["国际市场营销", "品牌与市场分析", "跨境业务", "商业发展"],
    durationOptions: [{ label: "1 年全日制", months: 12 }],
    teachingLocation: "Leeds, United Kingdom",
    teachingFormat: "全日制授课型硕士",
    officialProgramUrl: "https://courses.leeds.ac.uk/7652/international-marketing-management-msc",
    sourceRetrievedAt: "2026-07-14",
    lastVerifiedAt: "2026-07-14",
    verificationStatus: "partially_verified",
    coverageStatus: "partially_verified"
  },
  "birmingham-business": {
    programId: "birmingham-business",
    introduction: pending,
    learningFocus: ["国际商务", "跨文化管理"],
    coreModules: [],
    optionalModules: [],
    learningOutcomes: [],
    practicalComponents: [notSpecified],
    careerDirections: [],
    durationOptions: [{ label: "1 年全日制", months: 12 }],
    teachingLocation: "Birmingham, United Kingdom",
    teachingFormat: "全日制授课型硕士",
    officialProgramUrl: "https://www.birmingham.ac.uk/study/postgraduate/subjects/business-and-management-courses/international-business-msc",
    sourceRetrievedAt: "2026-07-14",
    lastVerifiedAt: "2026-07-14",
    verificationStatus: "pending_review",
    coverageStatus: "fetching"
  },
  "essec-management": {
    programId: "essec-management",
    introduction: "该项目提供 Flexible 与 Intensive 学习路径。Atlas 已确认路径结构，但各路径完整课程清单仍需继续核验。",
    learningFocus: ["综合管理", "国际管理", "战略与商业发展"],
    coreModules: [],
    optionalModules: [],
    learningOutcomes: ["建立综合管理基础", "形成国际化商业视角"],
    practicalComponents: [notSpecified],
    careerDirections: ["综合管理", "战略与商业发展", "国际业务"],
    durationOptions: [{ label: "Flexible Track", description: "时长依个人路径而定" }, { label: "Intensive Track", months: 12 }],
    teachingLocation: "Cergy / Singapore / Rabat（以录取路径为准）",
    teachingFormat: "全日制；学习结构取决于所选路径",
    officialProgramUrl: "https://www.essec.edu/en/program/master-in-management-international/?tab=admissions",
    sourceRetrievedAt: "2026-07-14",
    lastVerifiedAt: "2026-07-14",
    verificationStatus: "partially_verified",
    coverageStatus: "partially_verified"
  }
};

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
