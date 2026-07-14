import { ApplicationRecord } from "./application-prototype-data";
import { JourneyNode } from "./visual-prototype-data";

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
  deadline?: string;
  atlasPreparedItems?: string[];
  userRequiredItems?: string[];
};

function deadlineValue(value?: string) {
  if (!value || value === "滚动录取") return Number.MAX_SAFE_INTEGER;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

export function getAtlasPrimaryTask({
  applicationRecords,
  selectedSchoolIds,
  workspacePurchased,
  journeyNodes,
}: {
  applicationRecords: ApplicationRecord[];
  selectedSchoolIds: string[];
  workspacePurchased: boolean;
  journeyNodes: JourneyNode[];
}): AtlasPrimaryTask {
  const urgentNode = journeyNodes.find((node) => node.status === "blocked" && node.priority === "High");
  if (urgentNode) return { id: urgentNode.id, source: urgentNode.id.includes("accommodation") ? "housing" : "visa", priority: 1, title: urgentNode.title, description: urgentNode.blocker ?? urgentNode.explanation, status: "urgent", actionLabel: urgentNode.primaryCta, actionHref: `/dashboard/journey/${urgentNode.id}`, deadline: urgentNode.deadline, atlasPreparedItems: urgentNode.atlasCanHelpWith, userRequiredItems: urgentNode.missingInformation };

  if (applicationRecords.length) {
    const record = [...applicationRecords].sort((a, b) => deadlineValue(a.nextDeadline) - deadlineValue(b.nextDeadline))[0];
    const href = `/applications/${record.id}/materials`;
    return { id: record.id, source: "application", priority: 5, title: `准备 ${record.universityName} 的申请材料`, description: `${record.universityName} 需要的 ${record.totalMaterials} 项材料中，目前已检测到 ${record.preparedMaterials} 项。`, status: "ready", actionLabel: "开始准备材料", actionHref: href, applicationId: record.id, schoolName: record.universityName, deadline: record.nextDeadline, atlasPreparedItems: ["学校录取要求", "材料清单", "可复用材料关联", "申请时间节点"], userRequiredItems: record.missingMaterials };
  }

  if (selectedSchoolIds.length && !workspacePurchased) return { id: "choose-application-service", source: "application", priority: 6, title: "选择如何完成第一所学校的申请", description: `你已选择 ${selectedSchoolIds.length} 所学校。你可以自己准备，也可以按学校购买 Atlas 的递交服务。`, status: "waiting_user", actionLabel: "选择申请方式", actionHref: "/applications", atlasPreparedItems: ["完整学校推荐", "录取要求对照", "材料准备路径"], userRequiredItems: ["选择自己准备、单校递交或顾问咨询"] };

  return { id: "confirm-application-schools", source: "application", priority: 7, title: "确认准备申请的学校", description: "Atlas 已整理完整推荐学校和录取要求，确认后即可进入正式申请准备。", status: "ready", actionLabel: "查看推荐学校", actionHref: "/applications/recommendations", atlasPreparedItems: ["完整推荐学校名单", "冲刺、重点和相对稳妥分类", "学校录取要求和风险分析"] };
}
