import type { ProgrammeCandidate, RecommendationBand, UnderstoodProfile, VerifiedProgramme } from "./types"; import { sourcesFor } from "./official-verification";
const pending=(value:unknown)=>value===null||value===undefined;
export function assessEligibility(profile:UnderstoodProfile,p:VerifiedProgramme):ProgrammeCandidate{
 const missing:string[]=[]; for(const [label,value] of [["招生年份",p.intake.value],["授课语言",p.teachingLanguage.value],["学历要求",p.degreeRequirement.value],["本科专业要求",p.subjectRequirement.value],["成绩要求",p.gradeRequirement.value],["语言要求",p.languageRequirement.value],["校区",p.campus.value],["学费",p.tuition.value],["截止日期",p.deadline.value],["官方申请链接",p.applicationUrl.value]] as const)if(pending(value))missing.push(label);
 const academicStatus=profile.degreeLevel&&p.degreeRequirement.value?(/bachelor|bac\s*\+\s*[34]|240 ects/i.test(p.degreeRequirement.value)?"meets":"pending"):"pending";
 const languageStatus=!profile.languageTests.length||!p.languageRequirement.value?"pending":"meets";
 const budgetStatus=profile.maxAnnualTuition===null||p.tuition.value===null||profile.tuitionCurrency!==p.tuitionCurrency.value?"pending":p.tuition.value<=profile.maxAnnualTuition?"meets":"does_not_meet";
 const targetYear=profile.intakeYear?String(profile.intakeYear):null; const timelineStatus=!targetYear||!p.intake.value?"pending":p.intake.value.includes(targetYear)?"meets":"pending";
 const explicitFailure=p.active.value===false||budgetStatus==="does_not_meet";
 const verificationStatus=missing.length?p.active.value===null?"pending":"partially_verified":"verified"; let score=p.fieldRelation==="synonym"?82:p.fieldRelation==="highly_related"?76:p.fieldRelation==="adjacent"?64:45; score+=academicStatus==="meets"?5:0;score+=languageStatus==="meets"?4:0;score+=budgetStatus==="meets"?4:0;score+=timelineStatus==="meets"?5:0;score-=missing.length*2;
 const recommendationBand:RecommendationBand=explicitFailure?"currently_not_suitable":verificationStatus!=="verified"?"needs_confirmation":score>=88?"safer":score>=75?"target":"reach";
 return {institution:p.institution,programme:p.programme,officialUrl:p.officialUrl,fieldRelation:p.fieldRelation,academicStatus,languageStatus,budgetStatus,timelineStatus,verificationStatus,missingInformation:missing,sources:sourcesFor(p),matchExplanation:`项目与目标专业关系为 ${p.fieldRelation}。${missing.length?`尚需核验：${missing.join("、")}。`:"公开字段已完成核验。"}`,recommendationBand,score:Math.max(0,Math.min(100,score)),verifiedProgramme:p};
}




