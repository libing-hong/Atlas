import type { DegreeLevel, InstitutionVerification, ProgrammeLead, ProgrammeVerification, RejectedProgrammeLead, RejectionReason, SourceEvidence, UnderstoodProfile, VerifiedField, VerifiedProgramme, VerificationStatus } from "./types";
import { safeFetchText } from "@/lib/server/safe-fetch";

const blockedDomain = /(amazon\.|goodreads\.|facebook\.|linkedin\.|instagram\.|youtube\.|wikipedia\.|mastersportal\.|findamasters\.|studyportals\.|educations\.com|gostudyin\.|reddit\.|medium\.|blogspot\.|wordpress\.)/i;
const decode = (value: string) => value.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&eacute;/gi, "é").replace(/\s+/g, " ").trim();
const plainText = (html: string) => decode(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
const field = <T>(value: T | null, url: string, retrievedAt: string, status: VerificationStatus = value === null ? "pending" : "verified"): VerifiedField<T> => ({ value, sourceUrl: url, retrievedAt, verificationStatus: status });
const first = (body: string, patterns: RegExp[]) => { for (const pattern of patterns) { const match = body.match(pattern); if (match?.[1]) return decode(match[1]); } return null; };
const rootDomain = (hostname: string) => { const parts = hostname.toLowerCase().replace(/^www\./, "").split("."); const suffix = parts.slice(-2).join("."); return /^(ac\.uk|edu\.au|ac\.fr)$/.test(suffix) ? parts.slice(-3).join(".") : suffix; };
const canonicalCountry = (value: string | null) => {
  if (!value) return null; const text = value.toLowerCase();
  if (/france|français|paris|marseille|bordeaux/.test(text)) return "法国";
  if (/united kingdom|great britain|england|scotland|wales|london|英国/.test(text)) return "英国";
  if (/australia|sydney|melbourne|brisbane|澳洲|澳大利亚/.test(text)) return "澳洲";
  if (/spain|españa|barcelona|madrid/.test(text)) return "西班牙";
  if (/united states|usa|new york|california/.test(text)) return "美国";
  return value.trim();
};
const normalizeTargetCountry = (value: string) => canonicalCountry(value) ?? value;
const normalizeTargetLevel = (value: DegreeLevel | null) => value;
const detectDegreeLevel = (value: string): DegreeLevel | null => /\b(?:phd|doctor(?:ate|al))\b/i.test(value) ? "doctorate" : /\b(?:master|msc|m\.sc|ma\b|m\.a\.|llm|mba|bac\s*\+\s*[45])\b/i.test(value) ? "master" : /\b(?:bachelor|bsc|ba\b|licence|undergraduate)\b/i.test(value) ? "bachelor" : null;
const cleanName = (value: unknown) => typeof value === "string" ? decode(value.replace(/<[^>]+>/g, " ")).replace(/^[|·–—:\s]+|[|·–—:\s]+$/g, "") : null;
const types = (value: unknown) => Array.isArray(value) ? value.map(String) : value ? [String(value)] : [];

function structuredData(html: string): Record<string, unknown>[] {
  const records: Record<string, unknown>[] = []; const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi; let match: RegExpExecArray | null;
  while ((match = pattern.exec(html))) { try { const parsed = JSON.parse(match[1]); const queue = Array.isArray(parsed) ? parsed : [parsed]; for (const item of queue) { if (item && typeof item === "object") { const record = item as Record<string, unknown>; records.push(record); const graph = record["@graph"]; if (Array.isArray(graph)) records.push(...graph.filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")); } } } catch {} }
  return records;
}

function normalizeInstitutionName(value: string, body: string) {
  const concise = value.split(",")[0].trim(); const escaped = concise.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); return body.match(new RegExp(escaped, "i"))?.[0] ?? concise;
}
function extractInstitution(records: Record<string, unknown>[], body: string) {
  for (const record of records) {
    const recordTypes = types(record["@type"]); const provider = record.provider as Record<string, unknown> | undefined; const publisher = record.publisher as Record<string, unknown> | undefined;
    const nested = cleanName(provider?.name) ?? cleanName(publisher?.name);
    if (nested && /university|universit[eé]|school|college|école|institute|institut/i.test(nested)) return normalizeInstitutionName(nested, body);
    const name = cleanName(record.name);
    if (name && recordTypes.some(type => /CollegeOrUniversity|EducationalOrganization|Organization/i.test(type)) && /university|universit[eé]|school|college|école|institute|institut/i.test(name)) return normalizeInstitutionName(name, body);
  }
  const universityPatterns = [/(The\s+University\s+of\s+[A-ZÀ-Ý][A-Za-zÀ-ÿ&'’ -]{2,55})/, /(University\s+College\s+[A-ZÀ-Ý][A-Za-zÀ-ÿ&'’ -]{2,45})/, /(Université\s+(?:de\s+|Paris-)?[A-ZÀ-Ý][A-Za-zÀ-ÿ&'’ -]{2,70})/, /([A-ZÀ-Ý][A-Za-zÀ-ÿ&'’-]{2,35}\s+University)/];
  let institution: string | undefined; for (const pattern of universityPatterns) { institution = body.match(pattern)?.[1]; if (institution) break; }
  const schoolMatch = body.match(/([A-Z][A-Za-z&'’ -]{2,45}\s+(?:Business\s+)?School)/); institution ??= schoolMatch?.[1];
  return institution ? institution.replace(/['’]s\s+Law School.*$/i, "").replace(/\s+(?:Skip|Aller|Menu|Admissions?|Study|Home|Faculté|Faculty|Courses?|Search|International).*$/i, "").trim() : null;
}

function extractProgramme(records: Record<string, unknown>[], html: string, body: string) {
  for (const record of records) { if (types(record["@type"]).some(type => /Course|EducationalOccupationalProgram/i.test(type))) { const name = cleanName(record.name); if (name) return name; } }
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]; const h1Name = h1 ? cleanName(h1) : null; if (h1Name) return h1Name;
  return first(body, [/\b((?:LLM|Master(?: of Laws)?|MSc|MA)\s+(?:in\s+)?(?:Law|Laws|Droit)[A-Za-zÀ-ÿ&'’ -]{0,70})/i]);
}

function extractStructuredCountry(records: Record<string, unknown>[]) {
  for (const record of records) {
    const candidates = [record.location, record.address, (record.provider as Record<string, unknown> | undefined)?.address];
    for (const candidate of candidates) { if (!candidate || typeof candidate !== "object") continue; const object = candidate as Record<string, unknown>; const address = (object.address && typeof object.address === "object" ? object.address : object) as Record<string, unknown>; const country = cleanName(address.addressCountry) ?? cleanName(address.addressLocality); if (country) return canonicalCountry(country); }
  }
  return null;
}

export async function verifyProgrammeLead(lead: ProgrammeLead, profile: UnderstoodProfile): Promise<{ programme?: VerifiedProgramme; rejection?: RejectedProgrammeLead }> {
  const reasons: RejectionReason[] = [];
  if (lead.entityType !== "official_programme") reasons.push(lead.entityType === "official_institution" ? "NOT_A_PROGRAMME" : "NON_OFFICIAL_SOURCE");
  let parsed: URL | null = null; try { parsed = new URL(lead.url); } catch { reasons.push("NON_OFFICIAL_SOURCE"); }
  if (parsed && blockedDomain.test(parsed.hostname)) reasons.push("NON_OFFICIAL_SOURCE");
  if (reasons.length) return { rejection: { lead, reasons: [...new Set(reasons)] } };

  const retrievedAt = new Date().toISOString();
  const response = await safeFetchText(lead.url, { timeoutMs: 8_000, maxBytes: 1_500_000, allowedContentTypes: ["text/html", "application/xhtml+xml"], init: { headers: { "User-Agent": "AtlasOfficialVerifier/2.0" } } }).catch(() => null);
  if (!response?.ok) return { rejection: { lead, reasons: ["PROGRAMME_NOT_VERIFIED"] } };
  const finalUrl = response.url || lead.url; const finalParsed = new URL(finalUrl); const html = response.text; const body = plainText(html); const records = structuredData(html);
  const institutionName = extractInstitution(records, body); const programmeName = extractProgramme(records, html, body); const officialRootDomain = rootDomain(finalParsed.hostname);
  const country = finalParsed.hostname.endsWith(".ac.uk") ? "英国" : finalParsed.hostname.endsWith(".edu.au") ? "澳洲" : finalParsed.hostname.endsWith(".fr") ? "法国" : extractStructuredCountry(records) ?? canonicalCountry(`${finalParsed.hostname} ${body.slice(0, 12000)}`);
  const institutionVerified = Boolean(institutionName && officialRootDomain && !blockedDomain.test(finalParsed.hostname));
  const institutionVerification: InstitutionVerification = { institutionVerified, institutionName, country, officialRootDomain };
  if (!institutionName) reasons.push("MISSING_INSTITUTION_NAME");
  if (!institutionVerified) reasons.push("INSTITUTION_NOT_VERIFIED");
  if (!programmeName) reasons.push("MISSING_PROGRAMME_NAME");
  const degreeLevel = detectDegreeLevel(programmeName ?? "") ?? detectDegreeLevel(body.slice(0, 4000)); const degreeType = first(`${programmeName ?? ""} ${body}`, [/(LLM|Master of Laws|MSc|M\.Sc\.?|Master of Science|MA|Master of Arts|MBA|Bachelor[^,.;]{0,40}|PhD)/i]);
  const hasAdmissionsInformation = /admission|entry requirements?|eligibility|how to apply|application|apply now|candidature|admissions?/i.test(body);
  const programmeVerified = Boolean(programmeName && degreeLevel && degreeType && hasAdmissionsInformation && /master|msc|ma\b|llm|bachelor|phd|degree|programme|program/i.test(`${programmeName} ${body.slice(0, 3000)}`));
  const programmeVerification: ProgrammeVerification = { programmeVerified, programmeName, degreeType, degreeLevel, campus: null, hasAdmissionsInformation, officialProgrammeUrl: programmeVerified ? finalUrl : null };
  if (!programmeVerified) reasons.push("PROGRAMME_NOT_VERIFIED");
  if (country && !profile.targetCountries.map(normalizeTargetCountry).includes(country)) reasons.push("COUNTRY_NOT_SELECTED");
  if (!country) reasons.push("PROGRAMME_NOT_VERIFIED");
  if (normalizeTargetLevel(profile.targetDegreeLevel) && degreeLevel !== normalizeTargetLevel(profile.targetDegreeLevel)) reasons.push("WRONG_DEGREE_LEVEL");
  if (reasons.length) return { rejection: { lead, reasons: [...new Set(reasons)], institutionVerification, programmeVerification } };

  const intake = first(body, [/(?:Intake|Rentrée)\s*:?\s*((?:September|January|Septembre|Janvier)\s+20\d{2})/i, /(20\d{2}\s*(?:秋季|春季))/]);
  const fee = first(body, [/(?:€|EUR)\s*([\d,.]{4,})/i, /([\d,.]{4,})\s*(?:€|EUR)/i, /(?:£|GBP)\s*([\d,.]{4,})/i]);
  const language = first(body, [/(?:Language|Langue)\s*:?\s*(English|French|Anglais|Français)/i]);
  const degreeRequirement = first(body, [/((?:Bachelor(?:'s)? degree|Bac\s*\+\s*[34]|180|240 ECTS)[^.]{0,160})/i]);
  const subjectRequirement = first(body, [/((?:management|arts?|culture|law|legal|social sciences)[^.]{0,180}(?:related|subjects?|disciplines?|parcours))/i]);
  const gradeRequirement = first(body, [/((?:minimum|at least|required)[^.]{0,80}(?:GPA|average|grade)[^.]{0,80})/i]);
  const languageRequirement = first(body, [/((?:TOEFL|IELTS|TOEIC|Cambridge|Duolingo|PTE|DELF|DALF|TCF|TEF)[^.]{0,240})/i]);
  const campus = first(body, [/(?:Campus|Location|Lieu)\s*:?\s*([A-Za-zÀ-ÿ -]{2,40})/i]); const deadline = first(body, [/(?:Deadline|Date limite)\s*:?\s*([^.;]{4,60})/i]);
  const applyMatch = html.match(/<a[^>]+href=["']([^"']+)["'][^>]*>[^<]*(?:Apply|Postuler|Admission)[^<]*<\/a>/i); let applicationUrl: string | null = null; if (applyMatch) try { applicationUrl = new URL(applyMatch[1], finalUrl).toString(); } catch {}
  const currency = /(?:£|GBP)/.test(body) && fee ? "GBP" : fee ? "EUR" : null;
  return { programme: { institutionName: institutionName!, programmeName: programmeName!, country: country!, officialProgrammeUrl: finalUrl, officialRootDomain: officialRootDomain!, degreeType: degreeType!, degreeLevel: degreeLevel!, campus: field(campus, finalUrl, retrievedAt), fieldRelation: lead.fieldRelation, sourceType: "official", active: field(!/programme (?:closed|discontinued)|formation fermée/i.test(body), finalUrl, retrievedAt), intake: field(intake, finalUrl, retrievedAt), teachingLanguage: field(language, finalUrl, retrievedAt), degreeRequirement: field(degreeRequirement, finalUrl, retrievedAt), subjectRequirement: field(subjectRequirement, finalUrl, retrievedAt), gradeRequirement: field(gradeRequirement, finalUrl, retrievedAt), languageRequirement: field(languageRequirement, finalUrl, retrievedAt), tuition: field(fee ? Number(fee.replace(/[,\s]/g, "")) : null, finalUrl, retrievedAt), tuitionCurrency: field(currency, finalUrl, retrievedAt), deadline: field(deadline, finalUrl, retrievedAt), applicationUrl: field(applicationUrl, finalUrl, retrievedAt), discoveryQuery: lead.discoveryQuery, discoveredAt: lead.discoveredAt } };
}

export function sourcesFor(programme: VerifiedProgramme): SourceEvidence[] {
  const fields = Object.entries(programme).filter(([, value]) => value && typeof value === "object" && "sourceUrl" in value) as Array<[string, VerifiedField<unknown>]>; const grouped = new Map<string, SourceEvidence>();
  for (const [name, value] of fields) { if (!value.sourceUrl) continue; const current = grouped.get(value.sourceUrl) ?? { sourceUrl: value.sourceUrl, retrievedAt: value.retrievedAt, verificationStatus: value.verificationStatus, fields: [], sourceType: "official" as const }; current.fields.push(name); if (value.verificationStatus !== "verified") current.verificationStatus = "partially_verified"; grouped.set(value.sourceUrl, current); }
  return [...grouped.values()];
}

