import { expect, test, type Page } from "@playwright/test";

const allowedCountries = ["娉曞浗", "鑻卞浗"];
const candidate = (institutionName: string, programmeName: string, country: string, url: string) => ({
  institution: institutionName, programme: programmeName, institutionName, programmeName, country, degreeLevel: "master",
  officialUrl: url, officialProgrammeUrl: url, fieldRelation: "synonym", academicStatus: "meets", languageStatus: "pending",
  budgetStatus: "pending", timelineStatus: "pending", verificationStatus: "verified", missingInformation: ["language score"],
  sources: [], matchExplanation: "Verified official programme", recommendationBand: "target", score: 90, verifiedProgramme: {},
});
const mockedCandidates = [
  candidate("KEDGE Business School", "MSc International Business", "娉曞浗", "https://student.kedge.edu/programmes/international-business"),
  candidate("University of Warwick", "International Business MSc", "鑻卞浗", "https://warwick.ac.uk/study/postgraduate/courses/msc-international-business/"),
];

async function mockRecommendationApi(page: Page) {
  await page.route("**/api/recommendations", async (route) => {
    const request = route.request().postDataJSON();
    expect(request.profile.targetCountryCodes).toEqual(["GB", "FR"]);
    expect(request.profile.targetDegreeLevel).toBe("纭曞＋");
    expect(request.profile.targetSubjects).toEqual(["International Business"]);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ candidates: mockedCandidates, generationStatus: "complete", aiStatus: "completed" }),
    });
  });
}

async function assertRenderedCards(page: Page) {
  const cards = page.getByTestId("recommendation-card");
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThanOrEqual(1);
  await expect(page.getByTestId("recommendation-error")).toHaveCount(0);
  await expect(page.getByTestId("recommendation-empty")).toHaveCount(0);
  for (const card of await cards.all()) {
    const country = (await card.getAttribute("data-country"))?.trim();
    const institution = (await card.getByTestId("institution-name").textContent())?.trim();
    const programme = (await card.getByTestId("programme-name").textContent())?.trim();
    expect(allowedCountries).toContain(country);
    expect(institution).toBeTruthy();
    expect(programme).toBeTruthy();
    expect(institution).not.toBe(programme);
  }
}

test("mock API candidates render as valid France and UK school cards", async ({ page }) => {
  const runId = "golden-recommendation-run";
  const profile = {
    name: "Golden Journey",
    educationHistory: [{ id: "education", country: "France", institutionNameZh: null, institutionNameEn: "Test University", degreeLevel: "bachelor", degreeName: null, major: "Business", graduationYear: 2026, graduationMonth: 6, graduationStatus: "graduated", arithmeticAverage: 80, weightedAverage: null, officialAverage: null, gpa: null, gradingSystem: "100", prerequisiteCourses: [] }],
    languageTests: [], workExperiences: [], internships: [], targetCountries: ["鑻卞浗", "娉曞浗"], targetCountryCodes: ["GB", "FR"],
    targetSubjects: ["International Business"], targetDegreeLevel: "纭曞＋", targetIntake: { year: 2027, term: "fall" },
    maxAnnualTuition: null, tuitionCurrency: null, preferredCities: [], crossDisciplinePreference: "related_only",
    acceptsPreMaster: false, acceptsLanguageCourse: true,
  };
  await mockRecommendationApi(page);
  await page.addInitScript(({ id, value }) => {
    const now = new Date().toISOString();
    localStorage.setItem("atlas.planning-runs.v1", JSON.stringify({ [id]: { id, profile: value, status: "created", createdAt: now, updatedAt: now } }));
    localStorage.setItem("atlas.active-planning-run-id.v1", id);
  }, { id: runId, value: profile });
  await page.goto(`/result?runId=${runId}`);
  await assertRenderedCards(page);
});

test("planner entry flow creates a profile and reaches rendered recommendations", async ({ page }) => {
  await mockRecommendationApi(page);
  await page.goto("/planner");
  await page.getByLabel("濮撳悕").fill("Golden Journey");
  await page.getByLabel("瀛︽牎鑻辨枃鍚?).fill("Test University");
  await page.getByLabel("涓撲笟", { exact: true }).fill("Business");
  await page.getByRole("checkbox", { name: "鑻卞浗", exact: true }).check();
  await page.getByRole("checkbox", { name: "娉曞浗", exact: true }).check();
  await page.getByLabel("鐩爣涓撲笟锛堢敤銆佸垎闅旓級").fill("International Business");
  await page.getByLabel("鐩爣瀛﹀巻灞傜骇").selectOption("纭曞＋");
  await page.getByRole("button", { name: "淇濆瓨缁熶竴璧勬枡骞堕噸鏂拌绠楁帹鑽? }).click();
  await expect(page).toHaveURL(/\/result\?runId=/);
  await assertRenderedCards(page);
});

