Exit code: 0
Wall time: 1.1 seconds
Output:
import assert from "node:assert/strict";
import test from "node:test";
import { buildRecommendationDiagnostic, createRecommendationsPost } from "./route";
import type { OrchestratorResult, ProgrammeCandidate } from "@/lib/recommendation/types";

const candidate = {
  institution: "KEDGE Business School",
  programme: "MSc International Business",
  institutionName: "KEDGE Business School",
  programmeName: "MSc International Business",
  country: "France",
  degreeLevel: "master",
  officialUrl: "https://student.kedge.edu/programmes/international-business",
  officialProgrammeUrl: "https://student.kedge.edu/programmes/international-business",
  fieldRelation: "synonym",
  academicStatus: "meets",
  languageStatus: "pending",
  budgetStatus: "pending",
  timelineStatus: "pending",
  verificationStatus: "verified",
  missingInformation: ["language score"],
  sources: [],
  matchExplanation: "Verified match",
  recommendationBand: "target",
  score: 90,
  verifiedProgramme: {},
  generatedByAI: true,
  aiRecommendation: { internalDebug: "may change" },
} as unknown as ProgrammeCandidate;
const result = {
  profile: {},
  expansions: [],
  candidates: [candidate],
  reviewQueue: [],
  events: [],
  fallbackLevel: 0,
  generationStatus: "complete",
  aiStatus: "completed",
  debug: { initialCandidates: 1, afterCountryFilter: 1, afterDegreeFilter: 1, afterSubjectMatch: 1, afterEligibilityCheck: 1, afterValidation: 1, unstableInternalField: true },
  supervisor: { sufficient: true, issues: [], discoveryPasses: 1 },
} as unknown as OrchestratorResult;

test("POST /api/recommendations preserves the public response contract with a fixed mock orchestrator", async () => {
  const post = createRecommendationsPost({
    enforceRateLimits: false,
    orchestrate: async () => result,
    recordEvent: async () => undefined,
  });
  const response = await post(new Request("http://localhost/api/recommendations", {
    method: "POST",
    headers: { "content-type": "application/json", "x-request-id": "contract-test" },
    body: JSON.stringify({ profile: { targetCountries: ["France"], targetSubjects: ["International Business"] } }),
  }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.generationStatus, "complete");
  assert.equal(body.aiStatus, "completed");
  assert.ok(Array.isArray(body.candidates));
  for (const field of ["institutionName", "programmeName", "country", "degreeLevel", "officialProgrammeUrl"]) {
    assert.equal(typeof body.candidates[0][field], "string", field);
  }
  assert.equal("debug" in body, false);
  assert.equal("aiRecommendation" in body.candidates[0], false);
  assert.equal(body.candidates.length, 1, "internal debug changes must not hide frontend candidates");
});

function request(idempotencyKey: string, cookie?: string) {
  return new Request("http://localhost/api/recommendations", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-request-id": idempotencyKey,
      "idempotency-key": idempotencyKey,
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify({ profile: { targetCountries: ["France"], targetSubjects: ["International Business"] } }),
  });
}

test("a rejected inflight promise is removed before the same request retries", async () => {
  let attempts = 0;
  const post = createRecommendationsPost({
    enforceRateLimits: false,
    orchestrate: async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("first attempt failed");
      return result;
    },
    recordEvent: async () => undefined,
  });
  const first = await post(request("inflight-retry"));
  assert.equal(first.status, 500);
  const cookie = first.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie);
  const second = await post(request("inflight-retry", cookie));
  assert.equal(second.status, 200);
  assert.equal((await second.json()).candidates.length, 1);
  assert.equal(attempts, 2);
});

test("successful recommendations survive a recordEvent failure", async () => {
  const post = createRecommendationsPost({
    enforceRateLimits: false,
    orchestrate: async () => result,
    recordEvent: async () => { throw new Error("audit unavailable"); },
  });
  const response = await post(request("audit-success"));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).candidates.length, 1);
});

test("structured API errors survive a failure-event recording failure", async () => {
  const post = createRecommendationsPost({
    enforceRateLimits: false,
    orchestrate: async () => { throw new Error("orchestration failed"); },
    recordEvent: async () => { throw new Error("audit unavailable"); },
  });
  const response = await post(request("audit-failure"));
  assert.equal(response.status, 500);
  const body = await response.json();
  assert.equal(body.error.code, "INTERNAL_ERROR");
  assert.equal(typeof body.requestId, "string");
});

test("diagnostics use raw orchestrator stage counters while debug stays private", () => {
  const diagnostic = buildRecommendationDiagnostic({
    ...result,
    debug: {
      ...result.debug,
      aiCandidatesReturned: 9,
      afterSubjectMatch: 6,
      verifiedRecommendations: 3,
      afterValidation: 4,
    },
  }, 2, Date.now(), "diagnostic-test");
  assert.equal(diagnostic.aiCandidateCount, 9);
  assert.equal(diagnostic.semanticAcceptedCount, 6);
  assert.equal(diagnostic.verificationAcceptedCount, 3);
  assert.equal(diagnostic.frontendCandidateCount, 2);
  assert.equal(diagnostic.errorStage, null);
});

