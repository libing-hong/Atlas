export const protectedPrefixes = [
  "src/lib/recommendation/",
  "src/app/api/recommendations/",
  "data/programmes/",
  "src/lib/student-profile.ts",
];
export const restrictedScopes = ["ui-only", "visa-only", "materials-only", "content-only", "application-only"];

export function parseRestrictedScopes(value) {
  const labels = Array.isArray(value) ? value : String(value).split(",");
  return [...new Set(labels.map((label) => label.trim().toLowerCase()).filter((label) => restrictedScopes.includes(label)))];
}

export function evaluateProtectedScope(scope, changedFiles) {
  const violations = changedFiles
    .map((file) => file.replaceAll("\\", "/"))
    .filter((file) => protectedPrefixes.some((prefix) => file === prefix || file.startsWith(prefix)));
  return { allowed: !violations.length, scope, violations };
}

