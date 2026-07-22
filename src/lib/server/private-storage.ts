import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { AtlasSession } from "./auth";

const BUCKET = "atlas-private-materials";

function storageAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_STORAGE_NOT_CONFIGURED");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function createMaterialSignedUrl(session: AtlasSession, objectPath: string, expiresInSeconds = 300) {
  const ownerId = objectPath.split("/")[0];
  if (session.role !== "admin" && ownerId !== session.userId) throw Object.assign(new Error("FORBIDDEN"), { status: 403 });
  const ttl = Math.min(600, Math.max(60, expiresInSeconds));
  const { data, error } = await storageAdmin().storage.from(BUCKET).createSignedUrl(objectPath, ttl);
  if (error || !data?.signedUrl) throw error ?? new Error("SIGNED_URL_FAILED");
  return { url: data.signedUrl, expiresInSeconds: ttl };
}
