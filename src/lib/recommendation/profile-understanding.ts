import type { StudentProfile } from "../student-profile";
import type { UnderstoodProfile } from "./types";
export function understandProfile(profile: StudentProfile, plannedApplicationCount=6): UnderstoodProfile {
  const education=profile.educationHistory[0];
  return { educationCountry:education?.country??null,institution:education?.institutionNameEn||education?.institutionNameZh||null,degreeLevel:education?.degreeLevel??null,undergraduateMajor:education?.major??null,grade:education?.officialAverage??education?.weightedAverage??education?.arithmeticAverage??education?.gpa??null,gradeSystem:education?.gradingSystem??null,targetCountries:profile.targetCountries,targetField:profile.targetSubjects[0]??null,intakeYear:profile.targetIntake.year,intakeTerm:profile.targetIntake.term,languageTests:profile.languageTests,maxAnnualTuition:profile.maxAnnualTuition,tuitionCurrency:profile.tuitionCurrency,crossDisciplinePreference:profile.crossDisciplinePreference,plannedApplicationCount };
}


