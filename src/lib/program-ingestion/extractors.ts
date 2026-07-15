import "server-only";
import type { ExtractedProgramField, ProgramFieldName } from "./types";

const fieldHeadings: Array<{ field: ProgramFieldName; pattern: RegExp }> = [
  { field: "core_module", pattern: /compulsory|core modules?|mandatory/i },
  { field: "optional_module", pattern: /optional|elective modules?/i },
  { field: "learning_focus", pattern: /course content|programme structure|what you.ll learn|study content/i },
  { field: "learning_outcome", pattern: /learning outcomes?|skills you.ll gain/i },
  { field: "practical_component", pattern: /dissertation|capstone|consultancy|internship|industrial experience|live project/i },
  { field: "career_direction", pattern: /careers?|graduate destinations?|employability/i },
  { field: "target_students", pattern: /who is it for|entry background|suitable for/i },
  { field: "accreditation", pattern: /accreditation|accredited by/i },
  { field: "duration", pattern: /duration|programme length/i },
  { field: "teaching_location", pattern: /campus|location/i },
  { field: "teaching_format", pattern: /mode of study|study mode|teaching and learning/i },
];

function decodeHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function pageTitle(html: string) {
  return decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "Official programme page");
}

function evidence(field: ProgramFieldName, value: string, sourceUrl: string, title: string, sourceText: string, confidence: number): ExtractedProgramField {
  return {
    field,
    value,
    sourceUrl,
    sourcePageTitle: title,
    sourceText: sourceText.slice(0, 500),
    retrievedAt: new Date().toISOString(),
    confidence,
    verificationStatus: confidence >= 0.85 ? "verified" : "needs_review",
  };
}

export function extractJsonLd(html: string, sourceUrl: string) {
  const title = pageTitle(html);
  const fields: ExtractedProgramField[] = [];
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1]);
      const nodes = Array.isArray(parsed) ? parsed : parsed["@graph"] ? parsed["@graph"] : [parsed];
      for (const node of nodes) {
        const type = Array.isArray(node?.["@type"]) ? node["@type"] : [node?.["@type"]];
        if (!type.some((item: string) => ["Course", "EducationalOccupationalProgram", "Product"].includes(item))) continue;
        if (typeof node.description === "string") fields.push(evidence("introduction", decodeHtml(node.description), sourceUrl, title, node.description, 0.92));
        if (typeof node.timeRequired === "string") fields.push(evidence("duration", node.timeRequired, sourceUrl, title, node.timeRequired, 0.9));
        if (typeof node.educationalCredentialAwarded === "string") fields.push(evidence("learning_outcome", node.educationalCredentialAwarded, sourceUrl, title, node.educationalCredentialAwarded, 0.75));
        const location = node.location?.name ?? node.provider?.location?.name;
        if (typeof location === "string") fields.push(evidence("teaching_location", location, sourceUrl, title, location, 0.88));
      }
    } catch {
      // Invalid JSON-LD is ignored; normal HTML extraction continues.
    }
  }
  return fields;
}

export function extractStaticHtml(html: string, sourceUrl: string) {
  const title = pageTitle(html);
  const fields: ExtractedProgramField[] = [...extractJsonLd(html, sourceUrl)];
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html;
  const description = main.match(/<(?:p|div)[^>]+(?:class|id)=["'][^"']*(?:summary|intro|overview|description)[^"']*["'][^>]*>([\s\S]*?)<\/(?:p|div)>/i)?.[1];
  if (description) {
    const value = decodeHtml(description);
    if (value.length >= 80) fields.push(evidence("introduction", value, sourceUrl, title, description, 0.78));
  }

  const sections = [...main.matchAll(/<h([2-4])[^>]*>([\s\S]*?)<\/h\1>([\s\S]*?)(?=<h[2-4][^>]*>|$)/gi)];
  for (const section of sections) {
    const heading = decodeHtml(section[2]);
    const bodyHtml = section[3];
    const bodyText = decodeHtml(bodyHtml);
    if (!bodyText) continue;
    for (const mapping of fieldHeadings) {
      if (!mapping.pattern.test(heading)) continue;
      const listItems = [...bodyHtml.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((match) => decodeHtml(match[1])).filter(Boolean);
      const tableCells = [...bodyHtml.matchAll(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi)].map((match) => decodeHtml(match[1])).filter(Boolean);
      const values = [...listItems, ...tableCells].filter((value, index, all) => value.length > 2 && all.indexOf(value) === index).slice(0, 40);
      if (values.length) {
        for (const value of values) fields.push(evidence(mapping.field, value, sourceUrl, title, `${heading}: ${value}`, mapping.field.includes("module") ? 0.82 : 0.76));
      } else {
        fields.push(evidence(mapping.field, bodyText.slice(0, 1200), sourceUrl, title, `${heading}: ${bodyText}`, 0.68));
      }
    }
  }

  const unique = new Map<string, ExtractedProgramField>();
  for (const field of fields) unique.set(`${field.field}:${field.value.toLowerCase()}`, field);
  return { title, fields: [...unique.values()] };
}

export function appearsJavascriptDependent(html: string, fieldsFound: number) {
  const shellSignals = /__NEXT_DATA__|data-reactroot|id=["']__next["']|enable javascript/i.test(html);
  return shellSignals && fieldsFound < 4;
}

export function validateProgramIdentity(input: { html: string; universityName: string; programName: string; intakeYear?: number }) {
  const text = decodeHtml(input.html).toLowerCase();
  const universityTokens = input.universityName.toLowerCase().split(/\s+/).filter((token) => token.length > 3);
  const programTokens = input.programName.toLowerCase().split(/\s+/).filter((token) => token.length > 2);
  const universityMatch = universityTokens.filter((token) => text.includes(token)).length / Math.max(1, universityTokens.length);
  const programMatch = programTokens.filter((token) => text.includes(token)).length / Math.max(1, programTokens.length);
  const intakeMatch = !input.intakeYear || text.includes(String(input.intakeYear));
  return {
    valid: universityMatch >= 0.5 && programMatch >= 0.6,
    intakeMatch,
    confidence: Math.round((universityMatch * 0.4 + programMatch * 0.5 + (intakeMatch ? 0.1 : 0)) * 100) / 100,
  };
}
