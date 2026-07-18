import "server-only";
import { safeFetchText } from "@/lib/server/safe-fetch";

const crawlerUserAgent = "AtlasKnowledgeBot/1.0 (+https://atlas.example/knowledge-ops)";
const minimumIntervalMs = 2500;
const lastAccess = new Map<string, number>();

export const atlasCrawlerPolicy = {
  userAgent: crawlerUserAgent,
  minimumIntervalMs,
  cacheTtlMs: 24 * 60 * 60 * 1000,
  maxRedirects: 4,
  requestTimeoutMs: 15000,
};

export function isOfficialUrl(url: string, officialDomains: string[]) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return officialDomains.some((domain) => hostname === domain.toLowerCase() || hostname.endsWith(`.${domain.toLowerCase()}`));
  } catch {
    return false;
  }
}

function parseRobots(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.replace(/#.*$/, "").trim()).filter(Boolean);
  const groups: Array<{ agents: string[]; disallow: string[] }> = [];
  let current: { agents: string[]; disallow: string[] } | undefined;
  for (const line of lines) {
    const [rawKey, ...rawValue] = line.split(":");
    const key = rawKey.toLowerCase();
    const value = rawValue.join(":").trim();
    if (key === "user-agent") {
      if (!current || current.disallow.length) {
        current = { agents: [], disallow: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if (key === "disallow" && current) {
      current.disallow.push(value);
    }
  }
  return groups;
}

export async function robotsAllows(url: string, fetcher: typeof fetch = fetch) {
  const target = new URL(url);
  const robotsUrl = `${target.protocol}//${target.host}/robots.txt`;
  try {
    void fetcher;
    const response = await safeFetchText(robotsUrl, { allowedDomains: [target.hostname], timeoutMs: atlasCrawlerPolicy.requestTimeoutMs, maxBytes: 256_000, allowedContentTypes: ["text/plain"], init: { headers: { "user-agent": crawlerUserAgent, accept: "text/plain" } } });
    if (!response.ok) return { allowed: true, robotsUrl, reason: "robots.txt unavailable; use conservative rate limit" };
    const groups = parseRobots(response.text);
    const agent = crawlerUserAgent.split("/")[0].toLowerCase();
    const matching = groups.filter((group) => group.agents.includes(agent) || group.agents.includes("*"));
    const blocked = matching.flatMap((group) => group.disallow).filter(Boolean).some((path) => target.pathname.startsWith(path));
    return { allowed: !blocked, robotsUrl, reason: blocked ? "robots.txt disallows this path" : "allowed by robots.txt" };
  } catch {
    return { allowed: true, robotsUrl, reason: "robots check failed; allow only with conservative throttling" };
  }
}

export async function waitForDomainRateLimit(url: string) {
  const host = new URL(url).host;
  const now = Date.now();
  const wait = Math.max(0, (lastAccess.get(host) ?? 0) + minimumIntervalMs - now);
  if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
  lastAccess.set(host, Date.now());
}

export async function fetchOfficialPage(url: string, officialDomains: string[], fetcher: typeof fetch = fetch) {
  if (!isOfficialUrl(url, officialDomains)) throw new Error("Rejected non-official source domain");
  const robots = await robotsAllows(url, fetcher);
  if (!robots.allowed) throw new Error("Official source blocks automated access");
  await waitForDomainRateLimit(url);
  void fetcher;
  const response = await safeFetchText(url, { allowedDomains: officialDomains, timeoutMs: atlasCrawlerPolicy.requestTimeoutMs, maxRedirects: atlasCrawlerPolicy.maxRedirects, maxBytes: 2_000_000, allowedContentTypes: ["text/html", "application/xhtml+xml", "application/pdf", "application/xml", "text/xml"], init: { headers: {
      "user-agent": crawlerUserAgent,
      accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.1",
      "accept-language": "en,fr;q=0.8",
    } } });
  return { ...response, text: async () => response.text };
}

