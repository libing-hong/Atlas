import type { ApplicationRecord, ApplicationRecordStatus, MaterialPreparationStatus, SchoolRecommendation } from "./application-prototype-data";
import { getMaterialsForApplication } from "./application-store";

export type MaterialChecklistItem = {
  id: string;
  name: string;
  status: MaterialPreparationStatus | "confirmed";
  label: "Ready" | "Needs Update" | "Missing" | "Not Required";
};

export type MaterialReadiness = {
  ready: number;
  total: number;
  items: MaterialChecklistItem[];
};

export const applicationStatusPresentation: Record<ApplicationRecordStatus, { label: string; tone: "blue" | "green" | "amber" | "red" | "neutral" }> = {
  considering: { label: "评估中", tone: "neutral" },
  selected: { label: "已加入申请", tone: "blue" },
  preparing_materials: { label: "材料准备中", tone: "blue" },
  ready_to_submit: { label: "可递交", tone: "green" },
  submission_in_progress: { label: "递交处理中", tone: "blue" },
  submitted: { label: "已递交", tone: "green" },
  waiting_result: { label: "等待结果", tone: "neutral" },
  supplement_required: { label: "等待补材料", tone: "red" },
  rejected: { label: "未录取", tone: "neutral" },
  conditional_offer: { label: "有条件 Offer", tone: "amber" },
  unconditional_offer: { label: "Offer 已收到", tone: "green" },
  accepted: { label: "Offer 已接受", tone: "green" },
  declined: { label: "已谢绝", tone: "neutral" },
  withdrawn: { label: "已撤回", tone: "neutral" },
};

function materialLabel(status: string): MaterialChecklistItem["label"] {
  if (status === "not_required") return "Not Required";
  if (status === "prepared" || status === "confirmed") return "Ready";
  if (["uploading", "processing", "needs_confirmation", "review_required"].includes(status)) return "Needs Update";
  return "Missing";
}

export function buildMaterialReadiness(record: ApplicationRecord, school: SchoolRecommendation, persistedStatuses: Record<string, string> = {}): MaterialReadiness {
  const items = getMaterialsForApplication(record, school).map((material) => {
    const status = (persistedStatuses[material.id] ?? material.status) as MaterialChecklistItem["status"];
    return { id: material.id, name: material.name, status, label: materialLabel(status) };
  });
  const required = items.filter((item) => item.label !== "Not Required");
  return {
    ready: required.filter((item) => item.label === "Ready").length,
    total: required.length,
    items,
  };
}

export function formatApplicationDeadline(value?: string) {
  if (!value || ["待确认", "暂未公布", "db missing"].includes(value.trim().toLowerCase())) return "官方轮次更新中";
  if (/rolling|滚动/i.test(value)) return "Rolling";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(parsed);
}

export function getApplicationSummary(records: ApplicationRecord[], readinessById: Record<string, MaterialReadiness>, now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const sevenDaysLater = new Date(start);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  const deadlineSoon = records.filter((record) => {
    if (!record.nextDeadline || /rolling|滚动/i.test(record.nextDeadline)) return false;
    const deadline = new Date(record.nextDeadline);
    return !Number.isNaN(deadline.getTime()) && deadline >= start && deadline <= sevenDaysLater;
  }).length;
  const preparing = records.filter((record) => {
    const readiness = readinessById[record.id];
    const activelyPreparing = ["considering", "selected", "preparing_materials", "submission_in_progress", "supplement_required"].includes(record.status);
    return activelyPreparing && (readiness ? readiness.ready < readiness.total : record.preparedMaterials < record.totalMaterials);
  }).length;
  const blocked = records.filter((record) => record.status === "supplement_required" || readinessById[record.id]?.items.some((item) => item.status === "rejected")).length;
  return { total: records.length, preparing, deadlineSoon, blocked };
}

export function countryCode(country: string) {
  const normalized = country.trim().toLowerCase();
  const known: Record<string, string> = { 法国: "FR", france: "FR", 英国: "GB", "united kingdom": "GB", 澳洲: "AU", 澳大利亚: "AU", australia: "AU", 美国: "US", "united states": "US", 德国: "DE", germany: "DE", 加拿大: "CA", canada: "CA" };
  return known[normalized] ?? (country.length === 2 ? country.toUpperCase() : country.slice(0, 2).toUpperCase());
}

export function applicationTimelineIndex(status: ApplicationRecordStatus) {
  if (["conditional_offer", "unconditional_offer", "accepted", "declined"].includes(status)) return 3;
  if (["submitted", "waiting_result", "supplement_required", "rejected"].includes(status)) return 2;
  if (status === "submission_in_progress") return 1;
  return 0;
}
