import test from "node:test";
import assert from "node:assert/strict";
import { recommendations, createApplicationRecord } from "./application-prototype-data";
import { buildProgramPortfolio } from "./program-matching";
import { buildPlanningReport } from "./planning-report";
import type { StudentProfile } from "./student-profile";

function profile(overrides: Partial<StudentProfile>): StudentProfile {
  return {
    name: "测试用户",
    degreeLevel: "本科",
    institutionNameZh: "测试大学",
    institutionNameEn: "Test University",
    institutionCountry: "中国",
    graduationDate: { year: 2026, month: 6 },
    currentMajor: "管理学",
    languageTests: [],
    workExperiences: [],
    internships: [],
    targetCountries: ["英国"],
    targetSubjects: ["管理学"],
    targetIntake: { year: 2027, term: "fall" },
    budgetMin: 15000,
    budgetMax: 35000,
    preferredCities: [],
    acceptsCrossDiscipline: false,
    acceptsPreMaster: false,
    acceptsLanguageCourse: true,
    ...overrides,
  };
}

const userA = profile({
  name: "用户 A", institutionNameZh: "深圳大学", institutionNameEn: "Shenzhen University",
  currentMajor: "市场营销", averageScore: 78,
  languageTests: [{ type: "IELTS Academic", overall: 6.5 }],
  workExperiences: [{ role: "市场营销实习" }],
  targetCountries: ["英国", "法国"], targetSubjects: ["市场营销"], budgetMax: 35000,
});
const userB = profile({
  name: "用户 B", institutionNameZh: "普通本科院校", institutionNameEn: "General Undergraduate College",
  currentMajor: "计算机专业", averageScore: 70, languageTests: [],
  targetCountries: ["澳洲"], targetSubjects: ["计算机", "数据分析"], budgetMax: 25000,
});
const userC = profile({
  name: "用户 C", institutionNameZh: "某985大学", institutionNameEn: "A 985 University",
  currentMajor: "金融专业", averageScore: 88,
  languageTests: [{ type: "IELTS Academic", overall: 7.5 }],
  workExperiences: [{ role: "金融实习" }],
  targetCountries: ["英国"], targetSubjects: ["金融"], budgetMax: 50000,
});

function result(student: StudentProfile, id: string) {
  const portfolio = buildProgramPortfolio(student, recommendations);
  return { portfolio, report: buildPlanningReport(student, portfolio, id) };
}

test("three planning users receive distinct dynamic reports", () => {
  const results = [result(userA, "run-a"), result(userB, "run-b"), result(userC, "run-c")];
  assert.equal(new Set(results.map((item) => item.report.competitivenessScore)).size, 3);
  assert.equal(new Set(results.map((item) => JSON.stringify(item.report.countryFit))).size, 3);
  assert.equal(new Set(results.map((item) => JSON.stringify(item.report.strengths))).size, 3);
  assert.equal(new Set(results.map((item) => JSON.stringify(item.report.preparationItems))).size, 3);
  assert.ok(results[0].portfolio[0].result.recommendationReason.includes("深圳大学"));
  assert.ok(results[1].portfolio.some((item) => item.result.recommendationReason.includes("尚未提供语言成绩")));
  assert.ok(results[2].portfolio[0].result.recommendationReason.includes("88%"));
});

test("recommendation order and categories react to each profile", () => {
  const portfolios = [userA, userB, userC].map((student) => buildProgramPortfolio(student, recommendations));
  assert.ok(new Set(portfolios.map((items) => items[0]?.school.id)).size >= 2);
  assert.ok(new Set(portfolios.map((items) => JSON.stringify(items.map((item) => item.result.category)))).size >= 2);
});

test("application records remain isolated by planning run", () => {
  const school = recommendations[0];
  assert.ok(school);
  const a = createApplicationRecord(school, "run-a");
  const b = createApplicationRecord(school, "run-b");
  assert.notEqual(a.id, b.id);
  assert.equal(a.planningRunId, "run-a");
  assert.equal(b.planningRunId, "run-b");
});
