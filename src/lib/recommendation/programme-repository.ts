import cache from "../../../data/programmes/official-discovery-cache.json"; import type { DiscoveredProgramme,FieldExpansion,UnderstoodProfile } from "./types";
type CachedRecord=(typeof cache)[number];
export function searchCachedOfficialDiscoveries(profile:UnderstoodProfile,expansions:FieldExpansion[]):DiscoveredProgramme[]{
 const terms=new Map(expansions.map(x=>[x.term.toLowerCase(),x.relation]));
 return (cache as CachedRecord[]).flatMap(record=>{if(!record.countries.some(country=>profile.targetCountries.includes(country)))return[];const matched=record.fieldTerms.find(term=>terms.has(term.toLowerCase()));if(!matched)return[];return[{institution:record.institution,programme:record.programme,officialUrl:record.officialUrl,fieldRelation:terms.get(matched.toLowerCase())??"highly_related",discoveryQuery:record.discoveryQuery,discoveredAt:record.discoveredAt}]});
}

