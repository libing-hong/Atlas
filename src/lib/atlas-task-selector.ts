import { ApplicationRecord } from "./application-prototype-data";
import { JourneyNode, JourneyStage } from "./visual-prototype-data";

export type AtlasPrimaryTask = {
  id: string;
  source: "application" | "visa" | "housing" | "arrival" | "general";
  priority: number;
  title: string;
  description: string;
  status: "ready" | "waiting_user" | "atlas_processing" | "urgent" | "completed";
  actionLabel: string;
  actionHref: string;
  applicationId?: string;
  schoolName?: string;
  programName?: string;
  deadline?: string;
  atlasPreparedItems?: string[];
  userRequiredItems?: string[];
};

const stageNames = ["Application", "Offer", "Visa", "Pre-arrival", "Arrival", "Settling In", "Student Life", "Graduation"] as const;

function deadlineValue(value?: string) {
  if (!value || value === "滚动录取") return Number.MAX_SAFE_INTEGER;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

function daysUntil(value?: string) {
  const parsed = deadlineValue(value);
  return parsed === Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : Math.ceil((parsed - Date.now()) / 86_400_000);
}

function recordPriority(record: ApplicationRecord) {
  if (record.status === "manual_review") return 2;
  if (record.status === "supplement_required") return 3;
  if (record.status !== "offer_received" && record.status !== "submitted" && record.status !== "waiting_result" && daysUntil(record.nextDeadline) <= 30) return 1;
  if (record.status === "ready_to_apply") return 2;
  if (record.missingMaterials.length) return 4;
  if (record.status === "submitted" || record.status === "waiting_result") return 5;
  if (record.status === "offer_received") return 6;
  return 7;
}

function taskCopy(record: ApplicationRecord) {
  if (record.status === "manual_review") return {
    title: `确认 ${record.universityName} 申请材料`,
    action: "查看服务进度",
    explanation: "Atlas 正在审核申请材料与基本信息；如发现缺失内容，会在这里集中提醒你补充。",
  };
  if (record.status === "supplement_required") return {
    title: `补充 ${record.universityName} 要求的材料`,
    action: "进入补件工作区",
    explanation: `学校要求补充材料。请先处理：${record.missingMaterials.join("、") || "学校最新要求"}。`,
  };
  if (record.status === "ready_to_apply") return {
    title: `确认并提交 ${record.universityName} 申请`,
    action: "进入申请工作区",
    explanation: "核心材料已经准备完成，请核对申请信息并决定提交方式。",
  };
  if (record.status === "submitted" || record.status === "waiting_result") return {
    title: `跟进 ${record.universityName} 申请结果`,
    action: "查看申请状态",
    explanation: "申请已经提交，当前仍处于申请阶段；收到并核验正式 Offer 后才会进入录取阶段。",
  };
  if (record.status === "offer_received") return {
    title: `核验 ${record.universityName} 正式 Offer`,
    action: "查看录取信息",
    explanation: "Atlas 已检测到正式录取结果，请核验 Offer 内容、截止日期和后续条件。",
  };
  return {
    title: `准备 ${record.universityName} 的申请材料`,
    action: "进入材料工作区",
    explanation: `${record.totalMaterials} 项材料中已检测到 ${record.detectedMaterialCount ?? record.preparedMaterials} 项，仍缺少 ${record.missingMaterials.length} 项。`,
  };
}

export function getJourneyStagesForApplicationRecords(records: ApplicationRecord[]): JourneyStage[] {
  const currentIndex = Math.max(0, Math.min(stageNames.length - 1, ...records.map((record) => record.journeyStageIndex ?? (record.status === "offer_received" ? 1 : 0))));
  return stageNames.map((name, index) => ({
    id: name.toLowerCase().replaceAll(" ", "-"),
    name,
    state: index < currentIndex ? "completed" : index === currentIndex ? "current" : "upcoming",
    progress: index === currentIndex
      ? currentIndex === 0
        ? Math.max(12, records.length ? Math.round(records.reduce((total, record) => total + record.applicationProgress, 0) / records.length) : 12)
        : 18
      : index < currentIndex ? 100 : 0,
  }));
}

export function getApplicationJourneyNodes(applicationRecords: ApplicationRecord[], selectedSchoolIds: string[]): JourneyNode[] {
  if (!applicationRecords.length) {
    return [{
      id: selectedSchoolIds.length ? "choose-application-service" : "confirm-application-schools",
      title: selectedSchoolIds.length ? "选择申请方式" : "确认申请学校",
      stage: "Application",
      explanation: selectedSchoolIds.length ? `你已选择 ${selectedSchoolIds.length} 所学校，请确认 DIY、顾问协助或 Atlas 代办模式。` : "先确认准备申请的学校，Atlas 才能生成对应材料和截止日期任务。",
      status: "ready",
      deadline: "待确认",
      priority: "High",
      whyItMatters: "学校名单和申请方式决定后续材料、截止日期与工作区。",
      atlasCanHelpWith: ["学校推荐结果", "公开要求对照", "申请材料路径"],
      primaryCta: selectedSchoolIds.length ? "选择申请方式" : "查看推荐学校",
      completionRequirement: "申请学校和服务模式已确认。",
      actionHref: selectedSchoolIds.length ? "/applications" : "/applications/recommendations",
    }];
  }

  return [...applicationRecords]
    .sort((left, right) => recordPriority(left) - recordPriority(right) || deadlineValue(left.nextDeadline) - deadlineValue(right.nextDeadline))
    .map((record) => {
      const copy = taskCopy(record);
      return {
        id: record.id,
        title: copy.title,
        stage: record.status === "offer_received" ? "Offer" : "Application",
        explanation: copy.explanation,
        status: record.status === "manual_review" || record.status === "submitted" || record.status === "waiting_result" ? "in_progress" : record.status === "offer_received" ? "awaiting_evidence" : record.status === "supplement_required" ? "blocked" : "ready",
        deadline: record.nextDeadline ?? "待确认",
        priority: recordPriority(record) <= 2 ? "High" : recordPriority(record) <= 4 ? "Medium" : "Low",
        whyItMatters: "该任务会直接更新学校申请进度、材料状态和下一步行动。",
        atlasCanHelpWith: ["学校公开要求", "材料清单", "申请状态与截止日期"],
        missingInformation: record.missingMaterials,
        primaryCta: copy.action,
        completionRequirement: record.nextAction,
        actionHref: `/applications/${encodeURIComponent(record.id)}/materials`,
        applicationId: record.id,
        schoolName: record.universityName,
        programName: record.programName,
        applicationProgress: record.applicationProgress,
      } satisfies JourneyNode;
    });
}

export function getAtlasPrimaryTask({ applicationRecords, selectedSchoolIds }: {
  applicationRecords: ApplicationRecord[];
  selectedSchoolIds: string[];
  workspacePurchased: boolean;
  journeyNodes: JourneyNode[];
}): AtlasPrimaryTask {
  const node = getApplicationJourneyNodes(applicationRecords, selectedSchoolIds)[0];
  return {
    id: node.id,
    source: "application",
    priority: node.priority === "High" ? 1 : node.priority === "Medium" ? 4 : 7,
    title: node.title,
    description: node.explanation,
    status: node.status === "blocked" ? "urgent" : node.status === "in_progress" || node.status === "awaiting_evidence" ? "atlas_processing" : "ready",
    actionLabel: node.primaryCta,
    actionHref: node.actionHref ?? "/applications",
    applicationId: node.applicationId,
    schoolName: node.schoolName,
    programName: node.programName,
    deadline: node.deadline,
    atlasPreparedItems: node.atlasCanHelpWith,
    userRequiredItems: node.missingInformation,
  };
}
