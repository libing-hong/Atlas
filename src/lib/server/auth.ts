import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export type AtlasRole = "student" | "advisor" | "admin";
export type AtlasSession = { userId: string; authUserId: string; role: AtlasRole };

export const isPrototypeMode = () => !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function bearerToken(authorization: string | null, cookieValue: string | undefined) {
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7).trim();
  return cookieValue?.trim() || null;
}

export async function getAtlasSession(request?: Request): Promise<AtlasSession | null> {
  if (isPrototypeMode()) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  const requestHeaders = request ? request.headers : await headers();
  const cookieStore = request ? null : await cookies();
  const token = bearerToken(requestHeaders.get("authorization"), request ? undefined : cookieStore?.get("atlas_access_token")?.value);
  if (!token) return null;
  const client = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await client.auth.getUser(token);
  if (authError || !authData.user) return null;
  const { data: profile, error: profileError } = await client.from("users").select("id, role").eq("auth_user_id", authData.user.id).maybeSingle();
  if (profileError || !profile || !["student", "advisor", "admin"].includes(profile.role)) return null;
  return { userId: profile.id, authUserId: authData.user.id, role: profile.role as AtlasRole };
}

export async function requirePageRole(roles: AtlasRole[]) {
  const session = await getAtlasSession();
  if (!session || !roles.includes(session.role)) redirect("/");
  return session;
}

export async function authorizeRequest(request: Request, roles: AtlasRole[]) {
  const session = await getAtlasSession(request);
  if (!session) return { ok: false as const, status: 401 as const, session: null };
  if (!roles.includes(session.role)) return { ok: false as const, status: 403 as const, session };
  return { ok: true as const, status: 200 as const, session };
}
