import test from "node:test";
import assert from "node:assert/strict";
import { classifyProgrammeLead } from "./programme-discovery";
import { expandField } from "./field-expansion";
import { validateProgrammeForDisplay } from "./eligibility";
import { retrieveCachedVerifiedProgrammes } from "./programme-repository";
import { understandProfile } from "./profile-understanding";
import { normalizeStudentProfile } from "../student-profile";
import type { ProgrammeCandidate, UnderstoodProfile, VerifiedProgramme } from "./types";

const verifiedProgramme: VerifiedProgramme = {
  institutionName: "KEDGE Business School", programmeName: "MSc Arts & Creative Industries Management", country: "法国", officialProgrammeUrl: "https://student.kedge.edu/programmes/arts-creative-industries-management", officialRootDomain: "kedge.edu", degreeType: "MSc", degreeLevel: "master", campus: { value: "Paris", sourceUrl: "https://student.kedge.edu/programmes/arts-creative-industries-management", retrievedAt: "2026-07-17", verificationStatus: "verified" }, fieldRelation: "highly_related", sourceType: "official", active: { value: true, sourceUrl: "https://student.kedge.edu/programmes/arts-creative-industries-management", retrievedAt: "2026-07-17", verificationStatus: "verified" }, intake: { value: null, sourceUrl: "https://student.kedge.edu/programmes/arts-creative-industries-management", retrievedAt: "2026-07-17", verificationStatus: "pending" }, teachingLanguage: { value: "English", sourceUrl: "https://student.kedge.edu/programmes/arts-creative-industries-management", retrievedAt: "2026-07-17", verificationStatus: "verified" }, degreeRequirement: { value: null, sourceUrl: "https://student.kedge.edu/programmes/arts-creative-industries-management", retrievedAt: "2026-07-17", verificationStatus: "pending" }, subjectRequirement: { value: null, sourceUrl: "https://student.kedge.edu/programmes/arts-creative-industries-management", retrievedAt: "2026-07-17", verificationStatus: "pending" }, gradeRequirement: { value: null, sourceUrl: "https://student.kedge.edu/programmes/arts-creative-industries-management", retrievedAt: "2026-07-17", verificationStatus: "pending" }, languageRequirement: { value: null, sourceUrl: "https://student.kedge.edu/programmes/arts-creative-industries-management", retrievedAt: "2026-07-17", verificationStatus: "pending" }, tuition: { value: null, sourceUrl: "https://student.kedge.edu/programmes/arts-creative-industries-management", retrievedAt: "2026-07-17", verificationStatus: "pending" }, tuitionCurrency: { value: null, sourceUrl: "https://student.kedge.edu/programmes/arts-creative-industries-management", retrievedAt: "2026-07-17", verificationStatus: "pending" }, deadline: { value: null, sourceUrl: "https://student.kedge.edu/programmes/arts-creative-industries-management", retrievedAt: "2026-07-17", verificationStatus: "pending" }, applicationUrl: { value: null, sourceUrl: "https://student.kedge.edu/programmes/arts-creative-industries-management", retrievedAt: "2026-07-17", verificationStatus: "pending" }, discoveryQuery: "regression", discoveredAt: "2026-07-17"
};
const candidate: ProgrammeCandidate = { institution: verifiedProgramme.institutionName, programme: verifiedProgramme.programmeName, institutionName: verifiedProgramme.institutionName, programmeName: verifiedProgramme.programmeName, country: "法国", degreeLevel: "master", officialUrl: verifiedProgramme.officialProgrammeUrl, officialProgrammeUrl: verifiedProgramme.officialProgrammeUrl, fieldRelation: "highly_related", academicStatus: "pending", languageStatus: "pending", budgetStatus: "pending", timelineStatus: "pending", verificationStatus: "partially_verified", missingInformation: [], sources: [{ sourceUrl: verifiedProgramme.officialProgrammeUrl, retrievedAt: "2026-07-17", verificationStatus: "verified", fields: ["programme"], sourceType: "official" }], matchExplanation: "与目标专业高度相关", recommendationBand: "needs_confirmation", score: 70, verifiedProgramme };
const profile = { targetCountries: ["法国", "英国"], targetDegreeLevel: "master" } as UnderstoodProfile;

test("polluting search results never become official programme leads", () => {
  assert.equal(classifyProgrammeLead({ title: "The Manual of Museum Management", url: "https://amazon.com/book" }), "marketplace");
  assert.equal(classifyProgrammeLead({ title: "英国法学排名 Top 5", url: "https://gostudyin.com/blog/law-ranking" }), "blog");
  assert.equal(classifyProgrammeLead({ title: "Association of Arts Administration directory", url: "https://artsadministration.org/directory" }), "association");
});
test("law expansion searches official degree names", () => { const terms = expandField("法学").map(item => item.term); for (const required of ["Law", "LLM", "Master of Laws", "International Law", "Business Law", "Commercial Law", "European Law", "Human Rights Law"]) assert.ok(terms.includes(required)); });
test("display validator enforces country, degree, names and official source", () => {
  assert.equal(validateProgrammeForDisplay(candidate, profile), true);
  assert.equal(validateProgrammeForDisplay({ ...candidate, country: "美国", verifiedProgramme: { ...verifiedProgramme, country: "美国" } }, profile), false);
  assert.equal(validateProgrammeForDisplay({ ...candidate, programmeName: "" }, profile), false);
  assert.equal(validateProgrammeForDisplay({ ...candidate, degreeLevel: "bachelor", verifiedProgramme: { ...verifiedProgramme, degreeLevel: "bachelor" } }, profile), false);
});

function understood(countries: string[], subject: string, languageTests: unknown[] = [], budget: number | null = null) {
  return understandProfile(normalizeStudentProfile({ targetCountries: countries, targetSubjects: [subject], targetDegreeLevel: "硕士", languageTests, maxAnnualTuition: budget, tuitionCurrency: "EUR" }));
}

test("France and UK arts management retrieves related official programmes without US results", () => {
  const value = understood(["法国", "英国"], "艺术管理");
  const results = retrieveCachedVerifiedProgrammes(value, expandField(value.targetField));
  assert.ok(results.some(item => item.institutionName === "KEDGE Business School"));
  assert.ok(results.every(item => value.targetCountries.includes(item.country)));
});

test("France law retrieves real law programmes with distinct institution and programme names", () => {
  const value = understood(["法国"], "法学");
  const results = retrieveCachedVerifiedProgrammes(value, expandField(value.targetField));
  assert.ok(results.length >= 2);
  assert.ok(results.every(item => item.institutionName !== item.programmeName && item.officialProgrammeUrl.startsWith("https://")));
});

test("missing language scores do not remove cached programmes", () => {
  const value = understood(["英国"], "法学");
  assert.ok(retrieveCachedVerifiedProgrammes(value, expandField(value.targetField)).length > 0);
});

test("a school remains available without an overall QS ranking", () => {
  const value = understood(["法国"], "艺术管理");
  assert.ok(retrieveCachedVerifiedProgrammes(value, expandField(value.targetField)).some(item => item.institutionName === "KEDGE Business School"));
});

test("a low budget does not remove programmes at retrieval", () => {
  const value = understood(["法国"], "艺术管理", [], 1000);
  assert.ok(retrieveCachedVerifiedProgrammes(value, expandField(value.targetField)).length > 0);
});

