import { formatCNY } from "./format-currency";
import { getAdmissionKnowledge } from "./admission-knowledge";
import { SERVICE_CATALOG } from "./service-catalog";

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
  planningRunId: string;
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
  budget: "预算未设置",
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

export function createApplicationRecord(school: SchoolRecommendation, planningRunId = "legacy"): ApplicationRecord {
  const missingMaterials = school.requirements.filter((item) => !["本科成绩单", "英语语言成绩"].includes(item));
  return {
    id: `app-${planningRunId}-${school.id}`,
    planningRunId,
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
  if (school.admissionRequirements?.length) return school.admissionRequirements;
  const fallback = [
    { id: "degree", label: "学位要求", schoolRequirement: "认可的本科或同等学历", userSituation: "已提供本科教育背景", status: "meets" },
    { id: "academic", label: "成绩或 GPA 要求", schoolRequirement: "需要达到学校公布的成绩要求，具体以官方页面为准", userSituation: "成绩单已检测到，仍需核对学校换算方式", status: "needs_confirmation" },
    { id: "background", label: "本科专业背景", schoolRequirement: `${school.programName} 相关专业或可证明的相关学习经历`, userSituation: "现有专业与目标方向整体相关", status: "mostly_meets" },
    { id: "language", label: "语言成绩", schoolRequirement: "英语语言成绩需符合学校公布的最低标准", userSituation: "已检测到英语成绩，需确认有效期和具体分项", status: "needs_confirmation" },
    { id: "experience", label: "工作或实习经历", schoolRequirement: "学校未明确要求必须有相关工作经历", userSituation: "已有经历可用于个人陈述", status: "meets" },
    { id: "prerequisite", label: "先修课程", schoolRequirement: "部分课程可能要求定量分析或相关基础课程", userSituation: "尚未完成课程逐项核对", status: "unknown" },
    { id: "portfolio", label: "作品集或其他特殊要求", schoolRequirement: "目前未发现必须提交作品集的公开要求", userSituation: "需以最终申请页面再次确认", status: "needs_confirmation" },
  ].map((item) => ({ ...item, status: item.status as RequirementStatus, schoolRequirement: `${item.schoolRequirement}（待官方核验）` }));
  return fallback.filter((item) => !["experience", "prerequisite", "portfolio"].includes(item.id) || school.requirements.some((requirement) => item.id === "experience" ? /工作|实习|experience/i.test(requirement) : item.id === "prerequisite" ? /先修|课程|prerequisite/i.test(requirement) : /作品集|portfolio/i.test(requirement)));
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
      cta: `预约一对一留学规划 ${formatCNY(SERVICE_CATALOG.consultation.amount)}／次`,
      href: "/dashboard/order-application?service=consultation",
      details: ["学校申请路径", "Études en France / Campus France", "材料与面试安排", "后续签证准备"],
      notice: consultationPurchased ? "一对一留学规划咨询已预约" : `一对一留学规划咨询 ${formatCNY(SERVICE_CATALOG.consultation.amount)}／次。`,
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
      cta: `购买单校申请递交 ${formatCNY(SERVICE_CATALOG.submission.amount)}／学校`,
      href: "/dashboard/order-application?service=single-school",
      details: ["人工审核申请材料", "填写学校申请系统", "正式递交并同步申请编号", "跟踪学校回复"],
    };
  }
  return {
    type: "selection_consultation" as const,
    title: "不确定如何选择学校？",
    description: "顾问可以根据你的背景、预算和申请目标，帮助你确认学校组合与申请优先级。",
    cta: `预约一对一留学规划 ${formatCNY(SERVICE_CATALOG.consultation.amount)}／次`,
    href: "/dashboard/order-application?service=consultation",
    details: ["学校组合建议", "申请优先级", "主要风险说明"],
    notice: `一对一留学规划咨询 ${formatCNY(SERVICE_CATALOG.consultation.amount)}／次。`,
  };
}

export const recommendations: SchoolRecommendation[] = [];

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
    description: "Atlas 将仅展示当前已核验且与你资料匹配的项目。",
    prepared: ["学校匹配结果", "录取要求对比", "学费与截止日期", "主要申请风险"],
    cta: "查看推荐学校",
    secondary: `预约一对一留学规划 ${formatCNY(SERVICE_CATALOG.consultation.amount)}／次`,
  },
  school_confirmed: {
    title: "准备第一所学校的申请材料",
    description: "已确认项目 需要的 8 项材料中，目前已检测到 6 项。",
    prepared: ["学校材料要求", "材料格式说明", "已上传材料初步检查", "可接受的替代材料"],
    missing: "个人陈述、推荐信",
    cta: "继续准备材料",
  },
  materials_ready: {
    title: "已确认项目 已可以开始申请",
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
    title: "已确认项目 已正式递交",
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
    title: "你收到了 已确认项目 的 Offer",
    description: "Atlas 已整理 Offer 类型、主要条件、接受截止日期和下一步安排。",
    prepared: ["Offer 关键信息", "接受截止日期", "后续签证准备入口"],
    cta: "查看并处理 Offer",
  },
};




