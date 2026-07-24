import assert from "node:assert/strict";
import test from "node:test";
import type { ApplicationRecord } from "./application-prototype-data";
import { archivePreviousVisaWorkspaces, emptyVisaFacts, generateVisaWorkspace, updateVisaTask, type VisaApplicantFacts, type VisaWorkspace } from "./visa-engine";

const application = (country: string, changes: Partial<ApplicationRecord> = {}): ApplicationRecord => ({
  id: `application-${country}`, planningRunId: "run-1", schoolRecommendationId: "school-1",
  universityName: "Example University", programName: "Master Programme", country, intake: "2026 fall",
  status: "unconditional_offer", detectedMaterialCount: 0, preparedMaterials: 0, totalMaterials: 1,
  missingMaterials: [], applicationProgress: 100, nextAction: "Visa", serviceType: "none",
  decisionStatus: "offer_received", offerEvidenceAvailable: true, offerConditionsSatisfied: true, isFinalOffer: true,
  ...changes,
});
const completeFacts: VisaApplicantFacts = {
  ...emptyVisaFacts, nationality: "China", residenceCountry: "China", age: 23, courseStartDate: "2026-09-15",
  courseDurationMonths: 12, hasDependants: false, hasSpecialApproval: false, hasSchoolVisaDocument: true,
  previousStudyOrResidence: false, hasVisaRefusalHistory: false,
};

test("does not create a workspace before a final offer is confirmed", () => {
  assert.equal(generateVisaWorkspace(application("英国", { isFinalOffer: false }), completeFacts), null);
});

test("does not create a workspace while offer conditions remain unmet", () => {
  assert.equal(generateVisaWorkspace(application("英国", { offerConditionsSatisfied: false }), completeFacts), null);
});

for (const [country, expected] of [["英国", "uk"], ["法国", "france"], ["澳洲", "australia"]] as const) {
  test(`creates the correct ${expected} workspace`, () => {
    assert.equal(generateVisaWorkspace(application(country), completeFacts)?.country, expected);
  });
}

test("unsupported countries never receive an unverified automated workflow", () => {
  assert.equal(generateVisaWorkspace(application("美国"), completeFacts), null);
});

test("missing personal facts blocks dependent tasks", () => {
  const workspace = generateVisaWorkspace(application("英国"), emptyVisaFacts)!;
  assert.equal(workspace.tasks.find((item) => item.id === "facts_confirmed")?.status, "needs_confirmation");
  assert.equal(workspace.tasks.find((item) => item.id === "online_application")?.status, "waiting_for_dependency");
});

test("not-applicable special evidence does not block later steps", () => {
  let workspace = generateVisaWorkspace(application("英国"), completeFacts)!;
  assert.equal(workspace.tasks.find((item) => item.id === "health_special")?.status, "not_applicable");
  assert.ok(workspace.materials.filter((item) => item.id.startsWith("uk-special")).every((item) => !item.required && item.status === "not_applicable"));
  workspace = updateVisaTask(workspace, "finance", "completed");
  assert.equal(workspace.tasks.find((item) => item.id === "online_application")?.status, "not_started");
});

test("a waiting task cannot be falsely marked completed", () => {
  const workspace = generateVisaWorkspace(application("英国"), emptyVisaFacts)!;
  const result = updateVisaTask(workspace, "online_application", "completed");
  assert.equal(result.tasks.find((item) => item.id === "online_application")?.status, "waiting_for_dependency");
});

test("changing final offer archives the old workspace without deleting it", () => {
  const old = generateVisaWorkspace(application("英国"), completeFacts)!;
  const archived = archivePreviousVisaWorkspaces([old], "application-法国", "French School", "2026-07-24T12:00:00.000Z");
  assert.equal(archived.length, 1);
  assert.equal(archived[0].status, "archived");
  assert.match(archived[0].archiveReason ?? "", /French School/);
});

test("every generated hard requirement has an official source and rule version", () => {
  for (const country of ["英国", "法国", "澳洲"]) {
    const workspace = generateVisaWorkspace(application(country), completeFacts)!;
    assert.ok(workspace.ruleVersion);
    assert.ok(workspace.ruleVerifiedAt);
    assert.ok(workspace.materials.every((item) => item.officialSource.url.startsWith("https://")));
  }
});

test("completed state survives recalculation", () => {
  let workspace = generateVisaWorkspace(application("澳洲"), completeFacts)!;
  workspace = updateVisaTask(workspace, "finance", "completed");
  const recalculated = generateVisaWorkspace(application("澳洲"), completeFacts, workspace)!;
  assert.equal(recalculated.tasks.find((item) => item.id === "finance")?.status, "completed");
});

for (const [country, expected] of [["英国", "uk"], ["法国", "france"], ["澳洲", "australia"]] as const) {
  for (let scenario = 1; scenario <= 10; scenario += 1) {
    test(`${expected} complete-flow acceptance scenario ${scenario}/10`, () => {
      const facts: VisaApplicantFacts = {
        ...completeFacts,
        tuition: 20_000 + scenario * 500,
        tuitionCurrency: expected === "uk" ? "GBP" : expected === "france" ? "EUR" : "AUD",
        tuitionPaid: scenario * 100,
        scholarship: scenario % 3 === 0 ? 1_000 : 0,
      };
      let workspace = generateVisaWorkspace(application(country, { id: `${expected}-${scenario}` }), facts)!;
      for (const task of workspace.tasks) {
        if (!["completed", "not_applicable", "waiting_for_dependency", "needs_review"].includes(task.status)) workspace = updateVisaTask(workspace, task.id, "completed");
      }
      assert.equal(workspace.country, expected);
      assert.equal(workspace.tasks.some((task) => task.status === "blocked"), false);
      assert.ok(workspace.materials.every((item) => item.officialSource.url.startsWith("https://")));
      assert.ok(workspace.materials.filter((item) => !item.required).every((item) => item.status === "not_applicable"));
    });
  }
}

test("complex refusal, dependant or minor cases require human review", () => {
  const workspace = generateVisaWorkspace(application("英国"), { ...completeFacts, hasVisaRefusalHistory: true })!;
  assert.equal(workspace.tasks.find((item) => item.id === "facts_confirmed")?.status, "needs_review");
  assert.equal(workspace.tasks.find((item) => item.id === "online_application")?.status, "waiting_for_dependency");
});

void (null as unknown as VisaWorkspace);

