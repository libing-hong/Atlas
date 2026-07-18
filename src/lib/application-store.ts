import { ApplicationMaterial, ApplicationRecord, SchoolRecommendation, commonMaterials, createApplicationRecord } from "./application-prototype-data";
import { PurchasedService, servicePricing } from "./service-pricing";
import { emitPlanningStateChange, readActivePlanningRunId, readRunSelection, updatePlanningRun, writeRunSelection } from "./planning-store";

const recordsKey = "atlas.application.records.v1";
const workspaceKey = "atlas.application.workspace.v1";
const serviceKey = "atlas.application.purchased-service.v1";
const applicationModeKey = "atlas.application.mode.v1";
const serviceOrdersKey = "atlas.service-orders.v1";
const activeServiceOrderKey = "atlas.active-service-order.v1";
const applicationStateEvent = "atlas-application-state-change";

export type ApplicationMode = "unselected" | "DIY" | "managed" | "advisor_assisted";
export type ServiceType = "single_school_submission" | "advisor_consultation" | "full_service_uk_au" | "full_service_france";
export type ServiceOrderStatus = "draft" | "pending_payment" | "processing" | "paid" | "cancelled" | "refunded";

export type ServiceOrderItem = {
  id: string;
  orderId: string;
  applicationId?: string;
  schoolId?: string;
  schoolName?: string;
  programName?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  unitPriceFen: number;
  totalPriceFen: number;
};

export type ServiceOrder = {
  id: string;
  userId: string;
  planningRunId: string;
  serviceType: ServiceType;
  status: ServiceOrderStatus;
  currency: "CNY";
  subtotal: number;
  total: number;
  subtotalFen: number;
  totalFen: number;
  items: ServiceOrderItem[];
  createdAt: string;
  paidAt?: string;
};

function emitApplicationStateChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(applicationStateEvent));
  emitPlanningStateChange();
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function subscribeToApplicationState(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(applicationStateEvent, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(applicationStateEvent, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function getApplicationStateSnapshot() {
  if (typeof window === "undefined") return "server";
  const activeRunId = readActivePlanningRunId();
  return JSON.stringify({
    activeRunId,
    selection: readApplicationSelection(),
    records: readApplicationRecords(activeRunId),
    mode: readApplicationMode(),
    workspacePurchased: isApplicationWorkspacePurchased(),
    orders: readServiceOrders(),
  });
}

export function getServerApplicationStateSnapshot() {
  return "server";
}

export function readApplicationSelection(planningRunId = readActivePlanningRunId()): string[] {
  return readRunSelection(planningRunId);
}

export function writeApplicationSelection(ids: string[], planningRunId = readActivePlanningRunId()) {
  if (!planningRunId) return;
  writeRunSelection(planningRunId, ids);
  emitApplicationStateChange();
}

export function isApplicationWorkspacePurchased(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(workspaceKey) === "true";
}

export function readPurchasedService(): PurchasedService {
  if (typeof window === "undefined") return "none";
  const value = window.localStorage.getItem(serviceKey) as PurchasedService | null;
  return value && ["single_school_submission", "advisor_consultation", "full_service_uk_au", "full_service_france"].includes(value) ? value : "none";
}

export function purchaseService(service: Exclude<PurchasedService, "none">) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(serviceKey, service);
    emitApplicationStateChange();
  }
}

export function readApplicationMode(): ApplicationMode {
  if (typeof window === "undefined") return "unselected";
  const value = window.localStorage.getItem(applicationModeKey);
  return value === "DIY" || value === "managed" || value === "advisor_assisted" ? value : "unselected";
}

export function writeApplicationMode(mode: Exclude<ApplicationMode, "unselected">) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(applicationModeKey, mode);
    emitApplicationStateChange();
  }
}

export function activateApplicationWorkspace(selectedIds: string[], schools: SchoolRecommendation[], planningRunId = readActivePlanningRunId()) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(workspaceKey, "true");
    window.localStorage.setItem("atlas.application.workspace.purchasedAt", new Date().toISOString());
  }
  return confirmApplications(selectedIds, schools, planningRunId);
}

export function readApplicationRecords(planningRunId?: string): ApplicationRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const records = JSON.parse(window.localStorage.getItem(recordsKey) ?? "[]") as ApplicationRecord[];
    const normalized = records.map((record) => {
      const legacyEmpty = !record.totalMaterials;
      const totalMaterials = legacyEmpty ? commonMaterials.length : record.totalMaterials;
      const preparedMaterials = legacyEmpty ? 0 : record.preparedMaterials;
      return {
        ...record,
        planningRunId: record.planningRunId ?? "legacy",
        totalMaterials,
        preparedMaterials,
        detectedMaterialCount: legacyEmpty ? 0 : record.detectedMaterialCount ?? preparedMaterials,
        missingMaterials: legacyEmpty ? commonMaterials.map((item) => item.name) : record.missingMaterials,
        applicationProgress: legacyEmpty ? 0 : record.applicationProgress ?? Math.round((preparedMaterials / Math.max(totalMaterials, 1)) * 45),
      };
    });
    return planningRunId ? normalized.filter((record) => record.planningRunId === planningRunId) : normalized;
  } catch { return []; }
}

function writeApplicationRecords(records: ApplicationRecord[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(recordsKey, JSON.stringify(records));
    emitApplicationStateChange();
  }
}

export function updateApplicationRecord(applicationId: string, changes: Partial<ApplicationRecord>) {
  const records = readApplicationRecords();
  const next = records.map((record) => record.id === applicationId ? {
    ...record,
    ...changes,
    detectedMaterialCount: changes.detectedMaterialCount ?? changes.preparedMaterials ?? record.detectedMaterialCount ?? record.preparedMaterials,
  } : record);
  writeApplicationRecords(next);
  return next;
}

export function confirmApplications(selectedIds: string[], schools: SchoolRecommendation[], planningRunId = readActivePlanningRunId()) {
  if (!planningRunId) throw new Error("No active planning run");
  const records = readApplicationRecords();
  const otherRunRecords = records.filter((record) => record.planningRunId !== planningRunId);
  const nextRecords = records.filter((record) => record.planningRunId === planningRunId && selectedIds.includes(record.schoolRecommendationId));
  for (const school of schools.filter((item) => selectedIds.includes(item.id))) {
    const generated = createApplicationRecord(school, planningRunId);
    const index = nextRecords.findIndex((item) => item.schoolRecommendationId === school.id);
    if (index >= 0) {
      const existing = nextRecords[index];
      nextRecords[index] = {
        ...generated,
        ...existing,
        universityName: generated.universityName,
        programName: generated.programName,
        country: generated.country,
        intake: generated.intake,
        nextDeadline: generated.nextDeadline,
      };
    } else nextRecords.push(generated);
  }
  writeApplicationSelection(selectedIds, planningRunId);
  writeApplicationRecords([...otherRunRecords, ...nextRecords]);
  updatePlanningRun(planningRunId, { status: "schools_confirmed" });
  return nextRecords;
}

export function readServiceOrders(): ServiceOrder[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(serviceOrdersKey) ?? "[]") as ServiceOrder[]; } catch { return []; }
}

function writeServiceOrders(orders: ServiceOrder[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(serviceOrdersKey, JSON.stringify(orders));
    emitApplicationStateChange();
  }
}

export function readActiveServiceOrder(serviceType?: ServiceType) {
  if (typeof window === "undefined") return undefined;
  const planningRunId = readActivePlanningRunId();
  const activeId = window.localStorage.getItem(activeServiceOrderKey);
  const orders = readServiceOrders();
  const active = orders.find((order) => order.id === activeId);
  if (active && active.planningRunId === planningRunId && (!serviceType || active.serviceType === serviceType)) return active;
  return [...orders].reverse().find((order) => order.planningRunId === planningRunId && (!serviceType || order.serviceType === serviceType));
}

export function getPaidSubmissionApplicationIds() {
  return new Set(readServiceOrders()
    .filter((order) => order.serviceType === "single_school_submission" && order.status === "paid")
    .flatMap((order) => order.items.map((item) => item.applicationId).filter(Boolean) as string[]));
}

function saveDraftOrder(order: ServiceOrder) {
  const orders = readServiceOrders().filter((item) => item.id !== order.id);
  writeServiceOrders([...orders, order]);
  if (typeof window !== "undefined") window.localStorage.setItem(activeServiceOrderKey, order.id);
  return order;
}

export function createApplicationSubmissionOrder(records: ApplicationRecord[]) {
  const paidApplicationIds = getPaidSubmissionApplicationIds();
  const eligible = records.filter((record) => record.serviceType !== "single_school" && !paidApplicationIds.has(record.id));
  const orderId = createId("submission");
  const items = eligible.map((record) => ({
    id: createId("item"),
    orderId,
    applicationId: record.id,
    schoolId: record.schoolRecommendationId,
    schoolName: record.universityName,
    programName: record.programName,
    unitPrice: servicePricing.singleSchoolSubmission,
    quantity: 1,
    totalPrice: servicePricing.singleSchoolSubmission,
    unitPriceFen: servicePricing.singleSchoolSubmissionFen,
    totalPriceFen: servicePricing.singleSchoolSubmissionFen,
  }));
  const totalFen = items.length * servicePricing.singleSchoolSubmissionFen;
  return saveDraftOrder({
    id: orderId,
    userId: "prototype-user",
    planningRunId: records[0]?.planningRunId ?? readActivePlanningRunId() ?? "legacy",
    serviceType: "single_school_submission",
    status: "pending_payment",
    currency: "CNY",
    subtotal: totalFen / 100,
    total: totalFen / 100,
    subtotalFen: totalFen,
    totalFen,
    items,
    createdAt: new Date().toISOString(),
  });
}

export function createFixedServiceOrder(serviceType: Exclude<ServiceType, "single_school_submission">, records: ApplicationRecord[] = []) {
  const priceFen = serviceType === "advisor_consultation"
    ? servicePricing.advisorConsultationFen
    : serviceType === "full_service_uk_au"
      ? servicePricing.fullServiceUkAuFen
      : servicePricing.fullServiceFranceFen;
  const orderId = createId(serviceType);
  const order: ServiceOrder = {
    id: orderId,
    userId: "prototype-user",
    planningRunId: records[0]?.planningRunId ?? readActivePlanningRunId() ?? "legacy",
    serviceType,
    status: "pending_payment",
    currency: "CNY",
    subtotal: priceFen / 100,
    total: priceFen / 100,
    subtotalFen: priceFen,
    totalFen: priceFen,
    items: [{
      id: createId("item"),
      orderId,
      unitPrice: priceFen / 100,
      quantity: 1,
      totalPrice: priceFen / 100,
      unitPriceFen: priceFen,
      totalPriceFen: priceFen,
      schoolName: serviceType === "advisor_consultation" ? "一对一留学规划" : serviceType === "full_service_uk_au" ? "英国／澳洲全流程" : "法国商学院全流程",
      programName: records.length ? `覆盖 ${records.length} 所当前申请学校` : undefined,
    }],
    createdAt: new Date().toISOString(),
  };
  return saveDraftOrder(order);
}

export function markServiceOrderProcessing(orderId: string) {
  const orders = readServiceOrders();
  const next = orders.map((order) => order.id === orderId ? { ...order, status: "processing" as const } : order);
  writeServiceOrders(next);
  return next.find((order) => order.id === orderId);
}

export function completeServiceOrder(orderId: string) {
  const orders = readServiceOrders();
  const target = orders.find((order) => order.id === orderId);
  if (!target || target.status === "paid") return target;
  const paidAt = new Date().toISOString();
  const nextOrders = orders.map((order) => order.id === orderId ? { ...order, status: "paid" as const, paidAt } : order);
  writeServiceOrders(nextOrders);

  if (target.serviceType === "single_school_submission") {
    const purchasedIds = new Set(target.items.map((item) => item.applicationId));
    writeApplicationRecords(readApplicationRecords().map((record) => purchasedIds.has(record.id) ? {
      ...record,
      status: "manual_review" as const,
      serviceType: "single_school" as const,
      applicationProgress: Math.max(record.applicationProgress, 82),
      nextAction: "等待 Atlas 审核申请材料与基本信息",
    } : record));
    writeApplicationMode("managed");
    purchaseService("single_school_submission");
  } else if (target.serviceType === "advisor_consultation") {
    writeApplicationMode("advisor_assisted");
    purchaseService("advisor_consultation");
  } else {
    const countryMatch = (record: ApplicationRecord) => target.serviceType === "full_service_france"
      ? record.country === "法国" || record.country === "FR"
      : ["英国", "澳洲", "GB", "AU"].includes(record.country);
    writeApplicationRecords(readApplicationRecords().map((record) => countryMatch(record) ? {
      ...record,
      status: "manual_review" as const,
      serviceType: "full_service" as const,
      applicationProgress: Math.max(record.applicationProgress, 82),
      nextAction: "等待 Atlas 启动全流程服务审核",
    } : record));
    writeApplicationMode("managed");
    purchaseService(target.serviceType);
  }

  return nextOrders.find((order) => order.id === orderId);
}

export function getMaterialsForApplication(record: ApplicationRecord, school: SchoolRecommendation): ApplicationMaterial[] {
  return [
    ...commonMaterials.map((material, index) => ({ ...material, status: index < Math.min(record.preparedMaterials, commonMaterials.length) ? "prepared" as const : "not_detected" as const })),
    ...school.requirements.filter((name) => !commonMaterials.some((material) => material.name === name)).map((name, index) => ({
      id: `${record.id}-${index}`,
      name,
      status: record.missingMaterials.includes(name) ? "not_detected" as const : "review_required" as const,
      reusableFor: [school.id],
      note: "学校定制材料，不能直接视为所有学校都可复用",
    })),
  ];
}

