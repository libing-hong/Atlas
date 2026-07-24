import { execFileSync } from "node:child_process";

const prefixes = ["src/lib/recommendation/", "src/app/api/recommendations/", "data/programmes/", "src/lib/student-profile.ts"];
const restricted = new Set(["ui-only", "visa-only", "materials-only", "content-only", "application-only"]);
const scope = (process.env.PR_SCOPE ?? "").trim().toLowerCase();
if (!restricted.has(scope)) {
  console.log(`Protected scope check skipped: ${scope ? `"${scope}" is unrestricted` : "PR_SCOPE is not set"}.`);
  process.exit(0);
}
const base = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : process.env.PROTECTED_SCOPE_BASE ?? "HEAD~1";
let changed;
try {
  changed = execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], { encoding: "utf8" }).split(/\r?\n/).filter(Boolean).map((file) => file.replaceAll("\\", "/"));
} catch (error) {
  console.error(`Unable to determine changed files against ${base}: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
const violations = changed.filter((file) => prefixes.some((prefix) => file === prefix || file.startsWith(prefix)));
if (violations.length) {
  console.error(`PR_SCOPE=${scope} may not modify Recommendation Protected Core:\n${violations.map((file) => `- ${file}`).join("\n")}`);
  process.exit(1);
}
console.log(`Protected scope check passed for PR_SCOPE=${scope}.`);
