import type { ProgramMatchResult } from "./program-matching";
import type { StudentProfile } from "./student-profile";
import type { SchoolRecommendation } from "./application-prototype-data";
export type CountryFitResult={country:string;fit:number;note:string}; export type PlanningTimelineItem={label:string;targetDate:string;status:"now"|"upcoming"|"later"};
export type PlanningReport={planningRunId:string;profileSummary:string;competitivenessScore:number;countryFit:CountryFitResult[];strengths:string[];preparationItems:string[];recommendedPrograms:ProgramMatchResult[];timeline:PlanningTimelineItem[];generatedAt:string};
type PortfolioItem={school:SchoolRecommendation;result:ProgramMatchResult};
export function buildPlanningReport(profile:StudentProfile,portfolio:PortfolioItem[],planningRunId:string):PlanningReport{
 const ed=profile.educationHistory[0]; const academic=ed?.officialAverage??ed?.weightedAverage??ed?.arithmeticAverage??null; const completeness=portfolio[0]?.result.dataCompleteness??Math.round([profile.name,ed?.major,profile.targetCountries.length,profile.targetSubjects.length,profile.targetIntake.year,academic,profile.languageTests.length].filter(Boolean).length/7*100);
 const competitivenessScore=Math.max(20,Math.min(95,Math.round((academic??55)*.55+completeness*.35)));
 const strengths=[...(academic!==null?[`已提供可核验的成绩口径：${academic}%`]:[]),...profile.languageTests.filter(x=>x.overall!==null).map(x=>`${x.type} ${x.overall}`),...(profile.workExperiences.length+profile.internships.length?[`已有 ${profile.workExperiences.length+profile.internships.length} 段工作或实习经历`]:[])].slice(0,4);
 const preparationItems=[...(!profile.languageTests.length?["补充语言成绩或考试计划"]:[]),...(academic===null?["确认目标学校接受的均分口径"]:[]),...(!ed?.prerequisiteCourses.length?["补充已修先修课程"]:[]),...(profile.maxAnnualTuition===null?["预算未设置"]:[]),...(portfolio.some(x=>x.result.unresolvedItems.length)?["完成项目要求中的待确认事项"]:[])].slice(0,5);
 const term=profile.targetIntake.term==="spring"?"春季":profile.targetIntake.term==="summer"?"夏季":profile.targetIntake.term==="fall"?"秋季":"待确认"; const year=profile.targetIntake.year;
 return {planningRunId,profileSummary:`${profile.name??"用户"}的教育背景为 ${ed?.institutionNameZh||ed?.institutionNameEn||"未提供/待确认"} · ${ed?.major||"未提供/待确认"}，目标申请 ${profile.targetCountries.join("、")||"未提供/待确认"} 的 ${profile.targetSubjects.join("、")||"未提供/待确认"}。`,competitivenessScore,countryFit:profile.targetCountries.map(country=>({country,fit:Math.round(completeness*.7+20),note:"按真实资料完整度、项目规则和申请条件动态核验。"})),strengths,preparationItems,recommendedPrograms:portfolio.map(x=>x.result),timeline:[{label:"确认推荐项目与申请组合",targetDate:"现在",status:"now"},{label:"完成语言、先修课和材料核验",targetDate:year?`${year-1}年`:"待确认",status:"upcoming"},{label:"按官方截止日期提交",targetDate:`${year??"待确认"}年${term}`,status:"later"}],generatedAt:new Date().toISOString()};
}

