"use client";

import type { ApplicationRecord } from "./application-prototype-data";
import { updateApplicationRecord } from "./application-store";
import { archivePreviousVisaWorkspaces, emptyVisaFacts, generateVisaWorkspace, type VisaApplicantFacts, type VisaWorkspace } from "./visa-engine";

const key = "atlas.visa-workspaces.v2";
const eventName = "atlas-visa-workspace-change";

export function readVisaWorkspaces(): VisaWorkspace[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(key) ?? "[]") as VisaWorkspace[]; } catch { return []; }
}

export function writeVisaWorkspaces(items: VisaWorkspace[]) {
  window.localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new Event(eventName));
}

export function confirmFinalOffer(application: ApplicationRecord, allApplications: ApplicationRecord[]) {
  if (!application.offerEvidenceAvailable || application.offerConditionsSatisfied !== true) return null;
  for (const item of allApplications) updateApplicationRecord(item.id, {
    isFinalOffer: item.id === application.id,
    ...(item.id === application.id ? {
      status: "accepted" as const,
      applicationProgress: 100,
      nextAction: `准备${application.country}学生签证材料`,
    } : {}),
  });
  const now = new Date().toISOString();
  const previous = readVisaWorkspaces();
  const archived = archivePreviousVisaWorkspaces(previous, application.id, application.universityName, now);
  const existing = archived.find((workspace) => workspace.applicationId === application.id);
  const workspace = generateVisaWorkspace({ ...application, isFinalOffer: true }, existing?.facts ?? emptyVisaFacts, existing);
  if (!workspace) return null;
  writeVisaWorkspaces([...archived.filter((item) => item.id !== workspace.id), workspace]);
  return workspace;
}

export function saveVisaFacts(workspace: VisaWorkspace, facts: VisaApplicantFacts, application: ApplicationRecord) {
  const regenerated = generateVisaWorkspace({ ...application, isFinalOffer: true, offerConditionsSatisfied: true }, facts, workspace);
  if (!regenerated) return workspace;
  writeVisaWorkspaces(readVisaWorkspaces().map((item) => item.id === workspace.id ? regenerated : item));
  return regenerated;
}

export function saveVisaWorkspace(workspace: VisaWorkspace) {
  writeVisaWorkspaces(readVisaWorkspaces().map((item) => item.id === workspace.id ? workspace : item));
}

export function subscribeVisaWorkspaces(listener: () => void) {
  window.addEventListener(eventName, listener); window.addEventListener("storage", listener);
  return () => { window.removeEventListener(eventName, listener); window.removeEventListener("storage", listener); };
}

