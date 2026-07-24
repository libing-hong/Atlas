import process from "node:process";

const baseUrl = (process.env.BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const routes = ["/", "/planner", "/dashboard", "/result", "/applications/recommendations"];
const attempts = 30;

async function fetchWithRetry(path) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
      if (response.status >= 200 && response.status < 400) return response;
      lastError = new Error(`${path} returned HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw lastError;
}

for (const route of routes) {
  const response = await fetchWithRetry(route);
  const body = await response.text();
  if (!body.trim()) throw new Error(`${route} returned an empty response`);
  console.log(`PASS ${route} (${response.status})`);
}

const adminResponse = await fetchWithRetry("/admin");
const adminBody = await adminResponse.text();
const highRiskPatterns = [
  { label: "unmasked mainland China phone number", pattern: /(?<!\d)1[3-9]\d{9}(?!\d)/ },
  { label: "non-demo email address", pattern: /\b[A-Z0-9._%+-]+@(?!example\.com\b)[A-Z0-9.-]+\.[A-Z]{2,}\b/i },
  { label: "passport number", pattern: /\b(?:E\d{8}|G\d{8}|[A-Z]{2}\d{7})\b/i },
  { label: "bank card or IBAN", pattern: /\b(?:[A-Z]{2}\d{2}[A-Z0-9]{11,30}|\d{16,19})\b/i },
];

for (const { label, pattern } of highRiskPatterns) {
  if (pattern.test(adminBody)) throw new Error(`/admin exposed a ${label}`);
}
console.log(`PASS /admin sensitive-data smoke check (${adminResponse.status})`);
