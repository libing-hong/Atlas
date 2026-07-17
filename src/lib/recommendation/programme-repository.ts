import cache from "../../../data/programmes/official-discovery-cache.json";
import type { DegreeLevel, FieldExpansion, ProgrammeLead, UnderstoodProfile, VerifiedField, VerifiedProgramme } from "./types";
type CachedRecord = (typeof cache)[number];

export function searchCachedOfficialDiscoveries(profile: UnderstoodProfile, expansions: FieldExpansion[]): ProgrammeLead[] {
  const terms = new Map(expansions.map(item => [item.term.toLowerCase(), item.relation]));
  return (cache as CachedRecord[]).flatMap(record => {
    if (!record.countries.some(country => profile.targetCountries.includes(country))) return [];
    const matched = record.fieldTerms.find(term => terms.has(term.toLowerCase())); if (!matched) return [];
    return [{ url: record.officialUrl, searchTitle: record.programme, snippet: null, entityType: "official_programme" as const, fieldRelation: terms.get(matched.toLowerCase()) ?? "highly_related", discoveryQuery: record.discoveryQuery, discoveredAt: record.discoveredAt }];
  });
}

const storedField = <T>(value: T | null, url: string, retrievedAt: string): VerifiedField<T> => ({ value, sourceUrl: url, retrievedAt, verificationStatus: value === null ? "pending" : "verified" });
const degreeLevel = (name: string): DegreeLevel | null => /\b(?:master|msc|ma|llm|mba)\b/i.test(name) ? "master" : /\b(?:bachelor|bsc|ba)\b/i.test(name) ? "bachelor" : /\b(?:phd|doctorate)\b/i.test(name) ? "doctorate" : null;
const canonicalCountry = (countries: string[]) => countries.find(country => ["法国", "英国", "澳洲", "西班牙", "美国"].includes(country)) ?? countries[0];

/** Returns durable, previously verified programme records without requiring a live website fetch. */
export function retrieveCachedVerifiedProgrammes(profile: UnderstoodProfile, expansions: FieldExpansion[]): VerifiedProgramme[] {
  const terms = new Map(expansions.map(item => [item.term.toLowerCase(), item.relation]));
  return (cache as CachedRecord[]).flatMap(record => {
    const country = canonicalCountry(record.countries); const level = degreeLevel(record.programme);
    const matched = record.fieldTerms.find(term => terms.has(term.toLowerCase()));
    if (!profile.targetCountries.includes(country) || !level || level !== profile.targetDegreeLevel || !matched) return [];
    const url = record.officialUrl; const date = record.discoveredAt;
    return [{ institutionName: record.institution, programmeName: record.programme, country, officialProgrammeUrl: url, officialRootDomain: new URL(url).hostname.replace(/^www\./, ""), degreeType: record.programme.match(/\b(?:MSc|MA|LLM|MBA|Master|Bachelor|PhD)\b/i)?.[0] ?? level, degreeLevel: level, campus: storedField<string>(null, url, date), fieldRelation: terms.get(matched.toLowerCase()) ?? "highly_related", sourceType: "official" as const, active: storedField(true, url, date), intake: storedField<string>(null, url, date), teachingLanguage: storedField<string>(null, url, date), degreeRequirement: storedField<string>(null, url, date), subjectRequirement: storedField<string>(null, url, date), gradeRequirement: storedField<string>(null, url, date), languageRequirement: storedField<string>(null, url, date), tuition: storedField<number>(null, url, date), tuitionCurrency: storedField<string>(null, url, date), deadline: storedField<string>(null, url, date), applicationUrl: storedField<string>(null, url, date), discoveryQuery: record.discoveryQuery, discoveredAt: date }];
  });
}

