import type { EntityType, FieldExpansion, FieldRelation, ProgrammeLead, UnderstoodProfile } from "./types";

export interface ProgrammeDiscoveryProvider { discover(profile: UnderstoodProfile, terms: FieldExpansion[], limit: number): Promise<ProgrammeLead[]> }
type SearchResult = { title: string; url: string; snippet?: string };

const decode = (value: string) => value.replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const hostileHost = /(amazon\.|goodreads\.|facebook\.|linkedin\.|instagram\.|youtube\.|wikipedia\.|mastersportal\.|findamasters\.|studyportals\.|educations\.com|gostudyin\.|reddit\.|medium\.|blogspot\.|wordpress\.)/i;
const nonProgrammeTitle = /\b(book|manual|ranking|top\s*\d+|news|guide|blog|article|association|directory)\b|收藏帖|留学.*介绍|排名|ニュース|トップ\d+/i;

export function classifyProgrammeLead(result: SearchResult): EntityType {
  let host = ""; let path = "";
  try { const parsed = new URL(result.url); host = parsed.hostname; path = parsed.pathname; } catch { return "unknown"; }
  if (/amazon\.|book|goodreads/i.test(`${host} ${path} ${result.title}`)) return /amazon/i.test(host) ? "marketplace" : "book";
  if (/association|society|network/i.test(`${host} ${result.title}`)) return "association";
  if (/news|press|actualit/i.test(`${path} ${result.title}`)) return "news";
  if (/blog|medium|wordpress/i.test(`${host} ${path}`)) return "blog";
  if (hostileHost.test(host) || /directory|portal|ranking/i.test(`${host} ${path}`)) return "aggregator";
  if (nonProgrammeTitle.test(result.title)) return "article";
  if (/\/program(?:me)?s?\/|\/courses?\/|\/study\/.*(?:master|llm|bachelor)|\/(?:msc|ma|llm|master)-/i.test(path) && /master|msc|ma\b|llm|bachelor|degree|programme|program|arts|law/i.test(result.title)) return "official_programme";
  if (/university|universit[eé]|school|college|école/i.test(result.title)) return "official_institution";
  return "unknown";
}

const countryNames: Record<string, string> = { "法国": "France", "英国": "United Kingdom", "澳洲": "Australia", "澳大利亚": "Australia" };
const relationFor = (title: string, terms: FieldExpansion[]): FieldRelation => terms.find(term => title.toLowerCase().includes(term.term.toLowerCase()))?.relation ?? "adjacent";
const toLead = (result: SearchResult, query: string, terms: FieldExpansion[]): ProgrammeLead => ({ url: result.url, searchTitle: decode(result.title), snippet: result.snippet ? decode(result.snippet) : null, entityType: classifyProgrammeLead(result), fieldRelation: relationFor(result.title, terms), discoveryQuery: query, discoveredAt: new Date().toISOString() });

export class OfficialWebDiscoveryProvider implements ProgrammeDiscoveryProvider {
  async discover(profile: UnderstoodProfile, terms: FieldExpansion[], limit: number) {
    const countries = profile.targetCountries.map(country => countryNames[country] ?? country).join(" OR ");
    const level = profile.targetDegreeLevel === "bachelor" ? "bachelor" : profile.targetDegreeLevel === "doctorate" ? "PhD" : "master MSc MA LLM";
    const queries = terms.slice(0, 10).map(term => `site:.edu OR site:.ac.uk OR site:.fr OR site:.edu.au "${term.term}" (${countries}) ${level} admissions`);
    const leads: ProgrammeLead[] = [];
    for (const query of queries) {
      if (process.env.PROGRAMME_SEARCH_API_URL) {
        const response = await fetch(process.env.PROGRAMME_SEARCH_API_URL, { method: "POST", headers: { "Content-Type": "application/json", ...(process.env.PROGRAMME_SEARCH_API_KEY ? { Authorization: `Bearer ${process.env.PROGRAMME_SEARCH_API_KEY}` } : {}) }, body: JSON.stringify({ query, limit }), cache: "no-store", signal: AbortSignal.timeout(9000) }).catch(() => null);
        if (response?.ok) {
          const payload = await response.json() as { results?: SearchResult[] };
          for (const result of payload.results ?? []) if (leads.length < limit) leads.push(toLead(result, query, terms));
          continue;
        }
      }
      const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, { headers: { "User-Agent": "AtlasProgrammeDiscovery/2.0" }, cache: "no-store", signal: AbortSignal.timeout(9000) }).catch(() => null);
      if (!response?.ok) continue;
      const html = await response.text(); const pattern = /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi; let match: RegExpExecArray | null;
      while ((match = pattern.exec(html)) && leads.length < limit) { let url = decode(match[1]); try { const redirect = new URL(url, "https://duckduckgo.com"); url = redirect.searchParams.get("uddg") ?? url; } catch {} leads.push(toLead({ url, title: decode(match[2]) }, query, terms)); }
    }
    return leads.filter((lead, index, all) => all.findIndex(other => other.url === lead.url) === index);
  }
}

