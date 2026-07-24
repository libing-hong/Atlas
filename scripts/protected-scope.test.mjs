import assert from "node:assert/strict";
import test from "node:test";
import { evaluateProtectedScope, parseRestrictedScopes } from "./protected-scope.mjs";

test("ui-only scope allows UI-only changes", () => {
  assert.deepEqual(evaluateProtectedScope("ui-only", ["src/components/Header.tsx"]), {
    allowed: true,
    scope: "ui-only",
    violations: [],
  });
});

test("ui-only scope rejects and lists Protected Core changes", () => {
  const file = "src/app/api/recommendations/route.ts";
  assert.deepEqual(evaluateProtectedScope("ui-only", ["src/components/Header.tsx", file]), {
    allowed: false,
    scope: "ui-only",
    violations: [file],
  });
});

test("multiple restricted labels remain explicit instead of silently choosing one", () => {
  assert.deepEqual(parseRestrictedScopes("ui-only,content-only"), ["ui-only", "content-only"]);
});

