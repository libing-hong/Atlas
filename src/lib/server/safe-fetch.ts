import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export class SafeFetchError extends Error { constructor(public readonly code: string) { super(code); } }
export type SafeFetchOptions = { timeoutMs?: number; maxBytes?: number; maxRedirects?: number; allowedContentTypes?: string[]; allowedDomains?: string[]; init?: RequestInit };

function blockedAddress(address: string) {
  if (address === "::1" || address === "0.0.0.0" || address === "::") return true;
  if (address.includes(":")) return /^(?:fc|fd|fe8|fe9|fea|feb)/i.test(address);
  const parts = address.split(".").map(Number); const [a, b] = parts;
  return a === 10 || a === 127 || a === 0 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19));
}

async function validateTarget(rawUrl: string, allowedDomains?: string[]) {
  let url: URL; try { url = new URL(rawUrl); } catch { throw new SafeFetchError("INVALID_URL"); }
  if (url.protocol !== "https:" || url.username || url.password || url.port && url.port !== "443") throw new SafeFetchError("UNSAFE_PROTOCOL");
  const host = url.hostname.toLowerCase().replace(/\.$/, ""); if (host === "localhost" || host.endsWith(".localhost")) throw new SafeFetchError("PRIVATE_ADDRESS");
  if (allowedDomains?.length && !allowedDomains.some(domain => host === domain.toLowerCase() || host.endsWith(`.${domain.toLowerCase()}`))) throw new SafeFetchError("DOMAIN_NOT_ALLOWED");
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true, verbatim: true }); if (!addresses.length || addresses.some(item => blockedAddress(item.address))) throw new SafeFetchError("PRIVATE_ADDRESS");
  return url;
}

export async function safeFetchText(rawUrl: string, options: SafeFetchOptions = {}) {
  const timeoutMs = options.timeoutMs ?? 8_000; const maxBytes = options.maxBytes ?? 1_500_000; const maxRedirects = options.maxRedirects ?? 3; let current = rawUrl;
  for (let redirect = 0; redirect <= maxRedirects; redirect += 1) {
    const url = await validateTarget(current, options.allowedDomains); const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response; try { response = await fetch(url, { ...options.init, redirect: "manual", signal: controller.signal, cache: "no-store" }); } finally { clearTimeout(timer); }
    if ([301,302,303,307,308].includes(response.status)) { const location = response.headers.get("location"); if (!location || redirect === maxRedirects) throw new SafeFetchError("REDIRECT_REJECTED"); current = new URL(location, url).toString(); continue; }
    const contentType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ?? ""; if (options.allowedContentTypes?.length && !options.allowedContentTypes.some(type => contentType === type || contentType.startsWith(type))) throw new SafeFetchError("CONTENT_TYPE_REJECTED");
    const declared = Number(response.headers.get("content-length") ?? 0); if (declared > maxBytes) throw new SafeFetchError("RESPONSE_TOO_LARGE");
    const reader = response.body?.getReader(); const chunks: Uint8Array[] = []; let size = 0; if (reader) while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > maxBytes) { await reader.cancel(); throw new SafeFetchError("RESPONSE_TOO_LARGE"); } chunks.push(value); }
    const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return { ok: response.ok, status: response.status, url: response.url || url.toString(), headers: response.headers, text: new TextDecoder().decode(bytes) };
  }
  throw new SafeFetchError("REDIRECT_REJECTED");
}

