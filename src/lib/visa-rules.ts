export type SupportedVisaCountry = "uk" | "france" | "australia";
export type VisaTaskStatus =
  | "not_applicable"
  | "waiting_for_dependency"
  | "not_started"
  | "atlas_processing"
  | "user_action_required"
  | "needs_confirmation"
  | "blocked"
  | "ready"
  | "completed"
  | "expired"
  | "needs_review";

export type VisaRule = {
  id: string;
  country: SupportedVisaCountry;
  visaType: string;
  applicantCondition: string;
  requirement: string;
  requiredEvidence: string[];
  deadlineRule: string;
  dependency: string[];
  exceptions: string[];
  officialSource: { title: string; url: string };
  effectiveFrom: string;
  effectiveTo: string | null;
  verifiedAt: string;
  ruleVersion: string;
};

export type VisaCountryPolicy = {
  country: SupportedVisaCountry;
  label: string;
  visaType: string;
  officialUrl: string;
  ruleVersion: string;
  verifiedAt: string;
  rules: VisaRule[];
};

const policy = (
  country: SupportedVisaCountry,
  label: string,
  visaType: string,
  officialUrl: string,
  ruleVersion: string,
  rules: Array<Omit<VisaRule, "country" | "visaType" | "ruleVersion" | "verifiedAt" | "effectiveFrom" | "effectiveTo">>,
): VisaCountryPolicy => ({
  country,
  label,
  visaType,
  officialUrl,
  ruleVersion,
  verifiedAt: "2026-07-24",
  rules: rules.map((rule) => ({
    ...rule,
    country,
    visaType,
    ruleVersion,
    verifiedAt: "2026-07-24",
    effectiveFrom: "2026-07-24",
    effectiveTo: null,
  })),
});

export const VISA_POLICIES: Record<SupportedVisaCountry, VisaCountryPolicy> = {
  uk: policy("uk", "英国", "Student visa", "https://www.gov.uk/student-visa", "uk-student-2026.07.24", [
    {
      id: "uk-cas",
      applicantCondition: "所有 Student visa 申请人",
      requirement: "递交时需要学校签发的有效 CAS。",
      requiredEvidence: ["CAS reference number", "CAS 中的课程与费用信息"],
      deadlineRule: "必须在在线申请递交前获得并核对。",
      dependency: ["final_offer"],
      exceptions: [],
      officialSource: { title: "Student visa: documents you must provide", url: "https://www.gov.uk/student-visa/documents-you-must-provide" },
    },
    {
      id: "uk-finance",
      applicantCondition: "未满足官方资金证据豁免条件的申请人",
      requirement: "证明课程费用、生活费用及适用的家属费用；金额必须按 CAS、学习地点与个人情况计算。",
      requiredEvidence: ["符合官方要求的资金证据", "CAS 已记录的已付学费", "奖学金或官方资助证明（如适用）"],
      deadlineRule: "在递交前完成；资金持有期和材料日期按递交日倒推。",
      dependency: ["school_document", "facts_confirmed"],
      exceptions: ["符合官方列明的资金证据豁免", "在英国持有效签证已满官方规定期间等情况"],
      officialSource: { title: "Financial evidence for Student visa applicants", url: "https://www.gov.uk/guidance/financial-evidence-for-student-and-child-student-route-applicants" },
    },
    {
      id: "uk-special",
      applicantCondition: "按国籍、居住史、课程和 CAS 信息可能需要",
      requirement: "确认是否需要 TB 检测、ATAS 或未成年人同意文件。",
      requiredEvidence: ["TB certificate（如适用）", "ATAS certificate（如适用）", "监护人同意与关系证明（如适用）"],
      deadlineRule: "适用材料必须在递交前有效。",
      dependency: ["facts_confirmed"],
      exceptions: ["官方规则判定为不适用"],
      officialSource: { title: "Student visa: documents you must provide", url: "https://www.gov.uk/student-visa/documents-you-must-provide" },
    },
  ]),
  france: policy("france", "法国", "学生长期签证", "https://france-visas.gouv.fr/en/web/france-visas/etudiant", "fr-student-2026.07.24", [
    {
      id: "fr-enrolment",
      applicantCondition: "已被法国高等教育机构录取的学生",
      requirement: "提供接受学校出具的注册或预注册证明。",
      requiredEvidence: ["certificate of enrolment / pre-enrolment"],
      deadlineRule: "在 France-Visas 递交前完成。",
      dependency: ["final_offer"],
      exceptions: [],
      officialSource: { title: "France-Visas: Student", url: "https://france-visas.gouv.fr/en/web/france-visas/etudiant" },
    },
    {
      id: "fr-eef",
      applicantCondition: "国籍或居住地属于 Études en France 流程覆盖范围时",
      requirement: "完成适用的 Études en France / Campus France 前置流程。",
      requiredEvidence: ["EEF/Campus France completion evidence（如适用）"],
      deadlineRule: "必须在签证递交前按申请地流程完成。",
      dependency: ["facts_confirmed"],
      exceptions: ["申请地不适用 Études en France 流程"],
      officialSource: { title: "France-Visas: Student enrolment conditions", url: "https://france-visas.gouv.fr/en/web/france-visas/etudiant" },
    },
    {
      id: "fr-wizard",
      applicantCondition: "所有法国学生签证申请人",
      requirement: "使用 France-Visas 助手根据个人情况生成最终材料清单。",
      requiredEvidence: ["France-Visas application", "Visa wizard checklist", "个人情况对应的支持材料"],
      deadlineRule: "预约递交前完成并再次核对。",
      dependency: ["school_document", "facts_confirmed"],
      exceptions: [],
      officialSource: { title: "France-Visas application process", url: "https://www.france-visas.gouv.fr/en/web/france-visas" },
    },
  ]),
  australia: policy("australia", "澳大利亚", "Student visa (subclass 500)", "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500", "au-500-2026.07.24", [
    {
      id: "au-coe",
      applicantCondition: "通常适用于 Student visa (subclass 500) 申请人",
      requirement: "递交时提供所有拟就读课程的有效 CoE。",
      requiredEvidence: ["Confirmation of Enrolment (CoE)"],
      deadlineRule: "CoE 必须在递交和签证决定时有效。",
      dependency: ["final_offer"],
      exceptions: ["官方列明可使用支持信或其他注册证据的少数类别"],
      officialSource: { title: "Subclass 500: enrolment evidence", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500" },
    },
    {
      id: "au-gs",
      applicantCondition: "Student visa 申请人",
      requirement: "在在线申请中真实回答 Genuine Student 问题并提供支持材料。",
      requiredEvidence: ["Genuine Student answers", "与回答相符的支持文件"],
      deadlineRule: "在线申请递交前完成。",
      dependency: ["facts_confirmed"],
      exceptions: [],
      officialSource: { title: "Genuine Student requirement", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500/genuine-student-requirement" },
    },
    {
      id: "au-oshc",
      applicantCondition: "申请人与纳入申请的家属",
      requirement: "持有覆盖适用期间的 OSHC。",
      requiredEvidence: ["OSHC provider", "policy dates", "policy number"],
      deadlineRule: "递交时提供，并保持所需覆盖。",
      dependency: ["school_document", "facts_confirmed"],
      exceptions: ["官方列明的少数国籍保险安排"],
      officialSource: { title: "Subclass 500: Overseas Student Health Cover", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500" },
    },
  ]),
};

export function normalizeVisaCountry(country: string): SupportedVisaCountry | null {
  const value = country.trim().toLowerCase();
  if (["uk", "gb", "英国", "united kingdom"].includes(value)) return "uk";
  if (["fr", "法国", "france"].includes(value)) return "france";
  if (["au", "澳洲", "澳大利亚", "australia"].includes(value)) return "australia";
  return null;
}

export function getVisaPolicy(country: string): VisaCountryPolicy | null {
  const code = normalizeVisaCountry(country);
  return code ? VISA_POLICIES[code] : null;
}

// Kept for existing callers.
export function getVisaRule(country: string) {
  const value = getVisaPolicy(country);
  return value ? { ...value, routeName: value.visaType, lastVerifiedAt: value.verifiedAt, requiredItems: value.rules.map((rule) => ({ id: rule.id, title: rule.requirement, description: rule.deadlineRule })) } : null;
}
