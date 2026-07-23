export const UK_STUDENT_VISA_RULES = {
  verifiedAt: "2026-07-23",
  effectiveFrom: "2025-11-11",
  applicationFee: 558,
  ihsAnnualStudentRate: 776,
  maintenance: {
    london: { monthly: 1529, months: 9 },
    outsideLondon: { monthly: 1171, months: 9 },
  },
  fundsHoldingDays: 28,
  bankEvidenceMaxAgeDays: 31,
  casValidityMonths: 6,
  earliestApplicationMonths: 6,
  typicalDecisionWeeks: 3,
} as const;

export type VisaLocation = keyof typeof UK_STUDENT_VISA_RULES.maintenance;

export function calculateRequiredFunds(
  annualTuition: number,
  tuitionPaid: number,
  location: VisaLocation,
) {
  const living = UK_STUDENT_VISA_RULES.maintenance[location];
  return Math.max(0, annualTuition - tuitionPaid) + living.monthly * living.months;
}
