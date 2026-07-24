import "server-only";
import { createClient } from "@supabase/supabase-js";

export async function recordAuditEvent(event: { action: string; resourceType: string; resourceId?: string; actorUserId?: string; subjectUserId?: string; metadata?: Record<string, string | number | boolean | null> }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await client.from("audit_events").insert({ actor_user_id: event.actorUserId ?? null, subject_user_id: event.subjectUserId ?? null, action: event.action, resource_type: event.resourceType, resource_id: event.resourceId ?? null, metadata: event.metadata ?? {} });
  if (error) console.warn("[atlas-audit]", { action: event.action, resourceType: event.resourceType, errorCode: "AUDIT_WRITE_FAILED" });
}
