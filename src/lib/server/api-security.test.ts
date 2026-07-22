import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { createApiContext, enforceLimit, parseJson, validateMutationOrigin } from "./api-security";
import { safeFetchText, SafeFetchError } from "./safe-fetch";

test("API context issues an HttpOnly anonymous session without exposing secrets", () => {
  const context = createApiContext(new Request("https://atlas.example/api/test", { headers: { "x-forwarded-for": "203.0.113.1" } }));
  assert.ok(context.sessionId); assert.match(context.setCookie ?? "", /HttpOnly/); assert.doesNotMatch(context.setCookie ?? "", /OPENAI|SUPABASE/);
});

test("cross-site mutations are rejected", () => {
  assert.equal(validateMutationOrigin(new Request("https://atlas.example/api/test", { headers: { origin: "https://evil.example", "sec-fetch-site": "cross-site" } })), false);
  assert.equal(validateMutationOrigin(new Request("https://atlas.example/api/test", { headers: { origin: "https://atlas.example", "sec-fetch-site": "same-origin" } })), true);
});

test("JSON parsing enforces schema and body size", async () => {
  await assert.rejects(() => parseJson(new Request("https://atlas.example", { method: "POST", body: JSON.stringify({ value: "too long" }) }), z.object({ value: z.string().max(3) }), 100));
  await assert.rejects(() => parseJson(new Request("https://atlas.example", { method: "POST", body: "x".repeat(101) }), z.unknown(), 100));
});

test("rate limit repository blocks repeated requests", async () => {
  const context = createApiContext(new Request("https://atlas.example", { headers: { "x-forwarded-for": "203.0.113.2" } }));
  await enforceLimit(context, "test", 1, 60_000); await assert.rejects(() => enforceLimit(context, "test", 1, 60_000));
});

test("safe fetch rejects dangerous protocols and private destinations", async () => {
  for (const url of ["http://example.com", "file:///etc/passwd", "https://localhost/test", "https://127.0.0.1/test", "https://169.254.169.254/latest/meta-data"]) {
    await assert.rejects(() => safeFetchText(url), (error: unknown) => error instanceof SafeFetchError);
  }
});


