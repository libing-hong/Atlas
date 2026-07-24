import type { ApplicationRecord } from "./application-prototype-data";
import { getVisaPolicy, type SupportedVisaCountry, type VisaTaskStatus } from "./visa-rules";

export type VisaApplicantFacts = {
  nationality: string | null;
  residenceCountry: string | null;
  age: number | null;
  courseStartDate: string | null;
  courseDurationMonths: number | null;
  tuition: number | null;
  tuitionCurrency: string | null;
  tuitionPaid: number | null;
  scholarship: number | null;
  hasDependants: boolean | null;
  hasSpecialApproval: boolean | null;
  hasSchoolVisaDocument: boolean | null;
  previousStudyOrResidence: boolean | null;
  hasVisaRefusalHistory: boolean | null;
};

export type VisaTask = {
  id: string;
  title: string;
  description: string;
  status: VisaTaskStatus;
  dependencies: string[];
  blockedBy: string[];
  officialSource: { title: string; url: string } | null;
  officialDeadline: string | null;
  atlasSuggestedDate: string | null;
  expectedProcessingTime: string | null;
  completedAt?: string;
};

export type VisaMaterial = {
  id: string;
  name: string;
  required: boolean;
  applicableReason: string;
  status: VisaTaskStatus;
  completionCriteria: string;
  deadline: string | null;
  acceptedFileTypes: string[];
  atlasRecognized: boolean;
  needsHumanConfirmation: boolean;
  officialSource: { title: string; url: string };
  alternatives: string[];
  storedMaterialId?: string;
};

export type VisaWorkspace = {
  id: string;
  applicationId: string;
  universityName: string;
  programmeName: string;
  country: SupportedVisaCountry;
  visaType: string;
  status: "active" | "archived";
  ruleVersion: string;
  ruleVerifiedAt: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  archiveReason?: string;
  facts: VisaApplicantFacts;
  tasks: VisaTask[];
  materials: VisaMaterial[];
};

export const emptyVisaFacts: VisaApplicantFacts = {
  nationality: null, residenceCountry: null, age: null, courseStartDate: null, courseDurationMonths: null,
  tuition: null, tuitionCurrency: null, tuitionPaid: null, scholarship: null, hasDependants: null,
  hasSpecialApproval: null, hasSchoolVisaDocument: null, previousStudyOrResidence: null, hasVisaRefusalHistory: null,
};

const factComplete = (facts: VisaApplicantFacts) =>
  Boolean(facts.nationality && facts.residenceCountry && facts.age !== null && facts.courseStartDate && facts.courseDurationMonths !== null && facts.hasDependants !== null && facts.previousStudyOrResidence !== null && facts.hasVisaRefusalHistory !== null);

const isoMinusDays = (value: string | null, days: number) => {
  if (!value) return null;
  const date = new Date(value); if (Number.isNaN(date.getTime())) return null;
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
};

export function generateVisaWorkspace(application: ApplicationRecord, facts: VisaApplicantFacts, existing?: VisaWorkspace): VisaWorkspace | null {
  if (!application.isFinalOffer || !application.offerEvidenceAvailable || application.offerConditionsSatisfied !== true) return null;
  const countryPolicy = getVisaPolicy(application.country);
  if (!countryPolicy) return null;
  const now = new Date().toISOString();
  const completed = new Map(existing?.tasks.filter((task) => task.status === "completed").map((task) => [task.id, task]) ?? []);
  const initial: VisaTask[] = [
    task("final_offer", "最终录取已确认", "学校、专业、国家和入学信息已锁定。", "completed", [], null),
    task("school_document", countryPolicy.country === "uk" ? "获得并核对 CAS" : countryPolicy.country === "australia" ? "获得并核对 CoE" : "获得注册或预注册证明", "等待学校签发并核对课程信息。", facts.hasSchoolVisaDocument ? "completed" : "user_action_required", ["final_offer"], countryPolicy.rules[0]?.officialSource ?? null),
    task("facts_confirmed", "确认个人与课程信息", "集中确认国籍、居住地、课程、费用、家属和历史情况。", !factComplete(facts) ? "needs_confirmation" : facts.hasVisaRefusalHistory || facts.hasDependants || (facts.age !== null && facts.age < 18) ? "needs_review" : "completed", ["final_offer"], { title: `${countryPolicy.label}官方学生签证入口`, url: countryPolicy.officialUrl }),
    task("finance", "准备资金或资助证明", "Atlas 将根据确认后的费用、已付款和个人情况判断。", "not_started", ["school_document", "facts_confirmed"], countryPolicy.rules.find((rule) => rule.id.includes("finance") || rule.id === "fr-wizard")?.officialSource ?? null),
    task("health_special", "完成适用的体检或特殊审批", "不适用时会明确标记，不会作为缺失材料。", facts.hasSpecialApproval === false ? "not_applicable" : facts.hasSpecialApproval === true ? "needs_review" : "needs_confirmation", ["facts_confirmed"], countryPolicy.rules.find((rule) => rule.id.includes("special") || rule.id.includes("oshc") || rule.id.includes("eef"))?.officialSource ?? null),
    task("online_application", "填写在线申请", "使用已确认的信息填写官方在线申请。", "not_started", ["school_document", "facts_confirmed", "finance", "health_special"], { title: `${countryPolicy.label}官方申请入口`, url: countryPolicy.officialUrl }),
    task("payment", "支付签证相关费用", "仅在在线申请信息最终确认后执行。", "not_started", ["online_application"], { title: `${countryPolicy.label}官方申请入口`, url: countryPolicy.officialUrl }),
    task("identity_submission", "完成身份验证或递交", "根据申请地安排预约、生物信息或线上身份验证。", "not_started", ["payment"], { title: `${countryPolicy.label}官方申请入口`, url: countryPolicy.officialUrl }),
    task("decision", "等待签证结果", "保留补件通知和结果记录。", "not_started", ["identity_submission"], { title: `${countryPolicy.label}官方申请入口`, url: countryPolicy.officialUrl }),
    task("verify_grant", "核验获签信息", "核对姓名、护照、签证类型、有效期和课程信息。", "not_started", ["decision"], { title: `${countryPolicy.label}官方申请入口`, url: countryPolicy.officialUrl }),
  ];
  const tasks = resolveDependencies(initial.map((item) => completed.has(item.id) ? { ...item, ...completed.get(item.id), status: "completed" } : item));
  const materials = countryPolicy.rules.flatMap((rule) => rule.requiredEvidence.map((evidence, index) => {
    const conditionalNotApplicable = (rule.id === "uk-special" || rule.id === "fr-eef") && facts.hasSpecialApproval === false;
    return ({
    id: `${rule.id}-${index}`,
    name: evidence,
    required: !conditionalNotApplicable,
    applicableReason: rule.applicantCondition,
    status: conditionalNotApplicable ? "not_applicable" as VisaTaskStatus : "not_started" as VisaTaskStatus,
    completionCriteria: rule.requirement,
    deadline: isoMinusDays(facts.courseStartDate, 45),
    acceptedFileTypes: [".pdf", ".png", ".jpg", ".jpeg"],
    atlasRecognized: false,
    needsHumanConfirmation: true,
    officialSource: rule.officialSource,
    alternatives: rule.exceptions,
  }); }));
  return {
    id: existing?.id ?? `visa-${application.id}-${Date.now()}`, applicationId: application.id,
    universityName: application.universityName, programmeName: application.programName, country: countryPolicy.country,
    visaType: countryPolicy.visaType, status: "active", ruleVersion: countryPolicy.ruleVersion,
    ruleVerifiedAt: countryPolicy.verifiedAt, createdAt: existing?.createdAt ?? now, updatedAt: now,
    facts, tasks, materials: mergeMaterials(materials, existing?.materials ?? []),
  };
}

function task(id: string, title: string, description: string, status: VisaTaskStatus, dependencies: string[], officialSource: VisaTask["officialSource"]): VisaTask {
  return { id, title, description, status, dependencies, blockedBy: [], officialSource, officialDeadline: null, atlasSuggestedDate: null, expectedProcessingTime: null };
}

export function resolveDependencies(tasks: VisaTask[]) {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  return tasks.map((item) => {
    if (["completed", "not_applicable", "expired", "needs_review"].includes(item.status)) return item;
    const blockedBy = item.dependencies.filter((id) => {
      const dependency = byId.get(id);
      return dependency && !["completed", "not_applicable"].includes(dependency.status);
    });
    if (blockedBy.length) return { ...item, status: "waiting_for_dependency" as const, blockedBy };
    return { ...item, status: item.status === "waiting_for_dependency" ? "not_started" as const : item.status, blockedBy: [] };
  });
}

function mergeMaterials(next: VisaMaterial[], previous: VisaMaterial[]) {
  const old = new Map(previous.map((item) => [item.id, item]));
  return next.map((item) => old.has(item.id) ? { ...item, ...old.get(item.id), officialSource: item.officialSource } : item);
}

export function updateVisaTask(workspace: VisaWorkspace, taskId: string, status: VisaTaskStatus): VisaWorkspace {
  const target = workspace.tasks.find((task) => task.id === taskId);
  if (!target) return workspace;
  if (target.status === "waiting_for_dependency" && status === "completed") return workspace;
  const tasks = resolveDependencies(workspace.tasks.map((task) => task.id === taskId ? { ...task, status, completedAt: status === "completed" ? new Date().toISOString() : undefined } : task));
  return { ...workspace, tasks, updatedAt: new Date().toISOString() };
}

export function archivePreviousVisaWorkspaces(items: VisaWorkspace[], newApplicationId: string, newUniversityName: string, now = new Date().toISOString()) {
  return items.map((workspace) => workspace.status === "active" && workspace.applicationId !== newApplicationId
    ? { ...workspace, status: "archived" as const, archivedAt: now, updatedAt: now, archiveReason: `最终录取已更换为 ${newUniversityName}` }
    : workspace);
}
