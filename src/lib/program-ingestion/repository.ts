import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getProgramContent } from "../program-knowledge";
import type { ProgramContentProfile } from "../program-knowledge";
import type { ExtractedProgramField, ProgramIngestionJob, ProgramIngestionJobStatus } from "./types";

function adminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function getProgramContentFromStore(programId: string): Promise<ProgramContentProfile | undefined> {
  const client = adminClient();
  if (!client) return getProgramContent(programId);
  const [{ data: profile, error }, { data: modules }] = await Promise.all([
    client.from("program_content_profiles").select("*").eq("program_id", programId).maybeSingle(),
    client.from("program_course_modules").select("*").eq("program_id", programId).order("display_order"),
  ]);
  if (error || !profile) return getProgramContent(programId);
  const program = await client.from("programs").select("official_program_url").eq("id", programId).maybeSingle();
  const mappedModules = (modules ?? []).map((module) => ({
    code: module.code ?? undefined,
    name: module.name,
    credits: module.credits === null ? undefined : Number(module.credits),
    type: module.module_type,
  }));
  return {
    programId,
    introduction: profile.introduction,
    targetStudents: profile.target_students ?? undefined,
    learningFocus: profile.learning_focus ?? [],
    coreModules: mappedModules.filter((module) => module.type === "core" || module.type === "project" || module.type === "dissertation"),
    optionalModules: mappedModules.filter((module) => module.type === "optional"),
    learningOutcomes: profile.learning_outcomes ?? [],
    practicalComponents: profile.practical_components ?? [],
    careerDirections: profile.career_directions ?? [],
    durationOptions: profile.duration_options ?? [],
    accreditation: profile.accreditation ?? [],
    teachingLocation: profile.teaching_location ?? undefined,
    teachingFormat: profile.teaching_format ?? undefined,
    officialProgramUrl: program.data?.official_program_url ?? getProgramContent(programId)?.officialProgramUrl ?? "",
    officialCurriculumUrl: profile.official_curriculum_url ?? undefined,
    sourceRetrievedAt: profile.source_retrieved_at,
    lastVerifiedAt: profile.last_verified_at,
    verificationStatus: profile.verification_status,
    coverageStatus: profile.coverage_status === "source_unavailable" ? "not_available" : profile.coverage_status,
  };
}

export async function enqueueProgramIngestion(programId: string, trigger: ProgramIngestionJob["trigger"], priority = 50) {
  const client = adminClient();
  if (!client) return { queued: false, reason: "Knowledge database is not configured" };
  const existing = await client.from("program_ingestion_jobs")
    .select("id,status")
    .eq("program_id", programId)
    .in("status", ["queued", "discovering", "fetching", "extracting", "validating"])
    .maybeSingle();
  if (existing.data) return { queued: true, jobId: existing.data.id, existing: true };
  const inserted = await client.from("program_ingestion_jobs")
    .insert({ program_id: programId, trigger, priority, status: "queued" })
    .select("id")
    .single();
  if (inserted.error) throw inserted.error;
  return { queued: true, jobId: inserted.data.id, existing: false };
}

export async function updateIngestionJob(jobId: string, status: ProgramIngestionJobStatus, error?: string) {
  const client = adminClient();
  if (!client) return;
  await client.from("program_ingestion_jobs").update({ status, last_error: error ?? null, updated_at: new Date().toISOString() }).eq("id", jobId);
}

export async function saveExtractedEvidence(programId: string, fields: ExtractedProgramField[]) {
  const client = adminClient();
  if (!client || !fields.length) return;
  const rows = fields.map((field) => ({
    program_id: programId,
    field_name: field.field,
    field_value: field.value,
    source_url: field.sourceUrl,
    source_page_title: field.sourcePageTitle,
    source_text: field.sourceText ?? null,
    retrieved_at: field.retrievedAt,
    confidence: field.confidence,
    verification_status: field.verificationStatus,
  }));
  const result = await client.from("extracted_program_fields").insert(rows);
  if (result.error) throw result.error;
}

export async function createKnowledgeReview(programId: string, summary: string, sourcePayload: Record<string, unknown>) {
  const client = adminClient();
  if (!client) return;
  await client.from("knowledge_review_queue").insert({
    program_id: programId,
    review_type: "content_extraction",
    summary,
    source_payload: sourcePayload,
  });
}
