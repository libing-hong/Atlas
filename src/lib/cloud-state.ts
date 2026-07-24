"use client";

const CLOUD_KEYS = [
  "atlas.student-profile.v3",
  "atlas.planning-runs.v1",
  "atlas.active-planning-run-id.v1",
  "atlas.planning-reports.v1",
  "atlas.recommendation-candidates.v2",
  "atlas.application.selection.v2",
  "atlas.school-comparison.selection.v2",
  "atlas.application.records.v1",
  "atlas.application.workspace.v1",
  "atlas.application.mode.v1",
  "atlas.service-orders.v1",
  "atlas.active-service-order.v1",
  "atlas.visa-workspaces.v1",
] as const;

export type AtlasCloudState = Record<string, string>;

export function collectCloudState(): AtlasCloudState {
  if (typeof window === "undefined") return {};
  return Object.fromEntries(CLOUD_KEYS.flatMap((key) => {
    const value = window.localStorage.getItem(key);
    return value === null ? [] : [[key, value]];
  }));
}

export function hydrateCloudState(state: AtlasCloudState) {
  if (typeof window === "undefined") return;
  for (const key of CLOUD_KEYS) {
    const value = state[key];
    if (typeof value === "string") window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
  }
  window.dispatchEvent(new Event("atlas-student-profile-change"));
  window.dispatchEvent(new Event("atlas-planning-state-change"));
  window.dispatchEvent(new Event("atlas-application-state-change"));
}

export function clearAtlasCache() {
  if (typeof window === "undefined") return;
  for (const key of CLOUD_KEYS) window.localStorage.removeItem(key);
}


