import "server-only";
import type { ProgramDiscoveryInput, ProgramSourceCandidate } from "./types";
import { fetchOfficialPage, isOfficialUrl } from "./source-policy";

export type OfficialSiteSearchAdapter = {
  search(query: { domain: string; programName: string; degreeType: string; intakeYear?: number }): Promise<Array<{ url: string; title?: string }>>;
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function candidateScore(url: string, title: string, input: ProgramDiscoveryInput) {
  const haystack = normalize(`${url} ${title}`);
  const tokens = normalize(input.programName).split(" ").filter((token) => token.length > 2);
  const degree = normalize(input.degreeType);
  const tokenScore = tokens.length ? tokens.filter((token) => haystack.includes(token)).length / tokens.length : 0;
  const degreeScore = degree && haystack.includes(degree) ? 0.15 : 0;
  const yearScore = input.intakeYear && haystack.includes(String(input.intakeYear)) ? 0.05 : 0;
  return Math.min(1, 0.45 + tokenScore * 0.35 + degreeScore + yearScore);
}

function sourceType(url: string): ProgramSourceCandidate["type"] {
  const normalizedUrl = url.toLowerCase();
  if (normalizedUrl.endsWith(".pdf")) return "programme_specification_pdf";
  if (/module|catalogue|curriculum|course-content|programme-structure/.test(normalizedUrl)) return "curriculum_page";
  if (/career|employability/.test(normalizedUrl)) return "careers_page";
  return "program_page";
}

async function sitemapCandidates(domain: string, input: ProgramDiscoveryInput) {
  const urls = [`https://${domain}/sitemap.xml`, `https://www.${domain}/sitemap.xml`];
  for (const sitemapUrl of urls) {
    try {
      const response = await fetchOfficialPage(sitemapUrl, input.officialDomains);
      if (!response.ok) continue;
      const xml = await response.text();
      const locations = [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map((match) => match[1].trim()).slice(0, 5000);
      const candidates = locations
        .filter((url) => isOfficialUrl(url, input.officialDomains))
        .map((url) => ({ url, score: candidateScore(url, "", input) }))
        .filter((item) => item.score >= 0.62)
        .sort((left, right) => right.score - left.score)
        .slice(0, 12);
      if (candidates.length) return candidates;
    } catch {
      // Try the next official sitemap form.
    }
  }
  return [];
}

export async function discoverProgramSources(input: ProgramDiscoveryInput, search?: OfficialSiteSearchAdapter) {
  const candidates = new Map<string, ProgramSourceCandidate>();
  for (const url of input.registeredUrls ?? []) {
    if (!isOfficialUrl(url, input.officialDomains)) continue;
    candidates.set(url, {
      url,
      type: sourceType(url),
      officialDomain: new URL(url).hostname,
      confidence: candidateScore(url, "", input),
      discoveryMethod: "registered",
    });
  }

  for (const domain of input.officialDomains) {
    for (const item of await sitemapCandidates(domain, input)) {
      candidates.set(item.url, {
        url: item.url,
        type: sourceType(item.url),
        officialDomain: new URL(item.url).hostname,
        confidence: item.score,
        discoveryMethod: "sitemap",
      });
    }
    if (search) {
      const results = await search.search({ domain, programName: input.programName, degreeType: input.degreeType, intakeYear: input.intakeYear });
      for (const result of results.slice(0, 10)) {
        if (!isOfficialUrl(result.url, input.officialDomains)) continue;
        candidates.set(result.url, {
          url: result.url,
          title: result.title,
          type: sourceType(result.url),
          officialDomain: new URL(result.url).hostname,
          confidence: candidateScore(result.url, result.title ?? "", input),
          discoveryMethod: "official_search",
        });
      }
    }
  }

  return [...candidates.values()].sort((left, right) => right.confidence - left.confidence);
}
