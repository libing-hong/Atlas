export type VisaCountryCode = "GB" | "FR" | "AU";

export type VisaStage = {
  id: string;
  title: string;
  timing: string;
  description: string;
};

export type VisaDocument = {
  name: string;
  note: string;
  conditional?: string;
};

export type VisaPolicy = {
  countryCode: VisaCountryCode;
  countryName: string;
  eyebrow: string;
  visaType: string;
  currentStage: string;
  nextStep: string;
  submissionLabel: string;
  submissionTiming: string;
  costLabel: string;
  costSummary: string;
  stages: VisaStage[];
  documents: VisaDocument[];
  risks: Array<{ title: string; detail: string }>;
  blockers: string[];
  officialSources: Array<{ label: string; url: string }>;
  lastVerifiedAt: string;
};

export type VisaApplicantContext = {
  nationality?: string;
  currentResidenceCountry?: string;
  applicationCountry?: string;
  courseLevel?: string;
  courseStartDate?: string;
  courseDurationMonths?: number;
  age?: number;
  dependants?: number;
  scholarship?: boolean;
  tuitionPaid?: number;
  specialApprovalRequirements?: string[];
};
