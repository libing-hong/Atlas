"use client";

import { useEffect, useRef, useState } from "react";
import { collectCloudState, hydrateCloudState, type AtlasCloudState } from "@/lib/cloud-state";
import { getBrowserSupabase, saveAccessToken } from "@/lib/supabase-browser";

type SyncStatus = "checking" | "signed_out" | "synced" | "saving" | "error";

export function CloudStateProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SyncStatus>(() => process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "checking" : "signed_out");
  const [ready, setReady] = useState(false);
  const lastSaved = useRef("");
  const hydrated = useRef(false);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const authClient = supabase;

    let active = true;
    async function load() {
      const { data } = await authClient.auth.getSession();
      const token = data.session?.access_token ?? null;
      saveAccessToken(token);
      if (!token) { if (active) setStatus("signed_out"); return; }
      try {
        const response = await fetch("/api/account/state", { cache: "no-store" });
        if (!response.ok) throw new Error("state_load_failed");
        const payload = await response.json() as { state?: AtlasCloudState };
        const remote = payload.state ?? {};
        if (Object.keys(remote).length) hydrateCloudState(remote);
        else {
          const local = collectCloudState();
          if (Object.keys(local).length) await fetch("/api/account/state", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state: local }) });
        }
        lastSaved.current = JSON.stringify(collectCloudState());
        hydrated.current = true;
        setReady(true);
        if (active) setStatus("synced");
      } catch {
        if (active) setStatus("error");
      }
    }
    void load();

    const { data: listener } = authClient.auth.onAuthStateChange((_event, session) => {
      saveAccessToken(session?.access_token ?? null);
      if (!session) setStatus("signed_out");
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!ready) return;
    let timer: number | undefined;
    async function save() {
      if (!hydrated.current) return;
      const state = collectCloudState();
      const serialized = JSON.stringify(state);
      if (serialized === lastSaved.current) return;
      setStatus("saving");
      try {
        const response = await fetch("/api/account/state", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state }) });
        if (!response.ok) throw new Error("state_save_failed");
        lastSaved.current = serialized;
        setStatus("synced");
      } catch { setStatus("error"); }
    }
    const queue = () => { window.clearTimeout(timer); timer = window.setTimeout(() => void save(), 450); };
    const interval = window.setInterval(queue, 3000);
    window.addEventListener("atlas-student-profile-change", queue);
    window.addEventListener("atlas-planning-state-change", queue);
    window.addEventListener("atlas-application-state-change", queue);
    window.addEventListener("visibilitychange", queue);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timer);
      window.removeEventListener("atlas-student-profile-change", queue);
      window.removeEventListener("atlas-planning-state-change", queue);
      window.removeEventListener("atlas-application-state-change", queue);
      window.removeEventListener("visibilitychange", queue);
    };
  }, [ready]);

  return <div data-cloud-state={status}>{children}</div>;
}

