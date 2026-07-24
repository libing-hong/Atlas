import { execFileSync } from "node:child_process";
import { evaluateProtectedScope, parseRestrictedScopes } from "./protected-scope.mjs";

const scopes = parseRestrictedScopes(process.env.PR_SCOPE_LABELS ?? process.env.PR_SCOPE ?? "");
if (!scopes.length) {
  console.log("Protected scope check skipped: no restricted scope label is set.");
  process.exit(0);
}
if (scopes.length > 1) {
  console.error(`Protected scope check failed: multiple restricted labels are not allowed (${scopes.join(", ")}).`);
  process.exit(1);
}
const base = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : process.env.PROTECTED_SCOPE_BASE ?? "HEAD~1";
let changed;
try {
  changed = execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], { encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
} catch (error) {
  console.error(`Unable to determine changed files against ${base}: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
const result = evaluateProtectedScope(scopes[0], changed);
if (!result.allowed) {
  console.error(`PR_SCOPE=${scopes[0]} may not modify Recommendation Protected Core:\n${result.violations.map((file) => `- ${file}`).join("\n")}`);
  process.exit(1);
}
console.log(`Protected scope check passed for PR_SCOPE=${scopes[0]}.`);

