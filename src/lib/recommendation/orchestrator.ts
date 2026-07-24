Exit code: 0
Wall time: 1.1 seconds
Output:
import type { SchoolRecommendation } from "../application-prototype-data";
import type { StudentProfile } from "../student-profile";
import { expandField, relationAllowed } from "./field-expansion";
import { assessEligibility, validateProgrammeForDisplay } from "./eligibility";
import { classifyProgrammeLead, OfficialWebDiscoveryProvider, type ProgrammeDiscoveryProvider } from "./programme-discovery";
import { understandProfile } from "./profile-understanding";
import { verifyProgrammeLead } from "./official-verification";
import type { OrchestratorEvent, OrchestratorResult, ProgrammeLead, RejectedProgrammeLead } from "./types";
import { retrieveCachedVerifiedProgrammes, searchCachedOfficialDiscoveries } from "./programme-repository";
import { buildApplicantProfile, normalizeOpenAIError, OpenAIRecommendationProvider, RECOMMENDATION_MODEL, RECOMMENDATION_PROMPT_VERSION, type AIProgramRecommendation, type AIRecommendationProvider } from "./ai-recommendation";

const event = (stage: OrchestratorEvent["stage"], label: string, status: OrchestratorEvent["status"], detail?: string): OrchestratorEvent => ({ stage, label, status, detail });
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

async function verifyLeads(leads: ProgrammeLead[], profile: ReturnType<typeof understandProfile>, reviewQueue: RejectedProgrammeLead[], limit = 12) {
  const outcomes = [];
  const boundedLeads = leads.slice(0, limit);
  for (let index = 0; index < boundedLeads.length; index += 4) {
    const batch = await Promise.all(boundedLeads.slice(index, index + 4).map(async (lead) => {
      try { return await verifyProgrammeLead(lead, profile); }
      catch { return { programme: null, rejection: { lead, reasons: ["PROGRAMME_NOT_VERIFIED" as const] } }; }
    }));
    outcomes.push(...batch);
  }
  for (const outcome of outcomes) if (outcome.rejection) reviewQueue.push(outcome.rejection);
  return outcomes.flatMap(outcome => outcome.programme ? [outcome.programme] : []);
}

export async function orchestrateRecommendations(input: { profile: StudentProfile; internalProgrammes?: SchoolRecommendation[]; plannedApplicationCount?: number; discoveryProvider?: ProgrammeDiscoveryProvider; aiProvider?: AIRecommendationProvider }): Promise<OrchestratorResult> {
  const orchestrationStartedAt = Date.now();
  const events: OrchestratorEvent[] = []; const reviewQueue: RejectedProgrammeLead[] = []; const profile = understandProfile(input.profile, input.plannedApplicationCount);
  events.push(event("profile_understanding", "已理解学生背景", "completed", profile.educationCountry === "英国" ? "英国本科按国际/英国学历规则评估，不使用中国院校规则。" : undefined));
  const expansions = expandField(profile.targetField); events.push(event("field_expansion", "已完成专业语义扩展", "completed", `${expansions.length} 个多语言检索词`));
  const cachedVerified = retrieveCachedVerifiedProgrammes(profile, expansions);
  const applicantProfile = buildApplicantProfile(input.profile, profile); const aiProvider = input.aiProvider ?? new OpenAIRecommendationProvider();
  events.push(event("programme_discovery", "Atlas 正在生成候选选校方案", "running"));
  let aiRecommendations: AIProgramRecommendation[] = []; let aiErrorCode: string | undefined;
  try { aiRecommendations = await aiProvider.generate(applicantProfile); }
  catch (error) { aiErrorCode = normalizeOpenAIError(error).code; events.push(event("programme_discovery", "AI 探索候选暂不可用", "completed", "已核验结果仍会正常返回")); }
  aiRecommendations = aiRecommendations.map((item) => ({ ...item, country: normalizeRecommendationCountry(item.country) }));
  const allowedAI = aiRecommendations.filter(item => profile.targetCountries.includes(item.country) && item.degreeLevel === profile.targetDegreeLevel && item.schoolName.trim() && item.programName.trim());
  const seenAI = new Set<string>();
  const aiVerificationLeads: ProgrammeLead[] = [];
  for (const item of allowedAI) {
    const key = `${item.schoolName}|${item.programName}|${item.country}|${item.degreeLevel}`.toLowerCase();
    const lead: ProgrammeLead = {
      url: item.possibleOfficialUrl ?? `https://atlas.invalid/pending/${encodeURIComponent(key)}`,
      searchTitle: `${item.schoolName} — ${item.programName}`,
      snippet: item.recommendationReasons.join("；") || null,
      entityType: "unknown",
      fieldRelation: "highly_related",
      discoveryQuery: item.verificationQueries.join(" | "),
      discoveredAt: new Date().toISOString(),
    };
    if (seenAI.has(key)) {
      reviewQueue.push({ lead, reasons: ["DUPLICATE_RESULT"] });
    } else if (item.possibleOfficialUrl && classifyProgrammeLead({ title: lead.searchTitle, url: item.possibleOfficialUrl }) === "official_programme") {
      // Level C output remains hidden, but a plausible official programme URL
      // is now passed into the same strict Level B verifier as web discoveries.
      aiVerificationLeads.push({ ...lead, entityType: "official_programme" });
    } else {
      reviewQueue.push({ lead, reasons: ["PROGRAMME_NOT_VERIFIED"] });
    }
    seenAI.add(key);
  }
  // Level C AI output is discovery input only. It must never become a user-facing
  // recommendation until the institution, programme and official page are verified.
  events.push(event("programme_discovery", "Atlas 候选线索已生成", "completed", `${allowedAI.length} 条线索已进入后台核验`));
  const initialCandidates = (input.internalProgrammes ?? []).length + 5;
  const afterCountryFilter = (input.internalProgrammes ?? []).filter(programme => profile.targetCountries.includes(programme.country)).length + retrieveCachedVerifiedProgrammes(profile, expansions).length;
  const internal = [...(input.internalProgrammes ?? []).filter(programme => profile.targetCountries.includes(programme.country)).map(internalLead).filter((lead): lead is ProgrammeLead => Boolean(lead)), ...searchCachedOfficialDiscoveries(profile, expansions)];
  events.push(event("internal_search", "已检索内部数据库", "completed", `${internal.length} 条项目线索`));
  const niche = expansions.length >= 8; const coverageLow = cachedVerified.length / Math.max(profile.plannedApplicationCount, 1) < .75; const trigger = cachedVerified.length < profile.plannedApplicationCount && (coverageLow || niche);
  const provider = input.discoveryProvider ?? new OfficialWebDiscoveryProvider(); let discovered: ProgrammeLead[] = []; let passes = 0;
  if (trigger) { events.push(event("programme_discovery", "正在检索相关项目", "running")); discovered = await provider.discover(profile, expansions, Math.min(Math.max(profile.plannedApplicationCount * 2, 12), 24)); passes++; events.push(event("programme_discovery", "已完成项目线索发现", "completed", `${discovered.length} 条线索；尚未面向用户展示`)); }
  let leads = deduplicate([...internal, ...aiVerificationLeads, ...discovered].filter(lead => relationAllowed(lead.fieldRelation, profile.crossDisciplinePreference)), reviewQueue);
  events.push(event("entity_verification", "正在验证学校与项目实体", "running")); let verified = [...cachedVerified, ...await verifyLeads(leads.filter(lead => !cachedVerified.some(item => item.officialProgrammeUrl.replace(/\/$/, "") === lead.url.replace(/\/$/, ""))), profile, reviewQueue)]; events.push(event("official_verification", "已完成官方来源核验", "completed", `${verified.length} 个项目通过严格验证（含 ${cachedVerified.length} 个数据库记录），${reviewQueue.length} 条线索进入后台复核`));
  let candidates = verified.map(programme => assessEligibility(profile, programme)).filter(candidate => validateProgrammeForDisplay(candidate, profile));
  if (candidates.length < profile.plannedApplicationCount && passes < 1 && Date.now() - orchestrationStartedAt < 55_000) {
    events.push(event("supervisor", "Supervisor 要求扩大官方检索", "running", "严格过滤后项目数量不足，绝不使用文章或商城页面补位"));
    const more = await provider.discover(profile, expansions, Math.min(Math.max(profile.plannedApplicationCount * 2, 12), 24)); passes++; leads = deduplicate([...leads, ...more].filter(lead => relationAllowed(lead.fieldRelation, profile.crossDisciplinePreference)), reviewQueue); verified = [...cachedVerified, ...await verifyLeads(leads.filter(lead => !cachedVerified.some(item => item.officialProgrammeUrl.replace(/\/$/, "") === lead.url.replace(/\/$/, ""))), profile, reviewQueue, 8)]; candidates = verified.map(programme => assessEligibility(profile, programme)).filter(candidate => validateProgrammeForDisplay(candidate, profile));
  }
  const finalSeen = new Set<string>(); candidates = candidates.filter(candidate => { const key = `${candidate.institutionName}|${candidate.programmeName}|${candidate.country}|${candidate.degreeLevel}`.toLowerCase(); if (finalSeen.has(key)) { reviewQueue.push({ lead: { url: candidate.officialProgrammeUrl, searchTitle: candidate.programmeName, snippet: null, entityType: "official_programme", fieldRelation: candidate.fieldRelation, discoveryQuery: "supervisor deduplication", discoveredAt: new Date().toISOString() }, reasons: ["DUPLICATE_RESULT"] }); return false; } finalSeen.add(key); return true; });
  candidates.sort((a, b) => a.recommendationBand === "currently_not_suitable" ? 1 : b.recommendationBand === "currently_not_suitable" ? -1 : b.score - a.score);
  const issues: string[] = []; if (candidates.length < profile.plannedApplicationCount) issues.push("当前已核验项目不足，Atlas 正在继续检索官方项目"); if (!profile.targetDegreeLevel) issues.push("目标学历层级待确认"); if (candidates.some(candidate => !profile.targetCountries.includes(candidate.country))) issues.push("存在目标国家外项目"); if (candidates.some(candidate => !validateProgrammeForDisplay(candidate, profile))) issues.push("存在未通过展示验证的结果");
  const verifiedCount = candidates.filter(candidate => candidate.verificationStatus === "verified").length;
  const pendingCount = candidates.filter(candidate => candidate.verificationStatus === "pending").length;
  events.push(event("ranking", "推荐排序已完成", "completed", `${verifiedCount} 个已核验项目，${pendingCount} 个探索性候选`)); events.push(event("supervisor", "Supervisor 已完成结果检查", "completed", issues[0])); events.push(event("complete", pendingCount ? "部分结果仍在核验" : "推荐流程完成", "completed"));
  const atlasNames = new Set(cachedVerified.map(item => `${item.institutionName}|${item.programmeName}`.toLowerCase())); const atlasSchools = new Set(cachedVerified.map(item => item.institutionName.toLowerCase()));
  const debug = { initialCandidates, afterCountryFilter, afterDegreeFilter: cachedVerified.length, afterSubjectMatch: verified.length, afterEligibilityCheck: candidates.length, afterValidation: candidates.length, openAIRequestStarted:true, model:RECOMMENDATION_MODEL,promptVersion:RECOMMENDATION_PROMPT_VERSION,aiCandidatesReturned:aiRecommendations.length,atlasSchoolMatches:aiRecommendations.filter(item=>atlasSchools.has(item.schoolName.toLowerCase())).length,atlasProgramMatches:aiRecommendations.filter(item=>atlasNames.has(`${item.schoolName}|${item.programName}`.toLowerCase())).length,pendingVerification:allowedAI.length,verifiedRecommendations:candidates.length,excluded:aiRecommendations.length-allowedAI.length };
  const generationStatus = candidates.length === 0 ? "empty" : aiErrorCode || candidates.length < profile.plannedApplicationCount ? "partial" : "complete";
  const emptyReason = candidates.length ? undefined : aiErrorCode && cachedVerified.length === 0 ? "AI 推荐暂时不可用，且当前已核验数据库尚未覆盖这一国家、学历层级与专业组合。请稍后重试。" : cachedVerified.length === 0 ? "当前数据库中没有覆盖该国家、学位层级和专业方向组合的已核验项目。" : "候选项目未通过官方来源与展示校验。";
  return { profile, expansions, candidates, reviewQueue, fallbackLevel: candidates.length >= profile.plannedApplicationCount ? 1 : candidates.length ? 4 : 5, generationStatus, aiStatus: aiErrorCode ? "unavailable" : "completed", aiErrorCode, emptyReason, debug, events, supervisor: { sufficient: candidates.length >= profile.plannedApplicationCount, issues, discoveryPasses: passes } };
}

