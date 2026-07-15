import "server-only";
import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { PrivateAdmissionImportRepository } from "./types";

function adminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Private admission database is not configured");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function createPrivateAdmissionImportRepository(): PrivateAdmissionImportRepository {
  const client = adminClient();
  return {
    async begin(input) {
      const sourceNameHash = createHash("sha256").update(input.sourceName).digest("hex");
      const result = await client.from("private_admission_import_jobs").insert({
        source_name_hash: sourceNameHash,
        source_hash: input.sourceHash,
        sheet_count: input.sheetCount,
        status: "running",
      }).select("id").single();
      if (result.error) throw result.error;
      return result.data.id;
    },
    async saveRules(importJobId, rules) {
      if (!rules.length) return;
      const result = await client.from("private_institution_admission_rules").insert(rules.map((rule) => ({
        import_job_id: importJobId,
        target_university_id: rule.targetUniversityId,
        faculty_name: rule.facultyName ?? null,
        program_id: rule.programId ?? null,
        rule_type: rule.ruleType,
        accepted_institution_id: rule.acceptedInstitutionId ?? null,
        institution_tier: rule.institutionTier ?? null,
        required_average: rule.requiredAverage ?? null,
        required_average_max: rule.requiredAverageMax ?? null,
        source_year: rule.sourceYear ?? null,
        verification_status: rule.verificationStatus,
        confidential: true,
        encrypted_source_reference: rule.encryptedSourceReference,
      })));
      if (result.error) throw result.error;
    },
    async saveIssues(importJobId, issues) {
      if (!issues.length) return;
      const result = await client.from("private_admission_import_issues").insert(issues.map((issue) => ({
        import_job_id: importJobId,
        sheet_name_hash: createHash("sha256").update(issue.sheetName).digest("hex"),
        row_number: issue.row ?? null,
        issue_code: issue.code,
        summary: issue.summary,
        evidence_fingerprint: issue.evidenceFingerprint ?? null,
      })));
      if (result.error) throw result.error;
    },
    async complete(importJobId, result) {
      const update = await client.from("private_admission_import_jobs").update({
        status: result.reviewIssues ? "needs_review" : "completed",
        imported_rule_count: result.importedRules,
        review_issue_count: result.reviewIssues,
        skipped_sheet_count: result.skippedSheets,
        completed_at: new Date().toISOString(),
      }).eq("id", importJobId);
      if (update.error) throw update.error;
    },
    async fail(importJobId, message) {
      await client.from("private_admission_import_jobs").update({
        status: "failed",
        last_error: message.slice(0, 1000),
        completed_at: new Date().toISOString(),
      }).eq("id", importJobId);
    },
  };
}
