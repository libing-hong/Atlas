import cache from "../../../data/programmes/official-discovery-cache.json";
import type { FieldExpansion, ProgrammeLead, UnderstoodProfile } from "./types";
type CachedRecord = (typeof cache)[number];

export function searchCachedOfficialDiscoveries(profile: UnderstoodProfile, expansions: FieldExpansion[]): ProgrammeLead[] {
  const terms = new Map(expansions.map(item => [item.term.toLowerCase(), item.relation]));
  return (cache as CachedRecord[]).flatMap(record => {
    if (!record.countries.some(country => profile.targetCountries.includes(country))) return [];
    const matched = record.fieldTerms.find(term => terms.has(term.toLowerCase())); if (!matched) return [];
    return [{ url: record.officialUrl, searchTitle: record.programme, snippet: null, entityType: "official_programme" as const, fieldRelation: terms.get(matched.toLowerCase()) ?? "highly_related", discoveryQuery: record.discoveryQuery, discoveredAt: record.discoveredAt }];
  });
}

