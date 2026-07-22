import type { ProgrammeCandidate } from "./types";

export function getCandidatePresentation(candidate: ProgrammeCandidate) {
  const isVerified = candidate.verificationStatus === "verified";
  const isPartiallyVerified = candidate.verificationStatus === "partially_verified";
  const applicationField = candidate.verifiedProgramme.applicationUrl;
  const applicationUrl = isVerified && applicationField.verificationStatus === "verified"
    ? applicationField.value ?? undefined
    : undefined;

  return {
    applicationUrl,
    canJoinApplicationList: isVerified,
    schoolHighlights: isVerified
      ? "已完成官方核验"
      : isPartiallyVerified
        ? "部分官方信息已核验，其余内容待 Atlas 核验"
        : "探索性候选 · 待 Atlas 核验",
    programHighlights: isVerified
      ? `${candidate.degreeLevel} · ${candidate.country} · 已核验录取要求`
      : `${candidate.degreeLevel} · ${candidate.country} · 录取要求待确认`,
    sources: isVerified || isPartiallyVerified
      ? candidate.sources.filter((source) => source.verificationStatus === "verified")
      : [],
  };
}
