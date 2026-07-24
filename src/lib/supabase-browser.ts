"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!client) client = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  return client;
}

export function saveAccessToken(token: string | null) {
  if (typeof document === "undefined") return;
  if (!token) {
    document.cookie = "atlas_access_token=; Path=/; Max-Age=0; SameSite=Lax; Secure";
    return;
  }
  document.cookie = `atlas_access_token=${encodeURIComponent(token)}; Path=/; Max-Age=3600; SameSite=Lax; Secure`;
}


