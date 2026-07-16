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

const rankings: UniversityRankingRecord[] = [];

export const universityAliases: Record<string, string[]> = {};

export const rankingManualReviewQueue: Array<{ submittedName: string; reason: string; status: "pending" }> = [];

export function getQs2026Rankings(universityIds: string[]) {
  return rankings.filter((ranking) => universityIds.includes(ranking.universityId));
}


