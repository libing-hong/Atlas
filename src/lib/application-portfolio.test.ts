import assert from "node:assert/strict";
import test from "node:test";
import { buildMaterialReadiness, formatApplicationDeadline, getApplicationSummary } from "./application-portfolio";
import { createApplicationRecord, type SchoolRecommendation } from "./application-prototype-data";

const school: SchoolRecommendation = {
  id: "programme-1",
  universityId: "university-1",
  universityName: "Example University",
  programName: "Master in Management",
  country: "法国",
  city: "Paris",
  intake: "2027 秋季",
  duration: "1 年",
  tuition: 20_000,
  currency: "EUR",
  deadline: "2027-01-15",
  deadlineType: "official",
  category: "target",
  reasons: [],
  matchedRequirements: [],
  risks: [],
  requirements: ["本科成绩单", "英语语言成绩"],
  admissionRequirements: [{ id: "degree", label: "学位要求", schoolRequirement: "Bachelor required", userSituation: "本科已完成", status: "meets" }],
  materialsReady: 2,
  materialsTotal: 6,
  isSelected: true,
  isConfirmed: true,
  applicationLinkStatus: "verified",
  recommendationContent: { summary: "", personalFit: "", schoolHighlights: "", programHighlights: "", cautions: [], sources: [{ label: "官方项目页", url: "https://example.edu/programme" }] },
};

test("application record snapshots programme evidence at confirmation", () => {
  const record = createApplicationRecord(school, "run-1");
  assert.equal(record.programmeEvidenceSnapshot?.admissionRequirements[0]?.schoolRequirement, "Bachelor required");
  assert.equal(record.programmeEvidenceSnapshot?.sources[0]?.url, "https://example.edu/programme");
});

test("material readiness is derived from required material statuses", () => {
  const record = createApplicationRecord(school, "run-1");
  const readiness = buildMaterialReadiness(record, school, { passport: "confirmed", transcript: "confirmed", degree: "not_detected" });
  assert.equal(readiness.ready, 2);
  assert.equal(readiness.total, readiness.items.length);
  assert.ok(readiness.items.some((item) => item.label === "Missing"));
});

test("summary derives totals, seven-day deadlines, and blockers", () => {
  const record = { ...createApplicationRecord(school, "run-1"), nextDeadline: "2027-01-15", status: "supplement_required" as const };
  const readiness = buildMaterialReadiness(record, school);
  const summary = getApplicationSummary([record], { [record.id]: readiness }, new Date("2027-01-10T12:00:00Z"));
  assert.deepEqual(summary, { total: 1, preparing: 1, deadlineSoon: 1, blocked: 1 });
});

test("deadline labels never expose internal missing-data copy", () => {
  assert.equal(formatApplicationDeadline("2027-01-15"), "15 Jan 2027");
  assert.equal(formatApplicationDeadline("滚动录取"), "Rolling");
  assert.equal(formatApplicationDeadline("DB missing"), "官方轮次更新中");
});
