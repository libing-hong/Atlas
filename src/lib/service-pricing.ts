import { formatCNY } from "./format-currency";

export const servicePricing = {
  diyApplication: 0,
  applicationPlanningReport: 0,
  singleSchoolSubmission: 29.9,
  singleSchoolSubmissionFen: 2990,
  advisorConsultation: 299,
  advisorConsultationFen: 29900,
  fullServiceUkAu: 4999,
  fullServiceUkAuFen: 499900,
  fullServiceFrance: 6999,
  fullServiceFranceFen: 699900,
} as const;

export type PurchasedService =
  | "none"
  | "single_school_submission"
  | "advisor_consultation"
  | "full_service_uk_au"
  | "full_service_france";

export function servicePriceLabel(service: Exclude<PurchasedService, "none">) {
  if (service === "single_school_submission") return `${formatCNY(servicePricing.singleSchoolSubmission)}／学校`;
  if (service === "advisor_consultation") return `${formatCNY(servicePricing.advisorConsultation)}／次`;
  if (service === "full_service_uk_au") return formatCNY(servicePricing.fullServiceUkAu);
  return formatCNY(servicePricing.fullServiceFrance);
}
