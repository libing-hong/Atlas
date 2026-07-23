import type { SchoolRecommendation } from "../application-prototype-data";
import type { StudentProfile } from "../student-profile";
import { expandField, relationAllowed } from "./field-expansion";
import { assessEligibility, validateProgrammeForDisplay } from "./eligibility";
import { OfficialWebDiscoveryProvider, type ProgrammeDiscoveryProvider } from "./programme-discovery";
import { understandProfile } from "./profile-understanding";
import { verifyProgrammeLead } from "./official-verification";
import type { OrchestratorEvent, OrchestratorResult, ProgrammeLead, RejectedProgrammeLead } from "./types";
import { retrieveCachedVerifiedProgrammes, searchCachedOfficialDiscoveries } from "./programme-repository";
import { aiRecommendationToCandidate, buildApplicantProfile, OpenAIRecommendationProvider, RECOMMENDATION_MODEL, RECOMMENDATION_PROMPT_VERSION, type AIRecommendationProvider } from "./ai-recommendation";

const event = (stage: OrchestratorEvent["stage"], label: string, status: OrchestratorEvent["status"], detail?: string): OrchestratorEvent => ({ stage, label, status, detail });

const DEFAULT_RECOMMENDATION_BUDGET_MS = 82_000;
const MIN_STAGE_RESERVE_MS = 6_000;
const remainingMs = (deadlineAt: number) => Math.max(0, deadlineAt - Date.now());

async function withinBudget<T>(
  label: string,
  operation: () => Promise<T>,
  deadlineAt: number,
  stageLimitMs: number,
  fallback: T,
): Promise<T> {
  const timeoutMs = Math.min(stageLimitMs, remainingMs(deadlineAt) - MIN_STAGE_RESERVE_MS);
  if (timeoutMs <= 0) {
    console.warn("[recommendation-budget]", { stage: label, outcome: "skipped", remainingMs: remainingMs(deadlineAt) });
    return fallback;
  }
  return new Promise<T>((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      console.warn("[recommendation-budget]", { stage: label, outcome: "timed_out", timeoutMs, remainingMs: remainingMs(deadlineAt) });
      resolve(fallback);
    }, timeoutMs);
    operation().then(
      (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        console.info("[recommendation-budget]", { stage: label, outcome: "completed", remainingMs: remainingMs(deadlineAt) });
        resolve(value);
      },
      (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        console.warn("[recommendation-budget]", { stage: label, outcome: "failed", error: error instanceof Error ? error.message : String(error), remainingMs: remainingMs(deadlineAt) });
        resolve(fallback);
      },
    );
  });
}
export function normalizeRecommendationCountry(country: string) {
  const normalized = country.trim().toLowerCase().replaceAll(".", "");
  const aliases: Record<string, string> = {
    france: "法国", french: "法国", 法国: "法国",
    "united kingdom": "英国", uk: "英国", england: "英国", scotland: "英国", wales: "英国", "great britain": "英国", 英国: "英国",
    australia: "澳洲", australian: "澳洲", 澳洲: "澳洲", 澳大利亚: "澳洲",
    spain: "西班牙", spanish: "西班牙", 西班牙: "西班牙",
    "united states": "美国", usa: "美国", us: "美国", america: "美国", 美国: "美国",
  };
  return aliases[normalized] ?? country.trim();
}
const internalLead = (programme: SchoolRecommendation): ProgrammeLead | null => programme.officialProgramUrl ? { url: programme.officialProgramUrl, searchTitle: programme.programName, snippet: null, entityType: "official_programme", fieldRelation: "adjacent", discoveryQuery: "internal verified database", discoveredAt: new Date().toISOString() } : null;

function deduplicate(leads: ProgrammeLead[], reviewQueue: RejectedProgrammeLead[]) {
  const seen = new Set<string>(); const unique: ProgrammeLead[] = [];
  for (const lead of leads) { const key = lead.url.replace(/\/$/, "").toLowerCase(); if (seen.has(key)) reviewQueue.push({ lead, reasons: ["DUPLICATE_RESULT"] }); else { seen.add(key); unique.push(lead); } }
  return unique;
}

async function verifyLeads(
  leads: ProgrammeLead[],
  profile: ReturnType<typeof understandProfile>,
  reviewQueue: RejectedProgrammeLead[],
  deadlineAt: number,
  maxLeads = 12,
) {
  const selected = leads.slice(0, maxLeads);
  const outcomes: Awaited<ReturnType<typeof verifyProgrammeLead>>[] = [];
  for (let index = 0; index < selected.length && remainingMs(deadlineAt) > MIN_STAGE_RESERVE_MS; index += 4) {
    const batch = selected.slice(index, index + 4);
    const verified = await Promise.all(batch.map((lead) =>
      withinBudget("official_verification", () => verifyProgrammeLead(lead, profile), deadlineAt, 7_000, null),
    ));
    outcomes.push(...verified.filter((outcome): outcome is Awaited<ReturnType<typeof verifyProgrammeLead>> => outcome !== null));
  }
  for (const outcome of outcomes) if (outcome.rejection) reviewQueue.push(outcome.rejection);
  return outcomes.flatMap(outcome => outcome.programme ? [outcome.programme] : []);
}

const provisionalField = <T>(value: T | null, url: string): VerifiedField<T> => ({
  value,
  sourceUrl: url,
  retrievedAt: new Date().toISOString(),
  verificationStatus: value === null ? "pending" : "partially_verified",
});

function provisionalProgrammeFromLead(lead: ProgrammeLead, profile: ReturnType<typeof understandProfile>): VerifiedProgramme | null {
  if (lead.entityType !== "official_programme" || !profile.targetDegreeLevel) return null;
  let parsed: URL;
  try { parsed = new URL(lead.url); } catch { return null; }
  const host = parsed.hostname.toLowerCase();
  const query = `${lead.discoveryQuery} ${lead.searchTitle}`.toLowerCase();
  const country = host.endsWith(".ac.uk") || query.includes("united kingdom") || query.includes(" uk ")
    ? "英国"
    : host.endsWith(".fr") || query.includes("france")
      ? "法国"
      : host.endsWith(".edu.au") || query.includes("australia")
        ? "澳洲"
        : profile.targetCountries.length === 1 ? profile.targetCountries[0] : null;
  if (!country || !profile.targetCountries.includes(country)) return null;
  const parts = lead.searchTitle.split(/\s+[|–—]\s+/).map((part) => part.trim()).filter(Boolean);
  const programmeName = parts.find((part) => /master|msc|ma\b|llm|mba|bachelor|phd|international|business|management/i.test(part)) ?? parts[0];
  const institutionName = parts.find((part) => /university|universit[eé]|school|college|école|institute/i.test(part))
    ?? parsed.hostname.replace(/^www\./, "").split(".")[0].replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  if (!programmeName || !institutionName) return null;
  return {
    institutionName,
    programmeName,
    country,
    officialProgrammeUrl: lead.url,
    officialRootDomain: parsed.hostname.replace(/^www\./, ""),
    degreeType: profile.targetDegreeLevel,
    degreeLevel: profile.targetDegreeLevel,
    campus: provisionalField<string>(null, lead.url),
    fieldRelation: lead.fieldRelation,
    sourceType: "official",
    active: provisionalField(true, lead.url),
    intake: provisionalField<string>(null, lead.url),
    teachingLanguage: provisionalField<string>(null, lead.url),
    degreeRequirement: provisionalField<string>(null, lead.url),
    subjectRequirement: provisionalField<string>(null, lead.url),
    gradeRequirement: provisionalField<string>(null, lead.url),
    languageRequirement: provisionalField<string>(null, lead.url),
    tuition: provisionalField<number>(null, lead.url),
    tuitionCurrency: provisionalField<string>(null, lead.url),
    deadline: provisionalField<string>(null, lead.url),
    applicationUrl: provisionalField<string>(null, lead.url),
    discoveryQuery: lead.discoveryQuery,
    discoveredAt: lead.discoveredAt,
  };
}

export async function orchestrateRecommendations(input: { profile: StudentProfile; internalProgrammes?: SchoolRecommendation[]; plannedApplicationCount?: number; discoveryProvider?: ProgrammeDiscoveryProvider; aiProvider?: AIRecommendationProvider; budgetMs?: number }): Promise<OrchestratorResult> {
  const startedAt = Date.now();
  const deadlineAt = startedAt + Math.min(input.budgetMs ?? DEFAULT_RECOMMENDATION_BUDGET_MS, DEFAULT_RECOMMENDATION_BUDGET_MS);
  const events: OrchestratorEvent[] = []; const reviewQueue: RejectedProgrammeLead[] = []; const profile = understandProfile(input.profile, input.plannedApplicationCount);
  console.info("[recommendation-stage]", { stage: "start", budgetMs: deadlineAt - startedAt, plannedApplicationCount: profile.plannedApplicationCount });
  events.push(event("profile_understanding", "已理解学生背景", "completed", profile.educationCountry === "英国" ? "英国本科按国际/英国学历规则评估，不使用中国院校规则。" : undefined));
  const expansions = expandField(profile.targetField); events.push(event("field_expansion", "已完成专业语义扩展", "completed", `${expansions.length} 个多语言检索词`));
  const applicantProfile = buildApplicantProfile(input.profile, profile); const aiProvider = input.aiProvider ?? new OpenAIRecommendationProvider();
  events.push(event("programme_discovery", "Atlas 正在生成候选选校方案", "running"));
  let aiRecommendations = await withinBudget("ai_generation_primary", () => aiProvider.generate(applicantProfile), deadlineAt, 28_000, []);
  if (!aiRecommendations.length && remainingMs(deadlineAt) > 42_000) {
    aiRecommendations = await withinBudget("ai_generation_retry", () => aiProvider.generate(applicantProfile, true), deadlineAt, 12_000, []);
  }
  aiRecommendations = aiRecommendations.map((item) => ({ ...item, country: normalizeRecommendationCountry(item.country) }));
  const allowedAI = aiRecommendations.filter(item => profile.targetCountries.includes(item.country) && item.degreeLevel === profile.targetDegreeLevel && item.schoolName.trim() && item.programName.trim());
  const aiCandidates = allowedAI.map(aiRecommendationToCandidate);
  events.push(event("programme_discovery", "Atlas 候选方案已生成", "completed", `${aiCandidates.length} 个具体学校专业项目`));
  const initialCandidates = (input.internalProgrammes ?? []).length + 5;
  const afterCountryFilter = (input.internalProgrammes ?? []).filter(programme => profile.targetCountries.includes(programme.country)).length + retrieveCachedVerifiedProgrammes(profile, expansions).length;
  const cachedVerified = retrieveCachedVerifiedProgrammes(profile, expansions);
  const internal = [...(input.internalProgrammes ?? []).filter(programme => profile.targetCountries.includes(programme.country)).map(internalLead).filter((lead): lead is ProgrammeLead => Boolean(lead)), ...searchCachedOfficialDiscoveries(profile, expansions)];
  events.push(event("internal_search", "已检索内部数据库", "completed", `${internal.length} 条项目线索`));
  const niche = expansions.length >= 8; const coverageLow = internal.length / Math.max(profile.plannedApplicationCount, 1) < .75; const trigger = aiCandidates.length === 0 && (internal.length < profile.plannedApplicationCount || coverageLow || (niche && internal.length === 0));
  const provider = input.discoveryProvider ?? new OfficialWebDiscoveryProvider(); let discovered: ProgrammeLead[] = []; let passes = 0;
  if (trigger && remainingMs(deadlineAt) > 20_000) {
    events.push(event("programme_discovery", "正在检索相关项目", "running"));
    discovered = await withinBudget("official_discovery_primary", () => provider.discover(profile, expansions, Math.min(Math.max(profile.plannedApplicationCount * 2, 12), 20)), deadlineAt, 12_000, []);
    passes++;
    events.push(event("programme_discovery", "已完成项目线索发现", "completed", `${discovered.length} 条线索；尚未面向用户展示`));
  }
  let leads = deduplicate([...internal, ...discovered].filter(lead => relationAllowed(lead.fieldRelation, profile.crossDisciplinePreference)), reviewQueue);
  events.push(event("entity_verification", "正在验证学校与项目实体", "running")); let verified = [...cachedVerified, ...await verifyLeads(leads.filter(lead => !cachedVerified.some(item => item.officialProgrammeUrl.replace(/\/$/, "") === lead.url.replace(/\/$/, ""))), profile, reviewQueue, deadlineAt)]; events.push(event("official_verification", "已完成官方来源核验", "completed", `${verified.length} 个项目通过严格验证（含 ${cachedVerified.length} 个数据库记录），${reviewQueue.length} 条线索进入后台复核`));
  let candidates = [...verified.map(programme => assessEligibility(profile, programme)), ...aiCandidates].filter(candidate => validateProgrammeForDisplay(candidate, profile));
  if (!candidates.length) {
    const provisional = deduplicate([...internal, ...discovered], reviewQueue)
      .map((lead) => provisionalProgrammeFromLead(lead, profile))
      .filter((programme): programme is VerifiedProgramme => programme !== null)
      .slice(0, profile.plannedApplicationCount)
      .map((programme) => assessEligibility(profile, programme))
      .filter((candidate) => validateProgrammeForDisplay(candidate, profile));
    if (provisional.length) {
      candidates = provisional;
      events.push(event("supervisor", "已返回待进一步核验的官方项目", "completed", `${provisional.length} 个项目`));
    }
  }
  if (aiCandidates.length === 0 && candidates.length < profile.plannedApplicationCount && passes < 2 && remainingMs(deadlineAt) > 24_000) {
    events.push(event("supervisor", "Supervisor 要求扩大官方检索", "running", "严格过滤后项目数量不足，绝不使用文章或商城页面补位"));
    const more = await withinBudget("official_discovery_secondary", () => provider.discover(profile, expansions, Math.min(Math.max(profile.plannedApplicationCount * 2, 12), 18)), deadlineAt, 8_000, []); passes++; leads = deduplicate([...leads, ...more].filter(lead => relationAllowed(lead.fieldRelation, profile.crossDisciplinePreference)), reviewQueue); verified = [...cachedVerified, ...await verifyLeads(leads.filter(lead => !cachedVerified.some(item => item.officialProgrammeUrl.replace(/\/$/, "") === lead.url.replace(/\/$/, ""))), profile, reviewQueue, deadlineAt, 8)]; candidates = [...verified.map(programme => assessEligibility(profile, programme)), ...aiCandidates].filter(candidate => validateProgrammeForDisplay(candidate, profile));
  }
  const finalSeen = new Set<string>(); candidates = candidates.filter(candidate => { const key = `${candidate.institutionName}|${candidate.programmeName}|${candidate.country}|${candidate.degreeLevel}`.toLowerCase(); if (finalSeen.has(key)) { reviewQueue.push({ lead: { url: candidate.officialProgrammeUrl, searchTitle: candidate.programmeName, snippet: null, entityType: "official_programme", fieldRelation: candidate.fieldRelation, discoveryQuery: "supervisor deduplication", discoveredAt: new Date().toISOString() }, reasons: ["DUPLICATE_RESULT"] }); return false; } finalSeen.add(key); return true; });
  candidates.sort((a, b) => a.recommendationBand === "currently_not_suitable" ? 1 : b.recommendationBand === "currently_not_suitable" ? -1 : b.score - a.score);
  const issues: string[] = []; if (candidates.length < profile.plannedApplicationCount) issues.push("当前已核验项目不足，Atlas 正在继续检索官方项目"); if (!profile.targetDegreeLevel) issues.push("目标学历层级待确认"); if (candidates.some(candidate => !profile.targetCountries.includes(candidate.country))) issues.push("存在目标国家外项目"); if (candidates.some(candidate => !validateProgrammeForDisplay(candidate, profile))) issues.push("存在未通过展示验证的结果");
  events.push(event("ranking", "已完成核验的推荐", "completed", `${candidates.length} 个项目`)); events.push(event("supervisor", "Supervisor 已完成结果检查", "completed", issues[0])); events.push(event("complete", "推荐流程完成", "completed"));
  const atlasNames = new Set(cachedVerified.map(item => `${item.institutionName}|${item.programmeName}`.toLowerCase())); const atlasSchools = new Set(cachedVerified.map(item => item.institutionName.toLowerCase()));
  const debug = { initialCandidates, afterCountryFilter, afterDegreeFilter: cachedVerified.length, afterSubjectMatch: verified.length, afterEligibilityCheck: candidates.length, afterValidation: candidates.length, openAIRequestStarted:true, model:RECOMMENDATION_MODEL,promptVersion:RECOMMENDATION_PROMPT_VERSION,aiCandidatesReturned:aiRecommendations.length,atlasSchoolMatches:aiRecommendations.filter(item=>atlasSchools.has(item.schoolName.toLowerCase())).length,atlasProgramMatches:aiRecommendations.filter(item=>atlasNames.has(`${item.schoolName}|${item.programName}`.toLowerCase())).length,pendingVerification:candidates.filter(item=>item.generatedByAI).length,verifiedRecommendations:candidates.filter(item=>!item.generatedByAI).length,excluded:aiRecommendations.length-allowedAI.length };
  const emptyReason = candidates.length ? undefined : cachedVerified.length === 0 ? "当前数据库中没有覆盖该国家、学位层级和专业方向组合的已核验项目。" : "候选项目未通过官方来源与展示校验。";
  console.info("[recommendation-stage]", { stage: "complete", durationMs: Date.now() - startedAt, remainingMs: remainingMs(deadlineAt), candidateCount: candidates.length, discoveryPasses: passes });
  return { profile, expansions, candidates, reviewQueue, fallbackLevel: candidates.length >= profile.plannedApplicationCount ? 1 : candidates.length ? 4 : 5, emptyReason, debug, events, supervisor: { sufficient: candidates.length >= profile.plannedApplicationCount, issues, discoveryPasses: passes } };
}

