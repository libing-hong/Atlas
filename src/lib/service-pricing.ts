import { formatCNY } from "./format-currency";

export const servicePricing = {
  applicationPlanningReport: 0,
  advisorConsultation: 299,
  singleSchoolSubmission: 29.9,
} as const;

export type PurchasedService = "none" | "single_school_submission" | "advisor_consultation";

export function servicePriceLabel(service: Exclude<PurchasedService, "none">) {
  return service === "single_school_submission"
    ? `${formatCNY(servicePricing.singleSchoolSubmission)}／学校`
    : `${formatCNY(servicePricing.advisorConsultation)}／次`;
}
