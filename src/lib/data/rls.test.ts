import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const sql = readFileSync(resolve("supabase/migrations/202607190001_production_identity_and_rls.sql"), "utf8");

test("all user-owned production tables enable RLS", () => {
  for (const table of ["users", "student_profiles", "advisor_assignments", "planning_runs", "recommendation_runs", "recommendation_candidates", "programme_verifications", "application_records", "materials", "service_orders", "consents", "privacy_requests", "audit_events"]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  }
});

test("student access requires ownership, assignment, or admin role", () => {
  assert.match(sql, /target = public\.current_atlas_user_id\(\)/);
  assert.match(sql, /advisor_assignments/);
  assert.match(sql, /current_atlas_role\(\) = 'admin'/);
});

test("material storage is private and owner-scoped", () => {
  assert.match(sql, /atlas-private-materials','atlas-private-materials',false/);
  assert.match(sql, /private_material_owner_write/);
  assert.doesNotMatch(sql, /values \('atlas-private-materials','atlas-private-materials',true\)/);
});
