import assert from "node:assert/strict";
import test from "node:test";
import { createRecommendationsPost } from "./route";
import type { OrchestratorResult, ProgrammeCandidate } from "@/lib/recommendation/types";

const candidate = { institution: "KEDGE Business School", programme: "MSc International Business", institutionName: "KEDGE Business School", programmeName: "MSc International Business", country: "France", degreeLevel: "master", officialUrl: "https://student.kedge.edu/programmes/international-business", officialProgrammeUrl: "https://student.kedge.edu/programmes/international-business", fieldRelation: "synonym", academicStatus: "meets", languageStatus: "pending", budgetStatus: "pending", timelineStatus: "pending", verificationStatus: "verified", missingInformation: ["language score"], sources: [], matchExplanation: "Verified match", recommendationBand: "target", score: 90, verifiedProgramme: {}, generatedByAI: true, aiRecommendation: { internalDebug: "may change" } } as unknown as ProgrammeCandidate;
const result = { profile: {}, expansions: [], candidates: [candidate], reviewQueue: [], events: [], fallbackLevel: 0, generationStatus: "complete", aiStatus: "completed", debug: { initialCandidates: 1, afterCountryFilter: 1, afterDegreeFilter: 1, afterSubjectMatch: 1, afterEligibilityCheck: 1, afterValidation: 1, unstableInternalField: true }, supervisor: { sufficient: true, issues: [], discoveryPasses: 1 } } as unknown as OrchestratorResult;

test("POST /api/recommendations preserves the public response contract with a fixed mock orchestrator", async () => {
  const post = createRecommendationsPost({ enforceRateLimits: false, orchestrate: async () => result, recordEvent: async () => undefined });
  const response = await post(new Request("http://localhost/api/recommendations", { method: "POST", headers: { "content-type": "application/json", "x-request-id": "contract-test" }, body: JSON.stringify({ profile: { targetCountries: ["France"], targetSubjects: ["International Business"] } }) }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.generationStatus, "complete"); assert.equal(body.aiStatus, "completed"); assert.ok(Array.isArray(body.candidates));
  for (const field of ["institutionName", "programmeName", "country", "degreeLevel", "officialProgrammeUrl"]) assert.equal(typeof body.candidates[0][field], "string", field);
  assert.equal("debug" in body, false); assert.equal("aiRecommendation" in body.candidates[0], false); assert.equal(body.candidates.length, 1, "internal debug changes must not hide frontend candidates");
});
