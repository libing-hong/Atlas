import { readFile, readdir, stat } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";

const root = process.cwd();
const failures = [];
const checkedExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"]);
const ignoredDirectories = new Set([".git", ".next", "node_modules", ".pnpm-store"]);
const terminalMetadata = [["Exit", "code:"], ["Wall", "time:"], ["Out", "put:"]].map((parts) => parts.join(" "));
const conflictMarkers = [["<<<", "<<<<"], ["===", "===="], [">>>", ">>>>"]].map((parts) => parts.join(""));
const protectedRoots = ["src/lib/recommendation", "src/app/api/recommendations", "data/programmes"];

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}
const fail = (file, reason) => failures.push(`${relative(root, file)}: ${reason}`);
function validateProgrammeData(file, value) {
  if (!Array.isArray(value)) return fail(file, "programme data must be an array");
  value.forEach((item, index) => {
    if (!item || typeof item !== "object") return fail(file, `item ${index} must be an object`);
    for (const field of ["institution", "programme", "officialUrl", "verificationStatus"]) {
      if (typeof item[field] !== "string" || !item[field].trim()) fail(file, `item ${index}.${field} must be a non-empty string`);
    }
    for (const field of ["countries", "fieldTerms"]) {
      if (!Array.isArray(item[field]) || !item[field].length || item[field].some((entry) => typeof entry !== "string" || !entry.trim())) {
        fail(file, `item ${index}.${field} must be a non-empty string array`);
      }
    }
    try { if (new URL(item.officialUrl).protocol !== "https:") fail(file, `item ${index}.officialUrl must use HTTPS`); }
    catch { fail(file, `item ${index}.officialUrl must be a valid URL`); }
  });
}

for (const file of await walk(root)) {
  const extension = extname(file);
  if (!checkedExtensions.has(extension)) continue;
  const info = await stat(file);
  const path = relative(root, file).replaceAll("\\", "/");
  if (!info.size && protectedRoots.some((directory) => path.startsWith(`${directory}/`))) {
    fail(file, "Protected Core files must not be empty");
    continue;
  }
  const content = await readFile(file, "utf8");
  for (const marker of terminalMetadata) if (content.includes(marker)) fail(file, `contains forbidden terminal metadata "${marker}"`);
  for (const marker of conflictMarkers) if (content.includes(marker)) fail(file, `contains merge conflict marker "${marker}"`);
  if (extension === ".json") {
    try {
      const parsed = JSON.parse(content);
      if (path.startsWith("data/programmes/")) validateProgrammeData(file, parsed);
    } catch (error) { fail(file, `invalid JSON (${error instanceof Error ? error.message : String(error)})`); }
  }
}
if (failures.length) {
  console.error(`File integrity validation failed (${failures.length} issue(s)):\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
  process.exitCode = 1;
} else console.log("File integrity validation passed.");
