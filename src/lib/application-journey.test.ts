import assert from "node:assert/strict";
import test from "node:test";
import type { ApplicationRecord } from "./application-prototype-data";
import {
  attachOfferEvidence,
  applicationProgressFor,
  chooseSubmissionMode,
  confirmApplicationSubmitted,
  getVerifiedApplicationPortal,
  inferSubmissionMode,
  isVisaUnlocked,
  markPortalOpened,
} from "./application-journey";

function application(id: string, changes: Partial<ApplicationRecord> = {}): ApplicationRecord {
  return {
    id,
    planningRunId: "run-1",
    schoolRecommendationId: `school-${id}`,
    universityName: `School ${id}`,
    programName: `Programme ${id}`,
    country: id === "a" ? "法国" : "英国",
    intake: "2027 秋季",
    status: "ready_to_submit",
    detectedMaterialCount: 8,
    preparedMaterials: 8,
    totalMaterials: 8,
    missingMaterials: [],
    applicationProgress: 60,
    nextAction: "选择申请方式",
    serviceType: "none",
    submissionMode: "unselected",
    applicationPortalUrl: `https://apply.example.edu/${id}`,
    applicationProvider: "university",
    applicationLinkStatus: "verified",
    updatedAt: "2026-07-24T00:00:00.000Z",
    ...changes,
  };
}

test("two schools can keep independent submission modes", () => {
  const first = chooseSubmissionMode(application("a"), "diy");
  const second = chooseSubmissionMode(application("b"), "atlas_single");
  assert.equal(first.submissionMode, "diy");
  assert.equal(second.submissionMode, "atlas_single");
});

test("choosing DIY for one school does not change another", () => {
  const records = [application("a"), application("b")];
  const next = records.map((item) => item.id === "a" ? chooseSubmissionMode(item, "diy") : item);
  assert.equal(next[0].submissionMode, "diy");
  assert.equal(next[1].submissionMode, "unselected");
});

test("opening a verified portal is not submission", () => {
  const next = markPortalOpened(application("a"), "2026-07-24T12:00:00.000Z");
  assert.equal(next.status, "submission_in_progress");
  assert.equal(next.submittedAt, undefined);
});

test("application progress follows the journey completion scale", () => {
  assert.equal(applicationProgressFor("preparing_materials", 0, 8), 15);
  assert.equal(applicationProgressFor("preparing_materials", 8, 8), 60);
  assert.equal(applicationProgressFor("ready_to_submit"), 70);
  assert.equal(applicationProgressFor("submission_in_progress"), 75);
  assert.equal(applicationProgressFor("submitted"), 85);
  assert.equal(applicationProgressFor("waiting_result"), 90);
  assert.equal(applicationProgressFor("conditional_offer"), 95);
  assert.equal(applicationProgressFor("unconditional_offer"), 98);
  assert.equal(applicationProgressFor("accepted"), 100);
});

test("confirming submission enters waiting result", () => {
  const next = confirmApplicationSubmitted(application("a"), { submittedAt: "2026-07-24T12:00:00.000Z" });
  assert.equal(next.status, "waiting_result");
  assert.equal(next.decisionStatus, "waiting_result");
});

test("legacy global application mode only migrates missing per-school mode", () => {
  assert.equal(inferSubmissionMode(application("a", { submissionMode: undefined as never }), "DIY"), "diy");
  assert.equal(inferSubmissionMode(application("a", { submissionMode: "atlas_single" }), "DIY"), "atlas_single");
});

test("invalid and unverified portals never open", () => {
  assert.equal(getVerifiedApplicationPortal(application("a", { applicationLinkStatus: "needs_review" })), null);
  assert.equal(getVerifiedApplicationPortal(application("a", { applicationPortalUrl: "http://apply.example.edu" })), null);
  assert.equal(getVerifiedApplicationPortal(application("a", { applicationPortalUrl: "https://atlas.invalid/apply" })), null);
});

test("uploading an offer changes only the selected school", () => {
  const records = [application("a", { status: "waiting_result" }), application("b", { status: "waiting_result" })];
  const next = records.map((item) => item.id === "a" ? attachOfferEvidence(item, "offer.pdf") : item);
  assert.equal(next[0].status, "conditional_offer");
  assert.equal(next[1].status, "waiting_result");
});

test("offer evidence unlocks visa before final offer selection", () => {
  const offered = attachOfferEvidence(application("a", { status: "waiting_result" }), "offer.pdf");
  assert.equal(isVisaUnlocked([offered]), true);
  assert.equal(offered.isFinalOffer, undefined);
});

test("offer upload does not create or select a final visa workspace", () => {
  const offered = attachOfferEvidence(application("a", { status: "waiting_result" }), "offer.pdf");
  assert.equal(offered.isFinalOffer, undefined);
  assert.equal(offered.status, "conditional_offer");
});

test("unconditional offer records satisfied conditions without accepting it", () => {
  const offered = attachOfferEvidence(application("a", { status: "waiting_result" }), "offer.pdf", true);
  assert.equal(offered.status, "unconditional_offer");
  assert.equal(offered.offerConditionsSatisfied, true);
  assert.equal(offered.isFinalOffer, undefined);
});

