import "server-only";
import { ingestProgramContent, type IngestionDependencies } from "./pipeline";
import { claimNextProgramIngestionJob, createKnowledgeReview, getProgramDiscoveryInput, updateIngestionJob } from "./repository";

export async function processNextProgramIngestionJob(dependencies: IngestionDependencies) {
  const job = await claimNextProgramIngestionJob();
  if (!job) return { processed: false as const };

  const input = await getProgramDiscoveryInput(job.programId);
  if (!input || !input.universityName || !input.registeredUrls?.length) {
    await createKnowledgeReview(job.programId, "专业缺少可验证的学校或官方页面配置", {});
    await updateIngestionJob(job.id, "needs_review", "Missing program discovery metadata");
    return { processed: true as const, status: "manual_review" as const };
  }

  const result = await ingestProgramContent(job.id, input, dependencies);
  return { processed: true as const, ...result };
}
