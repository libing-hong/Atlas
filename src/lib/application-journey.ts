import type {
  ApplicationRecord,
  ApplicationRecordStatus,
  ApplicationSubmissionMode,
} from "./application-prototype-data";

const OFFER_STATUSES: ApplicationRecordStatus[] = [
  "conditional_offer",
  "unconditional_offer",
  "accepted",
];

const OFFER_UPLOAD_STATUSES: ApplicationRecordStatus[] = [
  "submitted",
  "waiting_result",
  "supplement_required",
  "conditional_offer",
  "unconditional_offer",
];

export function inferSubmissionMode(
  record: Pick<ApplicationRecord, "submissionMode" | "serviceType">,
  legacyMode: string | null,
): ApplicationSubmissionMode {
  if (record.submissionMode) return record.submissionMode;
  if (record.serviceType === "single_school") return "atlas_single";
  if (record.serviceType === "full_service") return "atlas_full_service";
  return legacyMode === "DIY" ? "diy" : "unselected";
}

export function applicationProgressFor(
  status: ApplicationRecordStatus,
  preparedMaterials = 0,
  totalMaterials = 0,
) {
  if (status === "preparing_materials") {
    const ratio = totalMaterials ? preparedMaterials / totalMaterials : 0;
    return Math.round(15 + Math.min(1, ratio) * 35);
  }
  const progress: Partial<Record<ApplicationRecordStatus, number>> = {
    considering: 0,
    selected: 10,
    ready_to_submit: 60,
    submission_in_progress: 75,
    submitted: 85,
    waiting_result: 90,
    supplement_required: 90,
    conditional_offer: 95,
    unconditional_offer: 98,
    accepted: 100,
    rejected: 100,
    declined: 100,
    withdrawn: 100,
  };
  return progress[status] ?? 0;
}

export function getVerifiedApplicationPortal(record: ApplicationRecord) {
  if (record.applicationLinkStatus !== "verified" || !record.applicationPortalUrl) return null;
  try {
    const url = new URL(record.applicationPortalUrl);
    if (url.protocol !== "https:" || url.hostname === "atlas.invalid") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function chooseSubmissionMode(record: ApplicationRecord, mode: ApplicationSubmissionMode): ApplicationRecord {
  return {
    ...record,
    submissionMode: mode,
    nextAction: mode === "diy" ? "前往学校官方系统完成申请" : record.nextAction,
    updatedAt: new Date().toISOString(),
  };
}

export function markPortalOpened(record: ApplicationRecord, openedAt = new Date().toISOString()): ApplicationRecord {
  if (!getVerifiedApplicationPortal(record)) return record;
  return {
    ...record,
    status: "submission_in_progress",
    applicationPortalOpenedAt: openedAt,
    applicationProgress: 75,
    nextAction: `完成 ${record.universityName} 官方申请并返回确认`,
    updatedAt: openedAt,
  };
}

export function confirmApplicationSubmitted(
  record: ApplicationRecord,
  input: { submittedAt: string; applicationReference?: string; submissionEvidenceFileName?: string },
): ApplicationRecord {
  return {
    ...record,
    status: "waiting_result",
    submittedAt: input.submittedAt,
    applicationReference: input.applicationReference || undefined,
    submissionEvidenceFileName: input.submissionEvidenceFileName || undefined,
    applicationProgress: 90,
    decisionStatus: "waiting_result",
    nextAction: `等待 ${record.universityName} 申请结果`,
    updatedAt: new Date().toISOString(),
  };
}

export function canUploadOffer(record: ApplicationRecord) {
  return OFFER_UPLOAD_STATUSES.includes(record.status);
}

export function attachOfferEvidence(
  record: ApplicationRecord,
  fileName: string,
  unconditional = false,
): ApplicationRecord {
  if (!canUploadOffer(record)) return record;
  const status = unconditional ? "unconditional_offer" : "conditional_offer";
  return {
    ...record,
    status,
    decisionStatus: "offer_received",
    offerSource: "student",
    offerEvidenceAvailable: true,
    offerFileName: fileName,
    offerConditionsSatisfied: unconditional,
    applicationProgress: unconditional ? 98 : 95,
    nextAction: "确认 Offer 条件并选择最终入读学校",
    updatedAt: new Date().toISOString(),
  };
}

export function isVisaUnlocked(records: ApplicationRecord[]) {
  return records.some((record) => OFFER_STATUSES.includes(record.status) && record.offerEvidenceAvailable === true);
}

export function applicationJourneySummary(records: ApplicationRecord[]) {
  return {
    total: records.length,
    preparing: records.filter((record) => ["selected", "preparing_materials", "ready_to_submit", "submission_in_progress"].includes(record.status)).length,
    submitted: records.filter((record) => ["submitted", "waiting_result", "supplement_required", ...OFFER_STATUSES].includes(record.status)).length,
    waiting: records.filter((record) => ["waiting_result", "supplement_required"].includes(record.status)).length,
    offers: records.filter((record) => OFFER_STATUSES.includes(record.status) && record.offerEvidenceAvailable).length,
  };
}

