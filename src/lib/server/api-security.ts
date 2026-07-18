import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { ZodType } from "zod";

export type ApiErrorCode = "BAD_REQUEST" | "BODY_TOO_LARGE" | "FORBIDDEN_ORIGIN" | "UNAUTHORIZED" | "ENTITLEMENT_REQUIRED" | "RATE_LIMITED" | "DAILY_QUOTA_EXCEEDED" | "CONFLICT" | "SERVICE_UNAVAILABLE" | "INTERNAL_ERROR";
export type ApiContext = { requestId: string; sessionId: string; clientKey: string; setCookie?: string };
type LimitResult = { allowed: boolean; remaining: number; retryAfterSeconds: number };
export interface RateLimitRepository { consume(key: string, limit: number, windowMs: number): Promise<LimitResult> }

const SESSION_COOKIE = "atlas_session";
const memoryBuckets = new Map<string, { count: number; resetAt: number }>();
const runtimeSecret = randomUUID();

class MemoryRateLimitRepository implements RateLimitRepository {
  async consume(key: string, limit: number, windowMs: number): Promise<LimitResult> {
    const now = Date.now(); const current = memoryBuckets.get(key);
    const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
    bucket.count += 1; memoryBuckets.set(key, bucket);
    return { allowed: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count), retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
}

export const rateLimits: RateLimitRepository = new MemoryRateLimitRepository();
const signingSecret = () => process.env.ATLAS_SESSION_SECRET ?? process.env.OPENAI_API_KEY ?? runtimeSecret;
const digest = (value: string) => createHash("sha256").update(value).digest("hex").slice(0, 24);
const signature = (value: string) => createHmac("sha256", signingSecret()).update(value).digest("base64url");
const cookieValue = (sessionId: string) => `${sessionId}.${signature(sessionId)}`;

function parseCookies(value: string | null) {
  return new Map((value ?? "").split(";").map((item) => item.trim().split(/=(.*)/)).filter((item) => item[0]).map(([key, val]) => [key, val ?? ""]));
}

function validSession(value?: string) {
  if (!value) return undefined; const index = value.lastIndexOf("."); if (index < 1) return undefined;
  const id = value.slice(0, index); const supplied = Buffer.from(value.slice(index + 1)); const expected = Buffer.from(signature(id));
  return supplied.length === expected.length && timingSafeEqual(supplied, expected) ? id : undefined;
}

export function createApiContext(request: Request): ApiContext {
  const requestId = request.headers.get("x-request-id")?.slice(0, 80) || randomUUID();
  const existing = validSession(parseCookies(request.headers.get("cookie")).get(SESSION_COOKIE));
  const sessionId = existing ?? randomUUID();
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return { requestId, sessionId, clientKey: digest(`${forwarded}:${request.headers.get("user-agent") ?? "unknown"}`), setCookie: existing ? undefined : `${SESSION_COOKIE}=${cookieValue(sessionId)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000` };
}

export function validateMutationOrigin(request: Request) {
  const site = request.headers.get("sec-fetch-site"); if (site === "cross-site") return false;
  const origin = request.headers.get("origin"); if (!origin) return true;
  const allowed = new Set([new URL(request.url).origin, process.env.NEXT_PUBLIC_SITE_URL].filter(Boolean));
  return allowed.has(origin);
}

export async function parseJson<T>(request: Request, schema: ZodType<T>, maxBytes = 32_768): Promise<T> {
  const declared = Number(request.headers.get("content-length") ?? 0); if (declared > maxBytes) throw apiException("BODY_TOO_LARGE", 413);
  const text = await request.text(); if (Buffer.byteLength(text, "utf8") > maxBytes) throw apiException("BODY_TOO_LARGE", 413);
  let raw: unknown; try { raw = JSON.parse(text); } catch { throw apiException("BAD_REQUEST", 400); }
  const result = schema.safeParse(raw); if (!result.success) throw apiException("BAD_REQUEST", 400, { issues: result.error.issues.map(issue => ({ path: issue.path.join("."), code: issue.code })) });
  return result.data;
}

export function apiException(code: ApiErrorCode, status: number, details?: unknown) { return Object.assign(new Error(code), { code, status, details }); }
export function isApiException(value: unknown): value is Error & { code: ApiErrorCode; status: number; details?: unknown } { return value instanceof Error && "code" in value && "status" in value; }

export function apiResponse(ctx: ApiContext, body: unknown, status = 200, headers?: HeadersInit) {
  const response = NextResponse.json(body, { status, headers }); response.headers.set("x-request-id", ctx.requestId); response.headers.set("cache-control", response.headers.get("cache-control") ?? "no-store"); if (ctx.setCookie) response.headers.append("set-cookie", ctx.setCookie); return response;
}
export function apiError(ctx: ApiContext, error: unknown, fallbackCode: ApiErrorCode = "INTERNAL_ERROR") {
  const known = isApiException(error); const code = known ? error.code : fallbackCode; const status = known ? error.status : 500;
  secureLog(status >= 500 ? "error" : "warn", "api_error", ctx, { errorCode: code, status });
  return apiResponse(ctx, { error: { code, message: code, ...(known && error.details ? { details: error.details } : {}) }, requestId: ctx.requestId }, status);
}
export function secureLog(level: "info" | "warn" | "error", event: string, ctx: ApiContext, fields: Record<string, unknown> = {}) { console[level]("[atlas-api]", { event, requestId: ctx.requestId, anonymousUserId: digest(ctx.sessionId), ...fields }); }

export async function enforceLimit(ctx: ApiContext, scope: string, limit: number, windowMs: number, code: ApiErrorCode = "RATE_LIMITED") {
  const session = await rateLimits.consume(`${scope}:session:${ctx.sessionId}`, limit, windowMs); const ip = await rateLimits.consume(`${scope}:client:${ctx.clientKey}`, limit * 2, windowMs);
  if (!session.allowed || !ip.allowed) throw apiException(code, 429, { retryAfterSeconds: Math.max(session.retryAfterSeconds, ip.retryAfterSeconds) });
}
export const stableHash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

