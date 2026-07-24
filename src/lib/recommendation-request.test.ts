import assert from "node:assert/strict";
import test from "node:test";
import { postRecommendationWithRetry } from "./recommendation-request";

test("a transient recommendation failure retries once with the same idempotency key", async () => {
  const keys: string[] = [];
  let attempts = 0;
  const fetcher: typeof fetch = async (_input, init) => {
    attempts += 1;
    keys.push(new Headers(init?.headers).get("Idempotency-Key") ?? "");
    return Response.json(
      attempts === 1
        ? { code: "OPENAI_TIMEOUT", message: "temporary timeout" }
        : { candidates: [{ institutionName: "KEDGE Business School" }], generationStatus: "complete", aiStatus: "completed" },
      { status: attempts === 1 ? 503 : 200 },
    );
  };
  const waits: number[] = [];
  const result = await postRecommendationWithRetry({
    body: JSON.stringify({ profile: {} }),
    idempotencyKey: "planning-run-1",
    signal: new AbortController().signal,
    fetcher,
    wait: async (durationMs) => { waits.push(durationMs); },
  });

  assert.equal(attempts, 2);
  assert.deepEqual(keys, ["planning-run-1", "planning-run-1"]);
  assert.deepEqual(waits, [400]);
  assert.equal(result.response.status, 200);
  assert.equal(result.data.candidates?.length, 1);
});

test("a non-transient recommendation failure is not retried", async () => {
  let attempts = 0;
  const fetcher: typeof fetch = async () => {
    attempts += 1;
    return Response.json({ code: "OPENAI_API_KEY_MISSING", message: "not configured" }, { status: 503 });
  };
  const result = await postRecommendationWithRetry({
    body: "{}",
    idempotencyKey: "planning-run-2",
    signal: new AbortController().signal,
    fetcher,
    wait: async () => { throw new Error("must not wait"); },
  });

  assert.equal(attempts, 1);
  assert.equal(result.response.status, 503);
  assert.equal(result.data.code, "OPENAI_API_KEY_MISSING");
});
