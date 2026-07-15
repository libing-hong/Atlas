import type { SchoolRecommendation } from "./application-prototype-data";
import { getProgramContent } from "./program-knowledge";
import type { StudentProfile } from "./student-profile";

export type EligibilityStatus = "eligible" | "mostly_eligible" | "needs_confirmation" | "currently_not_eligible";
export type MatchCategory = "reach" | "target" | "safer" | "manual_review" | "currently_not_eligible";
export type PreparationItem = { label: string; reason: string; priority: "high" | "medium" | "low" };

export type PublicInstitutionDecision = {
  status: "accepted" | "not_found" | "needs_confirmation";
  explanation: string;
};

export type ProgramRequirementSet = {
  programId: string;
  intakeYear: number;
  intakeOpen: boolean;
  deadline?: string;
  degreeLevel: string;
  acceptedBackgrounds: string[];
  minimumLanguageOverall?: number;
  languageCanBeSubmittedLater: boolean;
  tuition: number;
  currency: string;
};

export type EligibilityResult = {
  status: EligibilityStatus;
  hardFailures: string[];
  unresolvedItems: string[];
  preparationItems: PreparationItem[];
};

export type ProgramMatchResult = {
  programId: string;
  eligibilityStatus: EligibilityStatus;
  matchScore: number;
  category: MatchCategory;
  matchedItems: string[];
  preparationItems: PreparationItem[];
  unresolvedItems: string[];
  recommendationReason: string;
};

function normalized(value: string) {
  return value.toLowerCase().replace(/[\s&/·（）()_-]/g, "");
}

function subjectRelated(student: StudentProfile, school: SchoolRecommendation) {
  const haystack = normalized([student.currentMajor, ...student.targetSubjects].join(" "));
  const program = normalized(school.programName);
  const marketing = ["marketing", "市场营销", "品牌", "digital"].some((token) => haystack.includes(normalized(token)) && program.includes(normalized(token)));
  const business = ["business", "商务", "管理", "management"].some((token) => haystack.includes(normalized(token)) && program.includes(normalized(token)));
  return marketing || business;
}

export function buildPublicRequirementSet(school: SchoolRecommendation): ProgramRequirementSet {
  return {
    programId: school.id,
    intakeYear: Number(school.intake.match(/20\d{2}/)?.[0] ?? 0),
    intakeOpen: true,
    deadline: /^20\d{2}-\d{2}-\d{2}$/.test(school.deadline) ? school.deadline : undefined,
    degreeLevel: "本科",
    acceptedBackgrounds: ["相关学科", "其他背景需结合官网确认"],
    minimumLanguageOverall: 6.5,
    languageCanBeSubmittedLater: true,
    tuition: school.tuition,
    currency: school.currency
  };
}

export function checkProgramEligibility(
  student: StudentProfile,
  requirements: ProgramRequirementSet,
  institutionDecision?: PublicInstitutionDecision
): EligibilityResult {
  const hardFailures: string[] = [];
  const unresolvedItems: string[] = [];
  const preparationItems: PreparationItem[] = [];

  if (!requirements.intakeOpen) hardFailures.push("目标入学季暂未开放");
  if (requirements.intakeYear && requirements.intakeYear !== student.targetIntake.year) hardFailures.push("目标入学年份不一致");
  if (requirements.deadline && new Date(requirements.deadline).getTime() < Date.now()) hardFailures.push("当前申请截止日期已过");
  if (student.degreeLevel !== requirements.degreeLevel) hardFailures.push("学历层级与公开要求不一致");

  if (!institutionDecision || institutionDecision.status === "needs_confirmation") {
    unresolvedItems.push("中国本科院校接受范围需要进一步确认");
  } else if (institutionDecision.status === "not_found") {
    unresolvedItems.push("本科院校名称或接受范围需要人工复核");
  }

  const language = student.languageTests[0]?.overall;
  if (requirements.minimumLanguageOverall && language !== undefined && language < requirements.minimumLanguageOverall) {
    if (requirements.languageCanBeSubmittedLater || student.acceptsLanguageCourse) {
      preparationItems.push({ label: "继续准备语言成绩", reason: `当前总分 ${language}，公开基准为 ${requirements.minimumLanguageOverall}`, priority: "high" });
    } else {
      hardFailures.push("语言成绩低于当前公开要求且不允许后补");
    }
  } else if (requirements.minimumLanguageOverall && language === undefined) {
    preparationItems.push({ label: "补充语言成绩", reason: "尚未检测到可核验的语言考试结果", priority: "high" });
  }

  if (student.budgetMax && requirements.currency === "GBP" && requirements.tuition > student.budgetMax) {
    const gap = requirements.tuition - student.budgetMax;
    if (gap > student.budgetMax * 0.2) hardFailures.push("学费明显超出当前预算上限");
    else preparationItems.push({ label: "确认预算与奖学金", reason: `学费比当前预算上限高约 £${gap.toLocaleString()}`, priority: "medium" });
  }

  const status: EligibilityStatus = hardFailures.length
    ? "currently_not_eligible"
    : unresolvedItems.length
      ? "needs_confirmation"
      : preparationItems.some((item) => item.priority === "high")
        ? "mostly_eligible"
        : "eligible";

  return { status, hardFailures, unresolvedItems, preparationItems };
}

function scoreProgram(student: StudentProfile, school: SchoolRecommendation) {
  const content = getProgramContent(school.id);
  const academic = student.averageScore === undefined ? 18 : student.averageScore >= 80 ? 30 : student.averageScore >= 75 ? 25 : 18;
  const subject = subjectRelated(student, school) ? 20 : student.acceptsCrossDiscipline ? 11 : 0;
  const language = (student.languageTests[0]?.overall ?? 0) >= 6.5 ? 10 : (student.languageTests[0]?.overall ?? 0) >= 6 ? 7 : 3;
  const career = student.workExperiences.length || student.internships.length ? 13 : 8;
  const budget = !student.budgetMax || school.currency !== "GBP" ? 7 : school.tuition <= student.budgetMax ? 10 : school.tuition <= student.budgetMax * 1.15 ? 6 : 1;
  const geography = student.targetCountries.includes(school.country) ? 5 : 0;
  const interests = content?.learningFocus.some((focus) => student.targetSubjects.some((subjectName) => normalized(focus).includes(normalized(subjectName)) || normalized(subjectName).includes(normalized(focus)))) ? 5 : subjectRelated(student, school) ? 4 : 1;
  const timing = school.deadlineType === "rolling" || !/^20\d{2}-/.test(school.deadline) || new Date(school.deadline).getTime() > Date.now() ? 5 : 0;
  return Math.max(0, Math.min(100, academic + subject + language + career + budget + geography + interests + timing));
}

export function calculateProgramMatch(
  student: StudentProfile,
  school: SchoolRecommendation,
  institutionDecision?: PublicInstitutionDecision
): ProgramMatchResult {
  const content = getProgramContent(school.id);
  const countryMatches = student.targetCountries.includes(school.country);
  const related = subjectRelated(student, school);
  const eligibility = checkProgramEligibility(student, buildPublicRequirementSet(school), institutionDecision);
  if (!countryMatches) eligibility.hardFailures.push("不在当前目标国家范围内");
  if (!related && !student.acceptsCrossDiscipline) eligibility.hardFailures.push("当前专业背景与目标方向缺少明确关联");

  const score = scoreProgram(student, school);
  const finalStatus: EligibilityStatus = eligibility.hardFailures.length ? "currently_not_eligible" : eligibility.status;
  const category: MatchCategory = finalStatus === "currently_not_eligible"
    ? "currently_not_eligible"
    : content?.coverageStatus === "fetching" || content?.coverageStatus === "manual_review"
      ? "manual_review"
      : score >= 85
        ? "safer"
        : score >= 72
          ? "target"
          : "reach";

  const matchedItems = [
    ...(countryMatches ? [`目标国家与 ${school.country} 一致`] : []),
    ...(related ? ["本科或目标专业方向与项目主题相关"] : []),
    ...((student.languageTests[0]?.overall ?? 0) >= 6.5 ? ["当前语言总分达到可核验的公开基准"] : []),
    ...(student.budgetMax && school.currency === "GBP" && school.tuition <= student.budgetMax ? ["学费在当前预算范围内"] : [])
  ];

  const focus = content?.learningFocus.slice(0, 3).join("、");
  const reason = finalStatus === "currently_not_eligible"
    ? `该项目暂未进入主要推荐：${eligibility.hardFailures.join("；")}。你仍可保留查看，但应先调整目标或补充资料。`
    : `你已确认的${student.currentMajor}背景与该项目方向${related ? "存在具体关联" : "需要进一步说明关联"}。${focus ? `项目重点包括${focus}，可与目前目标方向进行对照。` : "该项目课程公开信息仍在核实。"}当前 Atlas 方案匹配度为 ${score}，用于排序申请方案，不代表学校录取概率。`;

  return {
    programId: school.id,
    eligibilityStatus: finalStatus,
    matchScore: score,
    category,
    matchedItems,
    preparationItems: eligibility.preparationItems,
    unresolvedItems: [...eligibility.unresolvedItems, ...(content?.coverageStatus === "verified" ? [] : ["部分专业公开信息仍在核实"])],
    recommendationReason: reason
  };
}

export function buildProgramPortfolio(student: StudentProfile, schools: SchoolRecommendation[]) {
  return schools
    .map((school) => ({ school, result: calculateProgramMatch(student, school) }))
    .sort((left, right) => {
      if (left.result.category === "currently_not_eligible" && right.result.category !== "currently_not_eligible") return 1;
      if (right.result.category === "currently_not_eligible" && left.result.category !== "currently_not_eligible") return -1;
      return right.result.matchScore - left.result.matchScore;
    });
}
