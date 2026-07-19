import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type AtlasEntity = "student_profile" | "planning_run" | "recommendation_run" | "application_record" | "material" | "service_order" | "consent" | "privacy_request";
export interface AtlasRepository {
  mode: "prototype" | "supabase";
  list<T>(entity: AtlasEntity): Promise<T[]>;
  get<T extends { id?: string }>(entity: AtlasEntity, id: string): Promise<T | null>;
  upsert<T extends { id: string }>(entity: AtlasEntity, value: T): Promise<T>;
}

const keys: Record<AtlasEntity, string> = {
  student_profile: "atlas.student-profile.v2", planning_run: "atlas.planning-runs.v2", recommendation_run: "atlas.recommendation-candidates.v1",
  application_record: "atlas.application.records.v1", material: "atlas.material-statuses.v1", service_order: "atlas.service-orders.v1",
  consent: "atlas.consents.v1", privacy_request: "atlas.privacy-requests.v1",
};
const tables: Record<AtlasEntity, string> = {
  student_profile: "student_profiles", planning_run: "planning_runs", recommendation_run: "recommendation_runs",
  application_record: "application_records", material: "materials", service_order: "service_orders", consent: "consents", privacy_request: "privacy_requests",
};

export class LocalStorageRepository implements AtlasRepository {
  mode = "prototype" as const;
  private values<T>(entity: AtlasEntity): T[] {
    if (typeof window === "undefined") return [];
    try { const value = JSON.parse(window.localStorage.getItem(keys[entity]) ?? "[]") as T | T[]; return Array.isArray(value) ? value : [value]; } catch { return []; }
  }
  async list<T>(entity: AtlasEntity) { return this.values<T>(entity); }
  async get<T extends { id?: string }>(entity: AtlasEntity, id: string) { return this.values<T>(entity).find((item) => item.id === id) ?? null; }
  async upsert<T extends { id: string }>(entity: AtlasEntity, value: T) { const next = [...this.values<T>(entity).filter((item) => item.id !== value.id), value]; if (typeof window !== "undefined") window.localStorage.setItem(keys[entity], JSON.stringify(next)); return value; }
  exportMigrationBundle() { return Object.fromEntries((Object.keys(keys) as AtlasEntity[]).map((entity) => [entity, this.values(entity)])); }
}

export class SupabaseRepository implements AtlasRepository {
  mode = "supabase" as const;
  constructor(private readonly client: SupabaseClient) {}
  async list<T>(entity: AtlasEntity) { const { data, error } = await this.client.from(tables[entity]).select("*"); if (error) throw error; return (data ?? []) as T[]; }
  async get<T extends { id?: string }>(entity: AtlasEntity, id: string) { const { data, error } = await this.client.from(tables[entity]).select("*").eq("id", id).maybeSingle(); if (error) throw error; return data as T | null; }
  async upsert<T extends { id: string }>(entity: AtlasEntity, value: T) { const { data, error } = await this.client.from(tables[entity]).upsert(value).select().single(); if (error) throw error; return data as T; }
}

export function createBrowserRepository(): AtlasRepository {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? new SupabaseRepository(createClient(url, key)) : new LocalStorageRepository();
}
