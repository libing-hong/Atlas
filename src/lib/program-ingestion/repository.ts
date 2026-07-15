import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { getProgramContent } from "../program-knowledge";
import type { CourseModule, ProgramContentProfile } from "../program-knowledge";
import type { ExtractedProgramField, ExtractionMethod, ProgramIngestionJob, ProgramIngestionJobStatus, ProgramSourceCandidate } from "./types";

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
    type: module.module_type as CourseModule["type"],
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
    coverageStatus: profile.coverage_status as ProgramContentProfile["coverageStatus"],
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


export async function publishProgramContent(input: {
  programId: string;
  introduction: string;
  learningFocus: string[];
  learningOutcomes: string[];
  practicalComponents: string[];
  careerDirections: string[];
  targetStudents?: string;
  durationOptions: Array<{ label: string; months?: number; description?: string }>;
  accreditation: string[];
  teachingLocation?: string;
  teachingFormat?: string;
  officialCurriculumUrl?: string;
  modules: Array<{ code?: string; name: string; credits?: number; type: "core" | "optional" | "project" | "internship" | "dissertation"; sourceUrl: string }>;
  coverageStatus: "verified" | "partially_verified";
  verifiedAt: string;
}) {
  const client = adminClient();
  if (!client) return { published: false, reason: "Knowledge database is not configured" };
  const profileResult = await client.from("program_content_profiles").upsert({
    program_id: input.programId,
    introduction: input.introduction,
    target_students: input.targetStudents ?? null,
    learning_focus: input.learningFocus,
    learning_outcomes: input.learningOutcomes,
    practical_components: input.practicalComponents,
    career_directions: input.careerDirections,
    duration_options: input.durationOptions,
    accreditation: input.accreditation,
    teaching_location: input.teachingLocation ?? null,
    teaching_format: input.teachingFormat ?? null,
    official_curriculum_url: input.officialCurriculumUrl ?? null,
    source_retrieved_at: input.verifiedAt,
    last_verified_at: input.verifiedAt,
    verification_status: input.coverageStatus === "verified" ? "verified_official" : "partially_verified",
    coverage_status: input.coverageStatus,
    updated_at: input.verifiedAt,
  });
  if (profileResult.error) throw profileResult.error;
  await client.from("program_course_modules").delete().eq("program_id", input.programId);
  if (input.modules.length) {
    const moduleResult = await client.from("program_course_modules").insert(input.modules.map((module, index) => ({
      program_id: input.programId,
      code: module.code ?? null,
      name: module.name,
      credits: module.credits ?? null,
      module_type: module.type,
      display_order: index,
      source_url: module.sourceUrl,
      last_verified_at: input.verifiedAt,
    })));
    if (moduleResult.error) throw moduleResult.error;
  }
  return { published: true };
}


export async function recordProgramSourceSnapshot(input: {
  programId: string;
  source: ProgramSourceCandidate;
  extractionMethod: ExtractionMethod;
  content: string;
  pageTitle?: string;
  httpStatus?: number;
}) {
  const client = adminClient();
  const contentHash = createHash("sha256").update(input.content).digest("hex");
  if (!client) return { recorded: false, changed: false, contentHash };
  const previous = await client.from("program_sources")
    .select("id,content_hash,verified_content_hash")
    .eq("program_id", input.programId)
    .eq("source_url", input.source.url)
    .maybeSingle();
  const changed = Boolean(previous.data?.verified_content_hash && previous.data.verified_content_hash !== contentHash);
  const sourceResult = await client.from("program_sources").upsert({
    program_id: input.programId,
    source_url: input.source.url,
    source_type: input.source.type,
    official_domain: input.source.officialDomain,
    discovery_method: input.source.discoveryMethod,
    extraction_method: input.extractionMethod,
    confidence: input.source.confidence,
    robots_checked_at: new Date().toISOString(),
    last_retrieved_at: new Date().toISOString(),
    content_hash: contentHash,
    status: "active",
  }, { onConflict: "program_id,source_url" }).select("id").single();
  if (sourceResult.error) throw sourceResult.error;
  const snapshotResult = await client.from("program_source_snapshots").upsert({
    program_source_id: sourceResult.data.id,
    content_hash: contentHash,
    page_title: input.pageTitle ?? null,
    retrieved_at: new Date().toISOString(),
    http_status: input.httpStatus ?? null,
    change_status: previous.data ? changed ? "changed" : "unchanged" : "new",
  }, { onConflict: "program_source_id,content_hash" });
  if (snapshotResult.error) throw snapshotResult.error;
  if (changed) {
    await createKnowledgeReview(input.programId, "学校官方页面内容发生变化，发布前需要复核", {
      sourceUrl: input.source.url,
      previousVerifiedHash: previous.data?.verified_content_hash,
      currentHash: contentHash,
    });
  }
  return { recorded: true, changed, contentHash };
}


export async function enqueueDueProgramRefreshes(limit = 25, staleAfterDays = 30) {
  const client = adminClient();
  if (!client) return { queued: 0, reason: "Knowledge database is not configured" };
  const threshold = new Date(Date.now() - staleAfterDays * 24 * 60 * 60 * 1000).toISOString();
  const due = await client.from("program_content_profiles")
    .select("program_id")
    .lt("last_verified_at", threshold)
    .order("last_verified_at", { ascending: true })
    .limit(limit);
  if (due.error) throw due.error;

  let queued = 0;
  for (const row of due.data ?? []) {
    const result = await enqueueProgramIngestion(row.program_id, "scheduled_refresh", 35);
    if (result.queued && !result.existing) queued += 1;
  }
  return { queued };
}


export async function claimNextProgramIngestionJob() {
  const client = adminClient();
  if (!client) return undefined;
  const claimed = await client.rpc("claim_program_ingestion_job");
  if (claimed.error) throw claimed.error;
  const row = claimed.data?.[0];
  return row ? { id: row.job_id as string, programId: row.program_id as string } : undefined;
}

export async function getProgramDiscoveryInput(programId: string): Promise<import("./types").ProgramDiscoveryInput | undefined> {
  const client = adminClient();
  if (!client) return undefined;
  const result = await client.from("programs")
    .select("id,canonical_name,intake_year,official_program_url,universities(canonical_name)")
    .eq("id", programId)
    .maybeSingle();
  if (result.error) throw result.error;
  if (!result.data) return undefined;
  const officialProgramUrl = result.data.official_program_url;
  const university = Array.isArray(result.data.universities) ? result.data.universities[0] : result.data.universities;
  return {
    programId: result.data.id,
    universityName: university?.canonical_name ?? "",
    programName: result.data.canonical_name,
    degreeType: result.data.canonical_name.match(/\b(?:MSc|MA|MBA|MRes|LLM|BSc|BA|PhD)\b/i)?.[0] ?? "",
    intakeYear: result.data.intake_year,
    officialDomains: [new URL(officialProgramUrl).hostname],
    registeredUrls: [officialProgramUrl],
  };
}


export async function markProgramSourcesPublished(programId: string) {
  const client = adminClient();
  if (!client) return;
  const sources = await client.from("program_sources").select("id,content_hash").eq("program_id", programId).eq("status", "active");
  if (sources.error) throw sources.error;
  for (const source of sources.data ?? []) {
    if (!source.content_hash) continue;
    const result = await client.from("program_sources")
      .update({ verified_content_hash: source.content_hash })
      .eq("id", source.id);
    if (result.error) throw result.error;
  }
}
