import OpenAI from "openai";
import type { StudentProfile } from "../student-profile";
import type { ProgrammeCandidate, UnderstoodProfile, VerifiedField, VerifiedProgramme } from "./types";

export const RECOMMENDATION_PROMPT_VERSION = "atlas-school-plan-v2";
export const RECOMMENDATION_MODEL = process.env.OPENAI_RECOMMENDATION_MODEL ?? "gpt-4.1-mini";

export type ApplicantProfile = {
  currentDegree?: string; currentInstitution?: string; institutionCountry?: string; currentMajor?: string;
  gradeOriginal?: string; gradeNormalized?: number; graduationDate?: string;
  workExperience: { company?: string; role?: string; durationMonths?: number; description?: string }[];
  languageScores: { type: string; overall?: number; subscores?: Record<string, number> }[];
  targetDegree: string; targetCountries: string[]; targetSubjects: string[]; targetIntake?: string;
  budget?: { amount: number; currency: string; period: "per_year" }; preferredCities: string[]; missingInformation: string[];
};

export type AIProgramRecommendation = {
  schoolName: string; schoolNameLocal: string | null; programName: string; programNameLocal: string | null;
  country: string; city: string | null; degreeLevel: "bachelor" | "master" | "doctorate"; subjectArea: string;
  category: "reach" | "target" | "safer" | "exploratory"; estimatedFitScore: number;
  recommendationReasons: string[]; applicantStrengths: string[]; admissionConcerns: string[];
  admissionRequirements: Array<{ category: "degree" | "grade" | "subject" | "language" | "experience" | "prerequisite" | "portfolio"; requirement: string | null; applicantAssessment: string; status: "meets" | "mostly_meets" | "needs_confirmation" | "gap_detected" | "unknown"; sourceUrl: string | null }>;
  missingRequirements: string[]; verificationQueries: string[]; expectedOfficialDomain: string | null;
  possibleOfficialUrl: string | null; confidence: number;
};

export type AIRecommendationProvider = { generate(profile: ApplicantProfile, relaxed?: boolean): Promise<AIProgramRecommendation[]> };
export type SchoolRecommendationErrorCode = "OPENAI_API_KEY_MISSING" | "OPENAI_AUTHENTICATION_FAILED" | "OPENAI_INSUFFICIENT_QUOTA" | "OPENAI_RATE_LIMITED" | "OPENAI_PERMISSION_DENIED" | "OPENAI_TIMEOUT" | "OPENAI_INVALID_RESPONSE" | "OPENAI_REQUEST_FAILED";

export class SchoolRecommendationError extends Error {
  constructor(public readonly code: SchoolRecommendationErrorCode) { super(code); this.name = "SchoolRecommendationError"; }
}

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new SchoolRecommendationError("OPENAI_API_KEY_MISSING");
  return new OpenAI({ apiKey, timeout: 45_000, maxRetries: 0 });
}

export function normalizeOpenAIError(error: unknown): SchoolRecommendationError {
  if (error instanceof SchoolRecommendationError) return error;
  const value = error as { status?: number; code?: string };
  if (value?.code === "insufficient_quota") return new SchoolRecommendationError("OPENAI_INSUFFICIENT_QUOTA");
  if (value?.status === 401) return new SchoolRecommendationError("OPENAI_AUTHENTICATION_FAILED");
  if (value?.status === 403) return new SchoolRecommendationError("OPENAI_PERMISSION_DENIED");
  if (value?.status === 429) return new SchoolRecommendationError("OPENAI_RATE_LIMITED");
  if ((error as { name?: string })?.name === "APIConnectionTimeoutError" || value?.code === "ETIMEDOUT") return new SchoolRecommendationError("OPENAI_TIMEOUT");
  return new SchoolRecommendationError("OPENAI_REQUEST_FAILED");
}

export function buildApplicantProfile(raw: StudentProfile, profile: UnderstoodProfile): ApplicantProfile {
  const education = raw.educationHistory[0];
  const grade = education?.officialAverage ?? education?.weightedAverage ?? education?.arithmeticAverage ?? education?.gpa ?? undefined;
  const missingInformation = [!education?.institutionNameEn && !education?.institutionNameZh && "currentInstitution", !education?.major && "currentMajor", !raw.languageTests.length && "languageScores"].filter((value): value is string => Boolean(value));
  return {
    currentDegree: education?.degreeName ?? education?.degreeLevel ?? undefined,
    currentInstitution: education?.institutionNameEn ?? education?.institutionNameZh ?? undefined,
    institutionCountry: education?.country ?? undefined, currentMajor: education?.major ?? undefined,
    gradeOriginal: grade === undefined ? undefined : `${grade}${education?.gradingSystem ? ` (${education.gradingSystem})` : ""}`,
    gradeNormalized: grade, graduationDate: education?.graduationYear ? `${education.graduationYear}-${String(education.graduationMonth ?? 6).padStart(2, "0")}` : undefined,
    workExperience: [...raw.workExperiences, ...raw.internships].map(item => ({ role: item.role, durationMonths: item.months, description: item.description })),
    languageScores: raw.languageTests.map(test => ({ type: test.type, overall: test.overall ?? undefined, subscores: Object.fromEntries(Object.entries({ listening: test.listening, reading: test.reading, writing: test.writing, speaking: test.speaking }).filter((entry): entry is [string, number] => typeof entry[1] === "number")) })),
    targetDegree: profile.targetDegreeLevel ?? "unknown", targetCountries: profile.targetCountries, targetSubjects: raw.targetSubjects,
    targetIntake: profile.intakeYear ? `${profile.intakeYear}-${profile.intakeTerm ?? "fall"}` : undefined,
    budget: profile.maxAnnualTuition && profile.tuitionCurrency ? { amount: profile.maxAnnualTuition, currency: profile.tuitionCurrency, period: "per_year" } : undefined,
    preferredCities: raw.preferredCities, missingInformation,
  };
}

const schema = { type: "object", additionalProperties: false, required: ["recommendations"], properties: { recommendations: { type: "array", minItems: 8, maxItems: 20, items: { type: "object", additionalProperties: false, required: ["schoolName","schoolNameLocal","programName","programNameLocal","country","city","degreeLevel","subjectArea","category","estimatedFitScore","recommendationReasons","applicantStrengths","admissionConcerns","admissionRequirements","missingRequirements","verificationQueries","expectedOfficialDomain","possibleOfficialUrl","confidence"], properties: { schoolName:{type:"string"},schoolNameLocal:{type:["string","null"]},programName:{type:"string"},programNameLocal:{type:["string","null"]},country:{type:"string"},city:{type:["string","null"]},degreeLevel:{type:"string",enum:["bachelor","master","doctorate"]},subjectArea:{type:"string"},category:{type:"string",enum:["reach","target","safer","exploratory"]},estimatedFitScore:{type:"number",minimum:0,maximum:100},recommendationReasons:{type:"array",items:{type:"string"}},applicantStrengths:{type:"array",items:{type:"string"}},admissionConcerns:{type:"array",items:{type:"string"}},admissionRequirements:{type:"array",minItems:7,maxItems:7,items:{type:"object",additionalProperties:false,required:["category","requirement","applicantAssessment","status","sourceUrl"],properties:{category:{type:"string",enum:["degree","grade","subject","language","experience","prerequisite","portfolio"]},requirement:{type:["string","null"]},applicantAssessment:{type:"string"},status:{type:"string",enum:["meets","mostly_meets","needs_confirmation","gap_detected","unknown"]},sourceUrl:{type:["string","null"]}}}},missingRequirements:{type:"array",items:{type:"string"}},verificationQueries:{type:"array",items:{type:"string"}},expectedOfficialDomain:{type:["string","null"]},possibleOfficialUrl:{type:["string","null"]},confidence:{type:"number",minimum:0,maximum:1} } } } } } as const;

const boundedSchema = {
  ...schema,
  properties: {
    ...schema.properties,
    recommendations: { ...schema.properties.recommendations, minItems: 6, maxItems: 6 },
  },
} as const;

export class OpenAIRecommendationProvider implements AIRecommendationProvider {
  async generate(profile: ApplicantProfile, relaxed = false) {
    const instructions = `You are Atlas's university programme planning engine. Return exactly 6 real, specific university degree programmes suitable for the applicant. Only use countries in targetCountries. School and programme names must be separate. Never return books, articles, rankings, marketplaces, training courses, aggregators, or non-higher-education institutions. Do not require an Atlas database match. For every programme, include structured admission requirements for degree, grade, subject background, language, experience, prerequisites, and portfolio/special requirements, together with an applicant assessment. Use a programme's official admissions URL when known. Set requirement to null and status to unknown when a requirement cannot be established; never invent a threshold. Uncertain but plausible programmes may be returned with low confidence and verification queries. Expand subject semantics where useful.${relaxed ? " Use broader related subject names while preserving countries and degree level." : ""}`;
    try {
      const startedAt = Date.now();
      const response = await getOpenAIClient().responses.create({ model: RECOMMENDATION_MODEL, max_output_tokens: 4_000, instructions, input: JSON.stringify(profile), text: { format: { type: "json_schema", name: "atlas_programme_recommendations", strict: true, schema: boundedSchema } } });
      console.info("[atlas-openai]", { stage: "recommendation_generation", durationMs: Date.now() - startedAt, model: RECOMMENDATION_MODEL, promptVersion: RECOMMENDATION_PROMPT_VERSION, inputTokens: response.usage?.input_tokens, outputTokens: response.usage?.output_tokens });
      if (!response.output_text) throw new SchoolRecommendationError("OPENAI_INVALID_RESPONSE");
      try {
        const recommendations = (JSON.parse(response.output_text) as { recommendations?: AIProgramRecommendation[] }).recommendations;
        if (!Array.isArray(recommendations)) throw new SchoolRecommendationError("OPENAI_INVALID_RESPONSE");
        return recommendations;
      } catch (error) {
        if (error instanceof SchoolRecommendationError) throw error;
        throw new SchoolRecommendationError("OPENAI_INVALID_RESPONSE");
      }
    } catch (error) { throw normalizeOpenAIError(error); }
  }
}

const pending = <T>(value: T | null, url: string | null): VerifiedField<T> => ({ value, sourceUrl: url, retrievedAt: new Date().toISOString(), verificationStatus: value === null ? "pending" : "partially_verified" });
export function aiRecommendationToCandidate(item: AIProgramRecommendation): ProgrammeCandidate {
  const url = item.possibleOfficialUrl ?? (item.expectedOfficialDomain ? `https://${item.expectedOfficialDomain}` : `https://atlas.invalid/pending/${encodeURIComponent(item.schoolName)}`);
  const programme: VerifiedProgramme = { institutionName:item.schoolName,programmeName:item.programName,country:item.country,officialProgrammeUrl:url,officialRootDomain:item.expectedOfficialDomain ?? "pending.atlas",degreeType:item.degreeLevel,degreeLevel:item.degreeLevel,campus:pending(item.city,url),fieldRelation:"highly_related",sourceType:"official",active:pending<boolean>(null,url),intake:pending<string>(null,url),teachingLanguage:pending<string>(null,url),degreeRequirement:pending<string>(null,url),subjectRequirement:pending<string>(null,url),gradeRequirement:pending<string>(null,url),languageRequirement:pending<string>(null,url),tuition:pending<number>(null,url),tuitionCurrency:pending<string>(null,url),deadline:pending<string>(null,url),applicationUrl:pending<string>(null,url),discoveryQuery:item.verificationQueries.join(" | "),discoveredAt:new Date().toISOString() };
  return { institution:item.schoolName,programme:item.programName,institutionName:item.schoolName,programmeName:item.programName,country:item.country,degreeLevel:item.degreeLevel,officialUrl:url,officialProgrammeUrl:url,fieldRelation:"highly_related",academicStatus:"pending",languageStatus:"pending",budgetStatus:"pending",timelineStatus:"pending",verificationStatus:"pending",missingInformation:item.missingRequirements,sources:[],matchExplanation:item.recommendationReasons.join("；"),recommendationBand:item.category === "exploratory" ? "needs_confirmation" : item.category,score:item.estimatedFitScore,verifiedProgramme:programme,generatedByAI:true,aiRecommendation:item,admissionRequirements:item.admissionRequirements };
}
