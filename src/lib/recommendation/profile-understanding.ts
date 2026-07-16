import type { StudentProfile } from "../student-profile";
import type { UnderstoodProfile } from "./types";
export function understandProfile(profile: StudentProfile, plannedApplicationCount=6): UnderstoodProfile {
  const education=profile.educationHistory[0];
  const targetDegreeLevel=profile.targetDegreeLevel==="本科"?"bachelor":profile.targetDegreeLevel==="硕士"?"master":profile.targetDegreeLevel==="博士"?"doctorate":null;
  const countryAliases:Record<string,string>={France:"法国","United Kingdom":"英国",UK:"英国",Australia:"澳洲",澳大利亚:"澳洲"};
  const targetCountries=profile.targetCountries.map(country=>countryAliases[country]??country);
  return { educationCountry:education?.country??null,institution:education?.institutionNameEn||education?.institutionNameZh||null,degreeLevel:education?.degreeLevel??null,targetDegreeLevel,undergraduateMajor:education?.major??null,grade:education?.officialAverage??education?.weightedAverage??education?.arithmeticAverage??education?.gpa??null,gradeSystem:education?.gradingSystem??null,targetCountries,targetField:profile.targetSubjects[0]??null,intakeYear:profile.targetIntake.year,intakeTerm:profile.targetIntake.term,languageTests:profile.languageTests,maxAnnualTuition:profile.maxAnnualTuition,tuitionCurrency:profile.tuitionCurrency,crossDisciplinePreference:profile.crossDisciplinePreference,plannedApplicationCount };
}

