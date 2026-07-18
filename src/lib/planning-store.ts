import type { StudentProfile } from "./student-profile";
import type { PlanningReport } from "./planning-report";
import type { ProgrammeCandidate } from "./recommendation/types";

export type PlanningRunStatus = "created" | "report_ready" | "schools_selected" | "schools_confirmed";
export type PlanningRun = { id: string; profile: StudentProfile; status: PlanningRunStatus; createdAt: string; updatedAt: string };

const runsKey = "atlas.planning-runs.v1";
const activeRunKey = "atlas.active-planning-run-id.v1";
const reportsKey = "atlas.planning-reports.v1";
const planningEvent = "atlas-planning-state-change";
const recommendationCandidatesKey = "atlas.recommendation-candidates.v2";

type StoredRecommendationCandidates = { profile: StudentProfile; candidates: ProgrammeCandidate[] };

function readMap<T>(key: string): Record<string, T> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(key) ?? "{}") as Record<string, T>; } catch { return {}; }
}
function writeMap<T>(key: string, value: Record<string, T>) {
  if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value));
}
function safeJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { return JSON.parse(window.localStorage.getItem(key) ?? JSON.stringify(fallback)) as T; } catch { return fallback; }
}

export function emitPlanningStateChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(planningEvent));
  window.dispatchEvent(new Event("atlas-application-state-change"));
}
export function subscribeToPlanningState(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(planningEvent, onChange);
  window.addEventListener("storage", onChange);
  return () => { window.removeEventListener(planningEvent, onChange); window.removeEventListener("storage", onChange); };
}
export function getPlanningStateSnapshot() {
  if (typeof window === "undefined") return "server";
  const activeRunId = readActivePlanningRunId();
  return JSON.stringify({
    activeRunId,
    run: activeRunId ? readPlanningRun(activeRunId) : undefined,
    report: activeRunId ? readPlanningReport(activeRunId) : undefined,
    selection: readRunSelection(activeRunId),
    records: safeJson("atlas.application.records.v1", []),
  });
}
export function getServerPlanningStateSnapshot() { return "server"; }

export function createPlanningRun(profile: StudentProfile): PlanningRun {
  if (typeof window === "undefined") throw new Error("Planning runs can only be created in the browser");
  const now = new Date().toISOString();
  const run: PlanningRun = {
    id: `run-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    profile, status: "created", createdAt: now, updatedAt: now,
  };
  const runs = readMap<PlanningRun>(runsKey);
  runs[run.id] = run;
  writeMap(runsKey, runs);
  window.localStorage.setItem(activeRunKey, run.id);
  emitPlanningStateChange();
  return run;
}
export function readPlanningRun(id?: string | null) { return id ? readMap<PlanningRun>(runsKey)[id] : undefined; }
export function readActivePlanningRunId() {
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem(activeRunKey) ?? undefined;
}
export function readActivePlanningRun() { return readPlanningRun(readActivePlanningRunId()); }
export function updatePlanningRun(id: string, changes: Partial<Pick<PlanningRun, "profile" | "status">>) {
  const runs = readMap<PlanningRun>(runsKey);
  const current = runs[id];
  if (!current) return undefined;
  const next = { ...current, ...changes, updatedAt: new Date().toISOString() };
  runs[id] = next;
  writeMap(runsKey, runs);
  emitPlanningStateChange();
  return next;
}
export function writePlanningReport(report: PlanningReport) {
  const reports = readMap<PlanningReport>(reportsKey);
  reports[report.planningRunId] = report;
  writeMap(reportsKey, reports);
  updatePlanningRun(report.planningRunId, { status: "report_ready" });
}
export function readPlanningReport(runId?: string | null) { return runId ? readMap<PlanningReport>(reportsKey)[runId] : undefined; }
export function writeRecommendationCandidates(runId: string, profile: StudentProfile, candidates: ProgrammeCandidate[]) {
  const stored = readMap<StoredRecommendationCandidates>(recommendationCandidatesKey);
  stored[runId] = { profile, candidates };
  writeMap(recommendationCandidatesKey, stored);
}
export function readRecommendationCandidates(runId?: string | null, profile?: StudentProfile) {
  if (!runId) return undefined;
  const stored = readMap<StoredRecommendationCandidates>(recommendationCandidatesKey)[runId];
  if (!stored || (profile && JSON.stringify(stored.profile) !== JSON.stringify(profile))) return undefined;
  return stored.candidates;
}
export function readRunSelection(runId?: string | null) { return runId ? readMap<string[]>("atlas.application.selection.v2")[runId] ?? [] : []; }
export function writeRunSelection(runId: string, ids: string[]) {
  const selections = readMap<string[]>("atlas.application.selection.v2");
  selections[runId] = [...new Set(ids)];
  writeMap("atlas.application.selection.v2", selections);
  updatePlanningRun(runId, { status: ids.length ? "schools_selected" : "report_ready" });
}
export function readRunComparisonSelection(runId?: string | null) { return runId ? readMap<string[]>("atlas.school-comparison.selection.v2")[runId] ?? [] : []; }
export function writeRunComparisonSelection(runId: string, ids: string[]) {
  const selections = readMap<string[]>("atlas.school-comparison.selection.v2");
  selections[runId] = [...new Set(ids)].slice(0, 3);
  writeMap("atlas.school-comparison.selection.v2", selections);
  emitPlanningStateChange();
}

export function resetDerivedPlanningState(runId: string) {
  if (typeof window === "undefined") return;
  const reports = readMap<PlanningReport>(reportsKey); delete reports[runId]; writeMap(reportsKey, reports);
  const candidates = readMap<StoredRecommendationCandidates>(recommendationCandidatesKey); delete candidates[runId]; writeMap(recommendationCandidatesKey, candidates);
  const selections = readMap<string[]>("atlas.application.selection.v2"); selections[runId] = []; writeMap("atlas.application.selection.v2", selections);
  const comparisons = readMap<string[]>("atlas.school-comparison.selection.v2"); comparisons[runId] = []; writeMap("atlas.school-comparison.selection.v2", comparisons);
  ["atlas.application.selection.v1", "atlas.school-comparison.selection.v1", "atlas.school-comparison.result.v1", "atlas.application.workspace.v1", "atlas.application.mode.v1"].forEach((key) => window.localStorage.removeItem(key));
  const orders = safeJson<Array<{ status?: string }>>("atlas.service-orders.v1", []);
  window.localStorage.setItem("atlas.service-orders.v1", JSON.stringify(orders.filter((order) => !["draft", "pending_payment"].includes(order.status ?? ""))));
  window.localStorage.removeItem("atlas.active-service-order.v1");
  emitPlanningStateChange();
}

export function clearPrototypePlanningData() {
  if (typeof window === "undefined") return;
  const records = safeJson<Array<{ status?: string }>>("atlas.application.records.v1", []);
  const protectedStatuses = new Set(["submitted", "waiting_result", "supplement_required", "offer_received"]);
  window.localStorage.setItem("atlas.application.records.v1", JSON.stringify(records.filter((record) => protectedStatuses.has(record.status ?? ""))));
  const orders = safeJson<Array<{ status?: string }>>("atlas.service-orders.v1", []);
  window.localStorage.setItem("atlas.service-orders.v1", JSON.stringify(orders.filter((order) => ["paid", "processing", "refunded"].includes(order.status ?? ""))));
  [runsKey, activeRunKey, reportsKey, recommendationCandidatesKey, "atlas.student-profile.v2", "atlas.application.selection.v1", "atlas.application.selection.v2", "atlas.application.workspace.v1", "atlas.application.mode.v1", "atlas.active-service-order.v1", "atlas.school-comparison.selection.v1", "atlas.school-comparison.selection.v2", "atlas.school-comparison.result.v1"].forEach((key) => window.localStorage.removeItem(key));
  emitPlanningStateChange();
}

