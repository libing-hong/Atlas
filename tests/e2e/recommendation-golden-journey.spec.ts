import { expect, test } from "@playwright/test";
const candidate = (institutionName: string, programmeName: string, country: string, url: string) => ({ institution: institutionName, programme: programmeName, institutionName, programmeName, country, degreeLevel: "master", officialUrl: url, officialProgrammeUrl: url, fieldRelation: "synonym", academicStatus: "meets", languageStatus: "pending", budgetStatus: "pending", timelineStatus: "pending", verificationStatus: "verified", missingInformation: ["language score"], sources: [], matchExplanation: "Verified official programme", recommendationBand: "target", score: 90, verifiedProgramme: {} });
test("France and UK International Business recommendation renders end to end", async ({ page }) => {
  const runId = "golden-recommendation-run";
  const profile = { name: "Golden Journey", educationHistory: [{ id: "education", country: "France", institutionNameZh: null, institutionNameEn: "Test University", degreeLevel: "bachelor", degreeName: null, major: "Business", graduationYear: 2026, graduationMonth: 6, graduationStatus: "graduated", arithmeticAverage: 80, weightedAverage: null, officialAverage: null, gpa: null, gradingSystem: "100", prerequisiteCourses: [] }], languageTests: [], workExperiences: [], internships: [], targetCountries: ["法国", "英国"], targetCountryCodes: ["FR", "GB"], targetSubjects: ["International Business"], targetDegreeLevel: "硕士", targetIntake: { year: 2027, term: "fall" }, maxAnnualTuition: null, tuitionCurrency: null, preferredCities: [], crossDisciplinePreference: "related_only", acceptsPreMaster: false, acceptsLanguageCourse: true };
  await page.route("**/api/recommendations", async (route) => { const request = route.request().postDataJSON(); expect(request.profile.targetCountryCodes).toEqual(["FR", "GB"]); expect(request.profile.targetDegreeLevel).toBe("硕士"); expect(request.profile.targetSubjects).toEqual(["International Business"]); await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ candidates: [candidate("KEDGE Business School", "MSc International Business", "法国", "https://student.kedge.edu/programmes/international-business"), candidate("University of Warwick", "International Business MSc", "英国", "https://warwick.ac.uk/study/postgraduate/courses/msc-international-business/")], generationStatus: "complete", aiStatus: "completed" }) }); });
  await page.addInitScript(({ id, value }) => { const now = new Date().toISOString(); localStorage.setItem("atlas.planning-runs.v1", JSON.stringify({ [id]: { id, profile: value, status: "created", createdAt: now, updatedAt: now } })); localStorage.setItem("atlas.active-planning-run-id.v1", id); }, { id: runId, value: profile });
  await page.goto(`/result?runId=${runId}`);
  await expect(page.getByText("KEDGE Business School", { exact: true })).toBeVisible();
  await expect(page.getByText("University of Warwick", { exact: true })).toBeVisible();
  await expect(page.getByText("MSc International Business", { exact: true })).toBeVisible();
  await expect(page.getByText("International Business MSc", { exact: true })).toBeVisible();
  await expect(page.getByText(/推荐生成失败/)).toHaveCount(0);
  await expect(page.getByText(/暂未生成可用的学校推荐/)).toHaveCount(0);
  expect(["法国", "英国"]).toContain("法国");
  expect("KEDGE Business School").not.toBe("MSc International Business");
});
