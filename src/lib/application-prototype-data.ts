import { formatCNY } from "./format-currency";
import { getAdmissionKnowledge } from "./admission-knowledge";

export type ApplicationHomeState =
  | "report_missing"
  | "report_ready"
  | "school_confirmed"
  | "materials_ready"
  | "service_purchased"
  | "waiting_confirmation"
  | "submitted"
  | "supplement_required"
  | "offer_received";

export type RecommendationCategory = "reach" | "target" | "safer" | "manual_review" | "currently_not_eligible";

export type ApplicationRecordStatus = "materials_in_progress" | "ready_to_apply" | "manual_review" | "submitted" | "waiting_result" | "supplement_required" | "offer_received";

export type MaterialPreparationStatus = "prepared" | "uploading" | "processing" | "needs_confirmation" | "review_required" | "not_detected" | "not_required" | "rejected";

export type RequirementStatus = "meets" | "mostly_meets" | "needs_confirmation" | "gap_detected" | "unknown";

export type AdmissionRequirement = {
  id: string;
  label: string;
  schoolRequirement: string;
  userSituation: string;
  status: RequirementStatus;
  officialProgramUrl?: string;
  sourceTitle?: string;
  lastVerifiedAt?: string;
  sourceId?: string;
};

export type ApplicationMaterial = {
  id: string;
  name: string;
  status: MaterialPreparationStatus;
  reusableFor: string[];
  note: string;
};

export type ApplicationRecord = {
  id: string;
  schoolRecommendationId: string;
  universityName: string;
  programName: string;
  country: string;
  intake: string;
  status: ApplicationRecordStatus;
  detectedMaterialCount: number;
  preparedMaterials: number;
  totalMaterials: number;
  missingMaterials: string[];
  applicationProgress: number;
  nextAction: string;
  nextDeadline?: string;
  serviceType: "none" | "single_school" | "full_service";
};

export type SchoolRecommendation = {
  id: string;
  universityId: string;
  universityName: string;
  programName: string;
  country: string;
  city: string;
  intake: string;
  duration: string;
  tuition: number;
  currency: string;
  deadline: string;
  deadlineType: "official" | "estimated" | "rolling";
  category: RecommendationCategory;
  reasons: string[];
  matchedRequirements: string[];
  risks: string[];
  requirements: string[];
  admissionRequirements?: AdmissionRequirement[];
  materialsReady: number;
  materialsTotal: number;
  isSelected: boolean;
  isConfirmed: boolean;
  qsOverallRanking?: { rank?: number; displayText: string; year: number; sourceUrl?: string };
  qsSubjectRanking?: { subject: string; rank?: number; displayText: string; year: number; sourceUrl?: string };
  programIntroduction?: string;
  representativeModules?: string[];
  fullCurriculumUrl?: string;
  officialProgramUrl?: string;
  programDetails?: {
    introduction?: string;
    directions?: string[];
    coreCourses?: string[];
    electiveCourses?: string[];
    learningOutcomes?: string[];
    teachingLocation?: string;
    teachingFormat?: string;
    practicalProjects?: string[];
    careerDirections?: string[];
  };
  atlasMatch?: {
    score: number;
    eligibilityStatus: "eligible" | "mostly_eligible" | "needs_confirmation" | "currently_not_eligible";
    matchedItems: string[];
    preparationItems: string[];
    unresolvedItems: string[];
  };
  recommendationContent: {
    summary: string;
    personalFit: string;
    schoolHighlights: string;
    programHighlights: string;
    cautions: string[];
    sources: Array<{ label: string; url: string }>;
  };
  applicationUrl?: string;
  applicationUrlType?: "direct_program_application" | "university_application_portal" | "central_application_system" | "application_instruction_page";
  applicationProvider?: "university" | "UCAS" | "Campus France" | "Mon Master" | "other_official_system";
  applicationRoute?: string;
  applicationSourceDomain?: string;
  applicationLinkVerifiedAt?: string;
  applicationLinkStatus: "verified" | "needs_review" | "temporarily_unavailable" | "expired";
  applicationNotes?: string;
};

export const applicationProfile = {
  intake: "2027 秋季",
  targetCountries: ["英国", "法国"],
  targetSubjects: ["市场营销", "国际商务"],
  budget: "20,000 - 35,000 英镑 / 年",
  analysisCompleted: true,
  schoolListConfirmed: false,
  applicationWorkspacePurchased: false,
  consultationPurchased: false,
};

export const commonMaterials = [
  { id: "passport", name: "护照扫描件", note: "可用于多所学校的身份核验", reusableFor: ["all"] },
  { id: "transcript", name: "本科成绩单", note: "可复用于不同学校的学术材料要求", reusableFor: ["all"] },
  { id: "degree", name: "学位证明", note: "部分学校需要同时上传毕业证明", reusableFor: ["all"] },
  { id: "english", name: "英语语言成绩", note: "请确认成绩仍在学校接受期限内", reusableFor: ["all"] },
  { id: "cv", name: "基础 CV", note: "学校定制版本仍可能需要调整", reusableFor: ["all"] },
];

export function createApplicationRecord(school: SchoolRecommendation): ApplicationRecord {
  const missingMaterials = school.requirements.filter((item) => !["本科成绩单", "英语语言成绩"].includes(item));
  return {
    id: `app-${school.id}`,
    schoolRecommendationId: school.id,
    universityName: school.universityName,
    programName: school.programName,
    country: school.country,
    intake: school.intake,
    status: "materials_in_progress",
    detectedMaterialCount: school.materialsReady,
    preparedMaterials: school.materialsReady,
    totalMaterials: school.materialsTotal,
    missingMaterials,
    applicationProgress: Math.round((school.materialsReady / school.materialsTotal) * 45),
    nextAction: `开始准备 ${school.universityName} 的申请材料`,
    nextDeadline: school.deadline,
    serviceType: "none",
  };
}

export function getAdmissionRequirements(school: SchoolRecommendation): AdmissionRequirement[] {
  const knowledge = getAdmissionKnowledge(school.id);
  if (knowledge) {
    return knowledge.requirements.map((item) => ({ id: item.id, label: item.label, schoolRequirement: item.officialRequirement, userSituation: item.userSituation, status: item.status, officialProgramUrl: knowledge.sources.find((source) => source.id === item.sourceId)?.url, sourceId: item.sourceId, sourceTitle: knowledge.sources.find((source) => source.id === item.sourceId)?.title, lastVerifiedAt: knowledge.lastVerifiedAt }));
  }
  return school.admissionRequirements ?? [
    { id: "degree", label: "学位要求", schoolRequirement: "认可的本科或同等学历", userSituation: "已提供本科教育背景", status: "meets" },
    { id: "academic", label: "成绩或 GPA 要求", schoolRequirement: "需要达到学校公布的成绩要求，具体以官方页面为准", userSituation: "成绩单已检测到，仍需核对学校换算方式", status: "needs_confirmation" },
    { id: "background", label: "本科专业背景", schoolRequirement: `${school.programName} 相关专业或可证明的相关学习经历`, userSituation: "现有专业与目标方向整体相关", status: "mostly_meets" },
    { id: "language", label: "语言成绩", schoolRequirement: "英语语言成绩需符合学校公布的最低标准", userSituation: "已检测到英语成绩，需确认有效期和具体分项", status: "needs_confirmation" },
    { id: "experience", label: "工作或实习经历", schoolRequirement: "学校未明确要求必须有相关工作经历", userSituation: "已有经历可用于个人陈述", status: "meets" },
    { id: "prerequisite", label: "先修课程", schoolRequirement: "部分课程可能要求定量分析或相关基础课程", userSituation: "尚未完成课程逐项核对", status: "unknown" },
    { id: "portfolio", label: "作品集或其他特殊要求", schoolRequirement: "目前未发现必须提交作品集的公开要求", userSituation: "需以最终申请页面再次确认", status: "needs_confirmation" },
  ].map((item) => ({ ...item, status: item.status as RequirementStatus, schoolRequirement: "Atlas 尚未完成该项官方要求核实，请前往专业官网确认。" }));
}

export function getApplicationServiceRecommendation({
  confirmedApplications,
  purchasedServices,
  consultationPurchased,
}: {
  confirmedApplications: ApplicationRecord[];
  purchasedServices: boolean;
  consultationPurchased: boolean;
}) {
  if (purchasedServices) {
    return {
      type: "active_service" as const,
      title: "你的申请服务",
      description: "你已购买申请服务，Atlas 会把学校材料、申请表和递交进度集中管理。",
      cta: "查看服务进度",
      href: "/dashboard/order-application",
      details: ["已购买的服务", "覆盖学校数量", "当前处理状态", "下一步需要你完成的事项"],
    };
  }
  if (confirmedApplications.some((application) => application.country === "法国")) {
    return {
      type: "france_consultation" as const,
      title: "法国申请需要先确认整体方案",
      description: "法国申请可能同时涉及学校申请、Études en France、面试和签证准备。建议先确认整体方案。",
      cta: `预约一对一留学规划 ${formatCNY(299)}／次`,
      href: "/dashboard/order-application?service=consultation",
      details: ["学校申请路径", "Études en France / Campus France", "材料与面试安排", "后续签证准备"],
      notice: consultationPurchased ? "一对一留学规划咨询已预约" : `一对一留学规划咨询 ${formatCNY(299)}／次。`,
    };
  }
  if (confirmedApplications.length >= 2) {
    return {
      type: "multi_school_service" as const,
      title: "你计划申请多所学校",
      description: "多校申请需要分别处理材料要求、申请系统和学校沟通。Atlas 可以统一管理整个申请。",
      cta: "对比申请方案",
      href: "/applications/service-comparison",
      details: ["自助申请", "单校递交服务", "全流程申请服务"],
    };
  }
  if (confirmedApplications.length === 1) {
    return {
      type: "single_school_service" as const,
      title: "不想自己填写申请系统？",
      description: "Atlas 可以帮助你审核材料、填写学校申请系统、正式递交并跟踪学校回复。",
      cta: `购买单校申请递交 ${formatCNY(29.9)}／学校`,
      href: "/dashboard/order-application?service=single-school",
      details: ["人工审核申请材料", "填写学校申请系统", "正式递交并同步申请编号", "跟踪学校回复"],
    };
  }
  return {
    type: "selection_consultation" as const,
    title: "不确定如何选择学校？",
    description: "顾问可以根据你的背景、预算和申请目标，帮助你确认学校组合与申请优先级。",
    cta: `预约一对一留学规划 ${formatCNY(299)}／次`,
    href: "/dashboard/order-application?service=consultation",
    details: ["学校组合建议", "申请优先级", "主要风险说明"],
    notice: `一对一留学规划咨询 ${formatCNY(299)}／次。`,
  };
}

export const recommendations: SchoolRecommendation[] = [
  {
    id: "leeds-marketing",
    universityId: "university-of-leeds",
    universityName: "University of Leeds",
    programName: "MSc International Marketing",
    country: "英国",
    city: "Leeds",
    intake: "2027 秋季",
    duration: "1 年",
    tuition: 28750,
    currency: "GBP",
    deadline: "2027-01-31",
    deadlineType: "official",
    category: "target",
    reasons: ["本科专业与市场营销方向匹配", "工作经历可以转化为申请材料"],
    matchedRequirements: ["学术背景基本符合", "专业方向匹配", "工作经历可用于材料"],
    risks: ["需要准备有针对性的个人陈述", "语言成绩需保持有效"],
    requirements: ["本科成绩单", "英语语言成绩", "个人陈述", "推荐信"],
    materialsReady: 6,
    materialsTotal: 8,
    isSelected: true,
    isConfirmed: false,
    officialProgramUrl: "https://courses.leeds.ac.uk/7652/international-marketing-management-msc",
    programDetails: {
      introduction: "该项目围绕国际营销决策、市场分析与跨文化商业环境展开，课程信息以学校最新专业页面为准。",
      directions: ["国际营销分析", "跨文化市场策略", "营销决策与问题解决"],
      coreCourses: ["课程名称以学校最新课程目录为准"],
      electiveCourses: ["该项公开信息暂未确认"],
      learningOutcomes: ["分析国际市场问题", "运用数据支持营销决策", "在跨文化环境中表达商业方案"],
      teachingLocation: "Leeds, United Kingdom",
      teachingFormat: "全日制授课型硕士",
      practicalProjects: ["学校公开页面提及 Global Industry Programme，具体安排以当年课程为准"],
      careerDirections: ["国际市场营销", "品牌与市场分析", "跨境业务与商业发展"],
    },
    recommendationContent: {
      summary: "你已确认的市场营销本科背景与该项目接受多学科申请者的公开要求相衔接；现有工作经历可用于说明职业动机。Leeds 的课程强调国际营销分析与实践项目，但语言单项和最终材料仍需继续核对。",
      personalFit: "你已确认的本科专业方向与市场营销相关，现有工作经历也可用于个人陈述中解释国际营销兴趣与职业目标。学校公开要求接受不同本科背景，因此重点将落在成绩、语言单项和完整材料质量上。",
      schoolHighlights: "University of Leeds 位于英国 Leeds，是 Russell Group 成员。学校公开信息强调研究型教学、国际学生支持与行业联系。",
      programHighlights: "官方课程页说明项目覆盖国际营销分析、问题解决、数据分析与跨文化沟通，并提供 Global Industry Programme 实践项目机会。",
      cautions: ["IELTS 写作单项仍需确认是否达到要求", "个人陈述和推荐信尚需完成", "最终结果仍以学校官方审核为准"],
      sources: [{ label: "专业官方页面", url: "https://courses.leeds.ac.uk/7652/international-marketing-management-msc" }, { label: "QS 2026", url: "https://www.topuniversities.com/world-university-rankings/2026" }],
    },
    applicationUrl: "https://www.leeds.ac.uk/study/doc/apply-masters-courses",
    applicationUrlType: "application_instruction_page",
    applicationProvider: "university",
    applicationRoute: "University of Leeds Masters applicant portal",
    applicationSourceDomain: "leeds.ac.uk",
    applicationLinkVerifiedAt: "2026-07-14",
    applicationLinkStatus: "verified",
    applicationNotes: "学校官方申请说明页会引导用户进入当前 Masters 申请门户。",
  },
  {
    id: "birmingham-business",
    universityId: "university-of-birmingham",
    universityName: "University of Birmingham",
    programName: "MSc International Business",
    country: "英国",
    city: "Birmingham",
    intake: "2027 秋季",
    duration: "1 年",
    tuition: 30500,
    currency: "GBP",
    deadline: "2027-02-28",
    deadlineType: "official",
    category: "target",
    reasons: ["国际商务方向与职业目标一致", "学校要求和材料准备路径清晰"],
    matchedRequirements: ["专业背景基本符合", "入学时间匹配"],
    risks: ["部分课程需要补充定量分析经历"],
    requirements: ["本科成绩单", "英语语言成绩", "个人陈述", "简历"],
    materialsReady: 5,
    materialsTotal: 8,
    isSelected: false,
    isConfirmed: false,
    officialProgramUrl: "https://www.birmingham.ac.uk/study/postgraduate/subjects/business-and-management-courses/international-business-msc",
    recommendationContent: {
      summary: "你的国际商务与市场营销目标和该项目方向相关，已有经历可用于说明跨文化商业兴趣。Birmingham 的官方申请流程清晰，但当前仍需核对课程细节、定量能力证明和完整材料要求。",
      personalFit: "你已确认的商科与市场营销背景可用于说明申请国际商务的学术延续性；现有工作经历可进一步证明你对跨境业务场景的理解。",
      schoolHighlights: "University of Birmingham 位于英国 Birmingham，是 Russell Group 成员。学校公开资料强调国际学生社区与研究型教学环境。",
      programHighlights: "该项公开课程细节暂未完成核验，请以专业官方页面最新课程结构为准。",
      cautions: ["部分定量分析经历仍需在材料中说明", "课程与截止日期需在提交前再次核对", "最终结果仍以学校官方审核为准"],
      sources: [{ label: "专业官方页面", url: "https://www.birmingham.ac.uk/study/postgraduate/subjects/business-and-management-courses/international-business-msc" }, { label: "QS 2026", url: "https://www.topuniversities.com/world-university-rankings/2026" }],
    },
    applicationUrl: "https://www.birmingham.ac.uk/study/postgraduate/taught/apply",
    applicationUrlType: "application_instruction_page",
    applicationProvider: "university",
    applicationRoute: "University of Birmingham postgraduate admissions portal",
    applicationSourceDomain: "birmingham.ac.uk",
    applicationLinkVerifiedAt: "2026-07-14",
    applicationLinkStatus: "verified",
    applicationNotes: "学校要求从具体课程页进入对应申请表；该链接为官方授课型研究生申请说明。",
  },
  {
    id: "essec-management",
    universityId: "essec-business-school",
    universityName: "ESSEC Business School",
    programName: "Master in Management",
    country: "法国",
    city: "Cergy",
    intake: "2027 秋季",
    duration: "2 年",
    tuition: 26000,
    currency: "EUR",
    deadline: "2027-03-15",
    deadlineType: "estimated",
    category: "reach",
    reasons: ["商学院背景与职业方向高度相关", "法国与英国申请可以形成组合"],
    matchedRequirements: ["管理方向匹配", "国际经历可以用于申请叙事"],
    risks: ["竞争较强", "需要更充分地解释职业目标"],
    requirements: ["本科成绩单", "语言成绩", "动机信", "面试"],
    materialsReady: 4,
    materialsTotal: 8,
    isSelected: false,
    isConfirmed: false,
    officialProgramUrl: "https://www.essec.edu/en/program/master-in-management-international/?tab=admissions",
    programDetails: {
      introduction: "Master in Management 提供 Flexible 与 Intensive 学习路径，具体适用条件与课程安排以 ESSEC 官方页面为准。",
      directions: ["Flexible Track", "Intensive Track", "国际管理"],
      coreCourses: ["核心管理课程名称以当前 Track 的官方课程表为准"],
      electiveCourses: ["Flexible Track 可选择较多个性化课程，具体清单待官方页面确认"],
      learningOutcomes: ["建立综合管理基础", "形成国际化商业视角"],
      teachingLocation: "Cergy / Singapore / Rabat（以录取 Track 为准）",
      teachingFormat: "全日制；学习结构取决于所选 Track",
      practicalProjects: ["该项公开信息暂未确认"],
      careerDirections: ["综合管理", "战略与商业发展", "国际业务"],
    },
    recommendationContent: {
      summary: "你的商科方向和国际经历可用于说明申请 MiM 的动机。ESSEC 提供 Flexible 与 Intensive 两种路径，并强调国际化学习；当前需先确认申请 Track、管理类考试和英语成绩，再判断材料准备重点。",
      personalFit: "你已确认的管理与市场营销方向能够支持 MiM 申请叙事，已有经历也可用于说明国际化职业目标；Intensive Track 是否适用仍取决于专业与国际经历证明。",
      schoolHighlights: "ESSEC 在 Cergy、Singapore 与 Rabat 等地设有学习路径，官方信息强调国际化学生群体和可调整的学习安排。",
      programHighlights: "官方页面显示 Flexible Track 可自定义较多课程，Intensive Track 为一年制结构，并包含核心管理课程、选修课及实践安排。",
      cautions: ["需要确认 Flexible 或 Intensive Track", "管理类考试成绩为必需材料", "QS 世界大学综合排名与学科排名不可混用"],
      sources: [{ label: "专业与招生官方页面", url: "https://www.essec.edu/en/program/master-in-management-international/?tab=admissions" }, { label: "QS 2026", url: "https://www.topuniversities.com/world-university-rankings/2026" }],
    },
    applicationUrl: "https://essec.myapply.online/",
    applicationUrlType: "direct_program_application",
    applicationProvider: "other_official_system",
    applicationRoute: "ESSEC designated online application system",
    applicationSourceDomain: "essec.myapply.online",
    applicationLinkVerifiedAt: "2026-07-14",
    applicationLinkStatus: "verified",
    applicationNotes: "该系统由 ESSEC 专业官方页面的 Apply 链接直接指向。",
  },
  {
    id: "exeter-marketing",
    universityId: "university-of-exeter",
    universityName: "University of Exeter",
    programName: "MSc Marketing",
    country: "英国",
    city: "Exeter",
    intake: "2027 秋季",
    duration: "1 年",
    tuition: 24500,
    currency: "GBP",
    deadline: "滚动录取",
    deadlineType: "rolling",
    category: "safer",
    reasons: ["课程方向贴合市场营销目标", "申请材料要求相对清晰"],
    matchedRequirements: ["专业方向匹配", "预算范围可控"],
    risks: ["仍需学校最终审核"],
    requirements: ["本科成绩单", "英语语言成绩", "个人陈述"],
    materialsReady: 7,
    materialsTotal: 8,
    isSelected: false,
    isConfirmed: false,
    officialProgramUrl: "https://www.exeter.ac.uk/masters-degrees/msc-marketing/",
    recommendationContent: {
      summary: "你的市场营销方向与 MSc Marketing 的学习主题相关，现有经历可用于说明职业动机。Exeter 公开要求接受不同本科背景，但语言要求和具体课程信息仍需结合最新专业页面继续确认。",
      personalFit: "你已确认的市场营销本科方向与目标专业形成直接延续，已有工作或实习记录可用于说明对营销实践的理解。",
      schoolHighlights: "University of Exeter 位于英国 Exeter，是 Russell Group 成员。学校公开信息介绍了其国际学生社区和多校区学习环境。",
      programHighlights: "该项公开课程细节暂未完成核验，请以专业官方页面最新课程结构为准。",
      cautions: ["语言分数要求仍需从最新专业页面核对", "滚动录取建议尽早准备材料", "最终结果仍以学校官方审核为准"],
      sources: [{ label: "专业官方页面", url: "https://www.exeter.ac.uk/masters-degrees/msc-marketing/" }, { label: "QS 2026", url: "https://www.topuniversities.com/world-university-rankings/2026" }],
    },
    applicationUrl: "https://www.exeter.ac.uk/masters-degrees/apply/",
    applicationUrlType: "application_instruction_page",
    applicationProvider: "university",
    applicationRoute: "University of Exeter Masters application system",
    applicationSourceDomain: "exeter.ac.uk",
    applicationLinkVerifiedAt: "2026-07-14",
    applicationLinkStatus: "verified",
    applicationNotes: "学校官方说明页提供新申请者进入 Masters 申请系统的入口。",
  },
];

export const applicationStateCopy: Record<ApplicationHomeState, {
  title: string;
  description: string;
  prepared: string[];
  missing?: string;
  cta: string;
  secondary?: string;
}> = {
  report_missing: {
    title: "完成你的申请规划",
    description: "Atlas 已完成基础背景分析。完整规划将包含推荐学校、申请风险、材料差距和时间安排。",
    prepared: ["基础背景分析", "目标国家与方向整理"],
    cta: "查看完整申请规划",
    secondary: "查看基础分析",
  },
  report_ready: {
    title: "确认你准备申请的学校",
    description: "Atlas 已根据你的背景筛选出 8 所学校，建议最终确认 4–6 所进入正式申请。",
    prepared: ["学校匹配结果", "录取要求对比", "学费与截止日期", "主要申请风险"],
    cta: "查看推荐学校",
    secondary: `预约一对一留学规划 ${formatCNY(299)}／次`,
  },
  school_confirmed: {
    title: "准备第一所学校的申请材料",
    description: "University of Leeds 需要的 8 项材料中，目前已检测到 6 项。",
    prepared: ["学校材料要求", "材料格式说明", "已上传材料初步检查", "可接受的替代材料"],
    missing: "个人陈述、推荐信",
    cta: "继续准备材料",
  },
  materials_ready: {
    title: "University of Leeds 已可以开始申请",
    description: "主要申请材料已经准备完成。你可以自己填写申请，也可以交给 Atlas 完成审核和递交。",
    prepared: ["材料清单已整理", "申请时间安排已生成", "材料复用关系已标记"],
    cta: "选择申请方式",
  },
  service_purchased: {
    title: "Atlas 正在审核你的申请材料",
    description: "团队正在检查材料完整性和申请表信息，完成后会把需要你确认的内容集中发给你。",
    prepared: ["申请表字段整理", "材料完整性检查", "学校递交要求对照"],
    cta: "查看申请进度",
  },
  waiting_confirmation: {
    title: "请确认申请信息",
    description: "Atlas 已完成申请信息整理。正式递交前，请你检查并确认最终内容。",
    prepared: ["申请表草稿", "材料顺序", "学校递交要求"],
    cta: "检查并确认",
  },
  submitted: {
    title: "University of Leeds 已正式递交",
    description: "申请已经提交。Atlas 会继续记录学校回复，并在需要你处理时提醒你。",
    prepared: ["递交凭证", "学校回复跟踪", "后续时间节点"],
    cta: "查看申请详情",
  },
  supplement_required: {
    title: "学校要求补充材料",
    description: "学校提出了新的材料要求。Atlas 已整理要求、截止日期和提交入口。",
    prepared: ["学校要求原文", "中文说明", "提交格式与入口"],
    missing: "学校要求的补充材料",
    cta: "上传补充材料",
  },
  offer_received: {
    title: "你收到了 University of Leeds 的 Offer",
    description: "Atlas 已整理 Offer 类型、主要条件、接受截止日期和下一步安排。",
    prepared: ["Offer 关键信息", "接受截止日期", "后续签证准备入口"],
    cta: "查看并处理 Offer",
  },
};
