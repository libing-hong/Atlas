import type { ProgramMatchResult } from "./program-matching";
import type { StudentProfile } from "./student-profile";
import type { SchoolRecommendation } from "./application-prototype-data";

export type CountryFitResult = { country: string; fit: number; note: string };
export type PlanningTimelineItem = { label: string; targetDate: string; status: "now" | "upcoming" | "later" };
export type PlanningReport = {
  planningRunId: string;
  profileSummary: string;
  competitivenessScore: number;
  countryFit: CountryFitResult[];
  strengths: string[];
  preparationItems: string[];
  recommendedPrograms: ProgramMatchResult[];
  timeline: PlanningTimelineItem[];
  generatedAt: string;
};
type PortfolioItem = { school: SchoolRecommendation; result: ProgramMatchResult };

function institutionScore(profile: StudentProfile) {
  const name = `${profile.institutionNameZh ?? ""} ${profile.institutionNameEn}`.toLowerCase();
  if (/985|清华|北京大学|复旦|上海交通|浙江大学|南京大学|中国科学技术大学/.test(name)) return 18;
  if (/深圳大学|211|double first|双一流/.test(name)) return 14;
  if (/普通|college|学院/.test(name)) return 8;
  return 11;
}
function academicScore(profile: StudentProfile) {
  if (profile.averageScore !== undefined) return Math.max(6, Math.min(30, Math.round((profile.averageScore - 55) * 0.86)));
  if (profile.gpa !== undefined) return Math.max(6, Math.min(30, Math.round(profile.gpa / 4 * 30)));
  return 6;
}
function languageScore(profile: StudentProfile) {
  const overall = profile.languageTests[0]?.overall;
  if (overall === undefined) return 3;
  if (overall >= 7.5) return 18;
  if (overall >= 7) return 15;
  if (overall >= 6.5) return 12;
  if (overall >= 6) return 8;
  return 4;
}
function calculateCountryFit(profile: StudentProfile, country: string) {
  const targeted = profile.targetCountries.includes(country);
  const language = profile.languageTests[0]?.overall;
  let fit = targeted ? 66 : 35;
  if (country === "英国") fit += language === undefined ? -8 : language >= 7 ? 12 : language >= 6.5 ? 8 : 1;
  if (country === "澳洲") fit += language === undefined ? -5 : language >= 6.5 ? 10 : 4;
  if (country === "法国") fit += profile.workExperiences.length || profile.internships.length ? 8 : 2;
  if ((profile.budgetMax ?? 0) >= (country === "英国" ? 40000 : country === "澳洲" ? 35000 : 30000)) fit += 8;
  return Math.max(20, Math.min(96, fit));
}

export function buildPlanningReport(profile: StudentProfile, portfolio: PortfolioItem[], planningRunId: string): PlanningReport {
  const experienceCount = profile.workExperiences.length + profile.internships.length;
  const score = Math.max(20, Math.min(95,
    institutionScore(profile) + academicScore(profile) + languageScore(profile)
    + Math.min(12, experienceCount * 4)
    + (profile.targetCountries.length ? 7 : 0)
    + (profile.targetSubjects.length ? 7 : 0),
  ));
  const countries = [...new Set(profile.targetCountries)];
  const fits = countries.map((country) => ({
    country,
    fit: calculateCountryFit(profile, country),
    note: country === "英国"
      ? "重点关注学术成绩、语言单项和分轮截止日期。"
      : country === "澳洲"
        ? "可结合预算、语言准备进度与开学时间安排申请。"
        : country === "法国"
          ? "需同时核对项目授课语言、申请系统和材料要求。"
          : "Atlas 将根据该国家公开要求继续核验项目。",
  })).sort((left, right) => right.fit - left.fit);

  const strengths = [
    ...(profile.averageScore !== undefined && profile.averageScore >= 85 ? [`确认均分 ${profile.averageScore}% 形成较强学术基础`] : []),
    ...(profile.averageScore !== undefined && profile.averageScore >= 75 && profile.averageScore < 85 ? [`已提供可核验的平均分 ${profile.averageScore}%`] : []),
    ...(profile.languageTests[0]?.overall !== undefined && profile.languageTests[0].overall >= 6.5 ? [`${profile.languageTests[0].type} 总分 ${profile.languageTests[0].overall} 可用于当前项目筛选`] : []),
    ...(experienceCount ? [`已有 ${experienceCount} 段工作或实习经历可用于申请叙事`] : []),
    [`当前本科方向为${profile.currentMajor}，可与目标专业逐项对照`],
  ].flat().slice(0, 4);

  const preparationItems = [
    ...(profile.languageTests.length ? [] : ["补充语言考试计划与预计出分时间"]),
    ...(profile.averageScore !== undefined && profile.averageScore < 75 ? [`当前平均分为 ${profile.averageScore}%，需要优先筛选成绩要求更匹配的项目`] : []),
    ...(!experienceCount ? ["补充课程项目、实习或工作经历，增强专业动机说明"] : []),
    ...(!profile.institutionNameEn ? ["确认本科院校英文官方名称"] : []),
    ...(portfolio.some((item) => item.result.unresolvedItems.length) ? ["逐项确认本科院校接受范围和最新公开要求"] : []),
  ].slice(0, 5);

  const intake = `${profile.targetIntake.year}年${profile.targetIntake.term === "spring" ? "春季" : profile.targetIntake.term === "summer" ? "夏季" : "秋季"}`;
  return {
    planningRunId,
    profileSummary: `${profile.name}目前就读或毕业于${profile.institutionNameZh || profile.institutionNameEn}，本科专业为${profile.currentMajor}，目标申请${countries.join("、")}的${profile.targetSubjects.join("、")}方向，计划 ${intake} 入学。`,
    competitivenessScore: score,
    countryFit: fits,
    strengths,
    preparationItems,
    recommendedPrograms: portfolio.map((item) => item.result),
    timeline: [
      { label: "确认推荐学校与申请组合", targetDate: "现在", status: "now" },
      { label: "完成核心申请材料", targetDate: `${profile.targetIntake.year - 1}年夏季至秋季`, status: "upcoming" },
      { label: "按学校截止日期提交申请", targetDate: `${profile.targetIntake.year - 1}年秋季起`, status: "later" },
    ],
    generatedAt: new Date().toISOString(),
  };
}
