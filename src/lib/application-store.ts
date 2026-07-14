import { ApplicationMaterial, ApplicationRecord, SchoolRecommendation, commonMaterials, createApplicationRecord } from "./application-prototype-data";
import { PurchasedService } from "./service-pricing";

const selectionKey = "atlas.application.selection.v1";
const recordsKey = "atlas.application.records.v1";
const workspaceKey = "atlas.application.workspace.v1";
const serviceKey = "atlas.application.purchased-service.v1";
const applicationModeKey = "atlas.application.mode.v1";
const applicationStateEvent = "atlas-application-state-change";

export type ApplicationMode = "unselected" | "DIY" | "managed" | "advisor_assisted";

function emitApplicationStateChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(applicationStateEvent));
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
  return JSON.stringify({
    selection: readApplicationSelection(),
    records: readApplicationRecords(),
    mode: readApplicationMode(),
    workspacePurchased: isApplicationWorkspacePurchased(),
  });
}

export function getServerApplicationStateSnapshot() {
  return "server";
}

export function readApplicationSelection(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(selectionKey) ?? "[]") as string[]; } catch { return []; }
}

export function writeApplicationSelection(ids: string[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(selectionKey, JSON.stringify(ids));
    emitApplicationStateChange();
  }
}

export function isApplicationWorkspacePurchased(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(workspaceKey) === "true";
}

export function readPurchasedService(): PurchasedService {
  if (typeof window === "undefined") return "none";
  const value = window.localStorage.getItem(serviceKey);
  return value === "single_school_submission" || value === "advisor_consultation" ? value : "none";
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

export function activateApplicationWorkspace(selectedIds: string[], schools: SchoolRecommendation[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(workspaceKey, "true");
    window.localStorage.setItem("atlas.application.workspace.purchasedAt", new Date().toISOString());
  }
  return confirmApplications(selectedIds, schools);
}

export function readApplicationRecords(): ApplicationRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const records = JSON.parse(window.localStorage.getItem(recordsKey) ?? "[]") as ApplicationRecord[];
    return records.map((record) => ({
      ...record,
      detectedMaterialCount: record.detectedMaterialCount ?? record.preparedMaterials,
      applicationProgress: record.applicationProgress ?? Math.round((record.preparedMaterials / Math.max(record.totalMaterials, 1)) * 45),
    }));
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

export function confirmApplications(selectedIds: string[], schools: SchoolRecommendation[]) {
  const records = readApplicationRecords();
  const nextRecords = records.filter((record) => selectedIds.includes(record.schoolRecommendationId));
  for (const school of schools.filter((item) => selectedIds.includes(item.id))) {
    const record = createApplicationRecord(school);
    const index = nextRecords.findIndex((item) => item.schoolRecommendationId === school.id);
    if (index >= 0) nextRecords[index] = { ...nextRecords[index], ...record };
    else nextRecords.push(record);
  }
  writeApplicationSelection(selectedIds);
  writeApplicationRecords(nextRecords);
  return nextRecords;
}

export function getMaterialsForApplication(record: ApplicationRecord, school: SchoolRecommendation): ApplicationMaterial[] {
  return [
    ...commonMaterials.map((material, index) => ({ ...material, status: index < Math.max(2, Math.min(record.preparedMaterials, commonMaterials.length)) ? "prepared" as const : "review_required" as const })),
    ...school.requirements.filter((name) => !commonMaterials.some((material) => material.name === name)).map((name, index) => ({
      id: `${record.id}-${index}`,
      name,
      status: record.missingMaterials.includes(name) ? "not_detected" as const : "review_required" as const,
      reusableFor: [school.id],
      note: "学校定制材料，不能直接视为所有学校都可复用",
    })),
  ];
}
