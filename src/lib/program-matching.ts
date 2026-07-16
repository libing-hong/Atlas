import type { SchoolRecommendation } from "./application-prototype-data";
import type { EducationHistory, LanguageTest, StudentProfile } from "./student-profile";

export type EligibilityStatus = "eligible" | "mostly_eligible" | "needs_confirmation" | "currently_not_eligible";
export type MatchCategory = "reach" | "target" | "safer" | "manual_review" | "currently_not_eligible";
export type PreparationItem = { label: string; reason: string; priority: "high" | "medium" | "low" };
export type MatchBreakdown = { academic: number; institutionBackground: number; subjectRelevance: number; prerequisites: number; language: number; budget: number; timing: number };
export type ProgramMatchResult = { programId: string; eligibilityStatus: EligibilityStatus; matchScore: number; category: MatchCategory; scoreBreakdown: MatchBreakdown; dataCompleteness: number; recommendationConfidence: number; matchedItems: string[]; preparationItems: PreparationItem[]; unresolvedItems: string[]; hardFailures: string[]; recommendationReason: string };

const norm = (value: string | null | undefined) => (value ?? "").toLowerCase().replace(/[\s&/·，、()_-]/g, "");
const primary = (profile: StudentProfile): EducationHistory | undefined => profile.educationHistory[0];
const score = (ed?: EducationHistory) => ed?.officialAverage ?? ed?.weightedAverage ?? ed?.arithmeticAverage ?? null;
const bestTest = (profile: StudentProfile, language: LanguageTest["language"]) => profile.languageTests.filter(x => x.language === language && x.overall !== null).sort((a,b) => (b.overall ?? 0) - (a.overall ?? 0))[0];
const subjectGroups = [
  ["law","法律","法学","llm","jurisprudence","humanrights","人权","publicpolicy","公共政策"],
  ["business","management","商科","管理","marketing","市场营销"],
  ["computer","计算机","software","data","数据","ai","人工智能"],
  ["finance","金融","accounting","会计","economics","经济"],
  ["engineering","工程","mechanical","机械","electrical","电子"],
];
function relation(profile: StudentProfile, school: SchoolRecommendation): "same" | "adjacent" | "unrelated" {
  const background = norm(primary(profile)?.major); const target = norm(`${profile.targetSubjects.join(" ")} ${school.programName}`);
  const bgGroup = subjectGroups.findIndex(g => g.some(x => background.includes(norm(x))));
  const targetGroup = subjectGroups.findIndex(g => g.some(x => target.includes(norm(x))));
  if (bgGroup >= 0 && bgGroup === targetGroup) return "same";
  if ((bgGroup === 0 && /policy|政策|criminology|犯罪/.test(target)) || (bgGroup === 1 && /econom|finance|经济|金融/.test(target))) return "adjacent";
  return "unrelated";
}
function completeness(profile: StudentProfile) {
  const ed=primary(profile); const values=[profile.name,ed?.country,ed?.institutionNameEn||ed?.institutionNameZh,ed?.major,score(ed),profile.targetCountries.length,profile.targetSubjects.length,profile.targetIntake.year,profile.languageTests.length,profile.maxAnnualTuition];
  return Math.round(values.filter(Boolean).length / values.length * 100);
}

export function calculateProgramMatch(profile: StudentProfile, school: SchoolRecommendation): ProgramMatchResult {
  const ed=primary(profile); const academicValue=score(ed); const related=relation(profile,school); const hardFailures:string[]=[]; const unresolvedItems:string[]=[]; const preparationItems:PreparationItem[]=[];
  const programmeYear=Number(school.intake.match(/20\d{2}/)?.[0] ?? 0);
  if (profile.targetCountries.length && !profile.targetCountries.includes(school.country)) hardFailures.push("项目不在目标国家范围内");
  if (programmeYear && profile.targetIntake.year && programmeYear !== profile.targetIntake.year) hardFailures.push("项目入学年份与目标年份不一致");
  if (/^20\d{2}-\d{2}-\d{2}$/.test(school.deadline) && new Date(school.deadline).getTime() < Date.now()) hardFailures.push("官方申请截止日期已过");
  if (related === "unrelated" && profile.crossDisciplinePreference !== "open") hardFailures.push("本科背景与目标专业不相关，且跨专业范围不允许");
  if (related === "adjacent" && profile.crossDisciplinePreference === "related_only") hardFailures.push("该项目仅属相邻领域，超出当前跨专业范围");
  if (!ed?.institutionNameEn && !ed?.institutionNameZh) unresolvedItems.push("本科院校未提供");
  if (academicValue === null) unresolvedItems.push("官方成绩口径与均分未提供");
  if (!profile.languageTests.length) unresolvedItems.push("语言成绩未提供");
  if (profile.maxAnnualTuition === null) unresolvedItems.push("预算未设置");
  const english=bestTest(profile,"English"); const french=bestTest(profile,"French");
  if (english?.overall !== null && english && english.overall < 6) preparationItems.push({label:"提高英语成绩",reason:`当前 ${english.type} ${english.overall}`,priority:"high"});
  const breakdown:MatchBreakdown={ academic:academicValue===null?10:academicValue>=85?20:academicValue>=75?15:8, institutionBackground:ed?.institutionNameEn||ed?.institutionNameZh?10:4, subjectRelevance:related==="same"?25:related==="adjacent"?16:4, prerequisites:ed?.prerequisiteCourses.length?15:7, language:(english||french)?12:5, budget:profile.maxAnnualTuition===null?6:school.currency===profile.tuitionCurrency&&school.tuition>profile.maxAnnualTuition?2:10, timing:hardFailures.some(x=>x.includes("截止")||x.includes("年份"))?0:8 };
  if (profile.maxAnnualTuition!==null && profile.tuitionCurrency===school.currency && school.tuition>profile.maxAnnualTuition) hardFailures.push("学费超过每年最高预算");
  const matchScore=Math.min(100,Object.values(breakdown).reduce((a,b)=>a+b,0)); const dataCompleteness=completeness(profile); const recommendationConfidence=Math.round(dataCompleteness*(school.applicationLinkStatus==="verified"?0.9:0.65));
  const eligibilityStatus:EligibilityStatus=hardFailures.length?"currently_not_eligible":unresolvedItems.length?"needs_confirmation":preparationItems.length?"mostly_eligible":"eligible";
  const category:MatchCategory=hardFailures.length?"currently_not_eligible":recommendationConfidence<65?"manual_review":matchScore>=85?"safer":matchScore>=70?"target":"reach";
  const institution=ed?.institutionNameZh||ed?.institutionNameEn||"未提供院校"; const major=ed?.major||"未提供专业";
  return {programId:school.id,eligibilityStatus,matchScore,category,scoreBreakdown:breakdown,dataCompleteness,recommendationConfidence,matchedItems:[related==="same"?"本科与目标专业属于同一领域":related==="adjacent"?"本科与目标专业属于相邻领域":"专业关联待核实"],preparationItems,unresolvedItems,hardFailures,recommendationReason:hardFailures.length?`基于 ${institution} · ${major}，存在明确排除原因：${hardFailures.join("；")}`:`基于 ${institution} · ${major} 的真实资料生成；未提供信息不参与正向评分。`};
}

export function buildProgramPortfolio(profile: StudentProfile, programmes: SchoolRecommendation[]) {
  const sameField = programmes.filter(p => relation(profile,p) !== "unrelated");
  const pool = sameField.length ? sameField : programmes; // 无结果时仅扩大同领域词义检索，不注入固定学校。
  return pool.map(school=>({school,result:calculateProgramMatch(profile,school)})).sort((a,b)=>a.result.category==="currently_not_eligible"?1:b.result.category==="currently_not_eligible"?-1:b.result.matchScore-a.result.matchScore);
}

