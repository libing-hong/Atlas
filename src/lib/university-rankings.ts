export type RankingVerificationStatus = "verified" | "needs_review" | "unavailable_verified";
export type RankingType = "overall" | "subject" | "unavailable";

export type UniversityRankingRecord = {
  universityId: string;
  rankingProvider: "QS";
  rankingYear: 2026;
  rankingType: RankingType;
  rankingSubject?: string;
  rankingDisplay: string;
  universityCanonicalName: string;
  sourceUrl: string;
  sourceCheckedAt: string;
  verificationStatus: RankingVerificationStatus;
};

export const qs2026SourceUrl = "https://www.topuniversities.com/world-university-rankings/2026";

const rankings: UniversityRankingRecord[] = [
  { universityId: "university-of-leeds", rankingProvider: "QS", rankingYear: 2026, rankingType: "overall", rankingDisplay: "#86", universityCanonicalName: "University of Leeds", sourceUrl: qs2026SourceUrl, sourceCheckedAt: "2026-07-14", verificationStatus: "verified" },
  { universityId: "university-of-birmingham", rankingProvider: "QS", rankingYear: 2026, rankingType: "overall", rankingDisplay: "#76", universityCanonicalName: "University of Birmingham", sourceUrl: qs2026SourceUrl, sourceCheckedAt: "2026-07-14", verificationStatus: "verified" },
  { universityId: "university-of-exeter", rankingProvider: "QS", rankingYear: 2026, rankingType: "overall", rankingDisplay: "=155", universityCanonicalName: "University of Exeter", sourceUrl: qs2026SourceUrl, sourceCheckedAt: "2026-07-14", verificationStatus: "verified" },
  { universityId: "essec-business-school", rankingProvider: "QS", rankingYear: 2026, rankingType: "unavailable", rankingDisplay: "暂无适用的QS排名数据", universityCanonicalName: "ESSEC Business School", sourceUrl: qs2026SourceUrl, sourceCheckedAt: "2026-07-15", verificationStatus: "unavailable_verified" },
];

export const universityAliases: Record<string, string[]> = {
  "university-of-leeds": ["University of Leeds", "Leeds University"],
  "university-of-birmingham": ["University of Birmingham", "Birmingham University"],
  "university-of-exeter": ["University of Exeter", "Exeter University"],
  "essec-business-school": ["ESSEC", "ESSEC Business School", "École Supérieure des Sciences Économiques et Commerciales"],
  "university-college-london": ["UCL", "University College London", "University College London (UCL)"],
};

export const rankingManualReviewQueue: Array<{ submittedName: string; reason: string; status: "pending" }> = [];

export function getQs2026Rankings(universityIds: string[]) {
  return rankings.filter((ranking) => universityIds.includes(ranking.universityId));
}
