import { expect, test } from "@playwright/test";

test("two-school DIY submission, Offer upload and visa workspace journey", async ({ page, context }) => {
  const runId = "application-journey-run";
  const now = "2026-07-24T12:00:00.000Z";
  const profile = {
    name: "Application Journey",
    educationHistory: [],
    languageTests: [],
    workExperiences: [],
    internships: [],
    targetCountries: ["法国", "英国"],
    targetCountryCodes: ["FR", "GB"],
    targetSubjects: ["International Business"],
    targetDegreeLevel: "硕士",
    targetIntake: { year: 2027, term: "fall" },
    maxAnnualTuition: null,
    tuitionCurrency: null,
    preferredCities: [],
    crossDisciplinePreference: "related_only",
    acceptsPreMaster: false,
    acceptsLanguageCourse: true,
  };
  await page.addInitScript(({ id, value, createdAt }) => {
    localStorage.setItem("atlas.planning-runs.v1", JSON.stringify({ [id]: { id, profile: value, status: "schools_confirmed", createdAt, updatedAt: createdAt } }));
    localStorage.setItem("atlas.active-planning-run-id.v1", id);
    localStorage.setItem("atlas.application.selection.v2", JSON.stringify({ [id]: ["school-a", "school-b"] }));
    localStorage.setItem("atlas.application.records.v1", JSON.stringify([
      {
        id: "app-a",
        planningRunId: id,
        schoolRecommendationId: "school-a",
        universityName: "KEDGE Business School",
        programName: "MSc International Business",
        country: "法国",
        intake: "2027 秋季",
        status: "ready_to_submit",
        detectedMaterialCount: 8,
        preparedMaterials: 8,
        totalMaterials: 8,
        missingMaterials: [],
        applicationProgress: 60,
        nextAction: "选择申请方式",
        nextDeadline: "2027-01-15",
        serviceType: "none",
        submissionMode: "unselected",
        applicationPortalUrl: "https://apply.example.edu/kedge",
        applicationProvider: "university",
        applicationLinkStatus: "verified",
        decisionStatus: "waiting_result",
        updatedAt: createdAt,
      },
      {
        id: "app-b",
        planningRunId: id,
        schoolRecommendationId: "school-b",
        universityName: "University of Warwick",
        programName: "MSc International Business",
        country: "英国",
        intake: "2027 秋季",
        status: "ready_to_submit",
        detectedMaterialCount: 8,
        preparedMaterials: 8,
        totalMaterials: 8,
        missingMaterials: [],
        applicationProgress: 60,
        nextAction: "选择申请方式",
        nextDeadline: "2027-01-15",
        serviceType: "none",
        submissionMode: "unselected",
        applicationPortalUrl: "https://apply.example.edu/warwick",
        applicationProvider: "university",
        applicationLinkStatus: "verified",
        decisionStatus: "waiting_result",
        updatedAt: createdAt,
      },
    ]));
  }, { id: runId, value: profile, createdAt: now });
  await context.route("https://apply.example.edu/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<h1>Mock official application portal</h1>" }));
  await page.goto(`/applications?runId=${runId}`);
  await expect(page.getByRole("heading", { name: "多校申请总览" })).toBeVisible();
  await expect(page.getByText("KEDGE Business School").first()).toBeVisible();
  await expect(page.getByText("University of Warwick").first()).toBeVisible();

  const kedge = page.getByTestId("application-progress-app-a");
  const warwick = page.getByTestId("application-progress-app-b");
  await kedge.getByRole("button", { name: "用户自行提交" }).click();
  await expect(kedge.getByText("申请方式：用户自行提交", { exact: true })).toBeVisible();
  await expect(warwick.getByText("申请方式：尚未选择", { exact: true })).toBeVisible();

  const popupPromise = page.waitForEvent("popup");
  await kedge.getByRole("button", { name: "前往学校申请系统" }).click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL("https://apply.example.edu/kedge");
  await popup.close();
  await expect(kedge.getByText("已打开官方申请系统")).toBeVisible();
  await expect(kedge.getByText("正在填写官方申请")).toBeVisible();

  await kedge.getByRole("button", { name: "我已提交申请" }).click();
  await kedge.getByRole("button", { name: "确认已完成正式提交" }).click();
  await expect(kedge.getByText("等待学校结果")).toBeVisible();
  await expect(warwick.getByText("可以提交")).toBeVisible();

  await kedge.locator('input[type="file"]').first().setInputFiles({
    name: "mock-kedge-offer.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("mock offer"),
  });
  await expect(kedge.getByText("收到有条件 Offer")).toBeVisible();
  await expect(page.getByRole("link", { name: "进入我的签证" })).toBeVisible();

  await page.getByRole("link", { name: "进入我的签证" }).click();
  await expect(page.getByRole("heading", { name: "确认最终入读学校后，Atlas 会生成签证流程" })).toBeVisible();
  await page.getByRole("button", { name: "确认 Offer 条件已满足" }).click();
  await page.getByRole("button", { name: "确认作为最终接受的 Offer" }).click();
  await expect(page.getByRole("heading", { name: "学生长期签证", level: 1 })).toBeVisible();
});

