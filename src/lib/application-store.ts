import { ApplicationMaterial, ApplicationRecord, SchoolRecommendation, commonMaterials, createApplicationRecord } from "./application-prototype-data";
import { PurchasedService } from "./service-pricing";

const selectionKey = "atlas.application.selection.v1";
const recordsKey = "atlas.application.records.v1";
const workspaceKey = "atlas.application.workspace.v1";
const serviceKey = "atlas.application.purchased-service.v1";
const applicationModeKey = "atlas.application.mode.v1";

export type ApplicationMode = "unselected" | "DIY" | "managed" | "advisor_assisted";

export function readApplicationSelection(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(selectionKey) ?? "[]") as string[]; } catch { return []; }
}

export function writeApplicationSelection(ids: string[]) {
  if (typeof window !== "undefined") window.localStorage.setItem(selectionKey, JSON.stringify(ids));
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
  if (typeof window !== "undefined") window.localStorage.setItem(serviceKey, service);
}

export function readApplicationMode(): ApplicationMode {
  if (typeof window === "undefined") return "unselected";
  const value = window.localStorage.getItem(applicationModeKey);
  return value === "DIY" || value === "managed" || value === "advisor_assisted" ? value : "unselected";
}

export function writeApplicationMode(mode: Exclude<ApplicationMode, "unselected">) {
  if (typeof window !== "undefined") window.localStorage.setItem(applicationModeKey, mode);
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
  try { return JSON.parse(window.localStorage.getItem(recordsKey) ?? "[]") as ApplicationRecord[]; } catch { return []; }
}

function writeApplicationRecords(records: ApplicationRecord[]) {
  if (typeof window !== "undefined") window.localStorage.setItem(recordsKey, JSON.stringify(records));
}

export function confirmApplications(selectedIds: string[], schools: SchoolRecommendation[]) {
  const records = readApplicationRecords();
  const nextRecords = [...records];
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
