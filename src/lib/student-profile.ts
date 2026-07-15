export type LanguageTest = {
  type: "IELTS Academic" | "TOEFL iBT" | "PTE Academic" | "other";
  overall?: number;
  listening?: number;
  reading?: number;
  writing?: number;
  speaking?: number;
  testDate?: string;
};
export type WorkExperience = { role: string; industry?: string; months?: number; description?: string };
export type StudentProfile = {
  name: string;
  degreeLevel: string;
  institutionNameZh?: string;
  institutionNameEn: string;
  institutionCountry: string;
  graduationDate: { year: number; month: number };
  currentMajor: string;
  averageScore?: number;
  gpa?: number;
  gradingSystem?: string;
  languageTests: LanguageTest[];
  workExperiences: WorkExperience[];
  internships: WorkExperience[];
  targetCountries: string[];
  targetSubjects: string[];
  targetIntake: { year: number; term: "spring" | "summer" | "fall" };
  budgetMin?: number;
  budgetMax?: number;
  preferredCities?: string[];
  acceptsCrossDiscipline: boolean;
  acceptsPreMaster: boolean;
  acceptsLanguageCourse: boolean;
};

const key = "atlas.student-profile.v2";
export const emptyStudentProfile: StudentProfile = {
  name: "",
  degreeLevel: "本科",
  institutionNameZh: "",
  institutionNameEn: "",
  institutionCountry: "中国",
  graduationDate: { year: new Date().getFullYear(), month: 6 },
  currentMajor: "",
  languageTests: [],
  workExperiences: [],
  internships: [],
  targetCountries: [],
  targetSubjects: [],
  targetIntake: { year: new Date().getFullYear() + 1, term: "fall" },
  preferredCities: [],
  acceptsCrossDiscipline: false,
  acceptsPreMaster: false,
  acceptsLanguageCourse: true,
};
export const defaultStudentProfile = emptyStudentProfile;

export function readStudentProfile(): StudentProfile {
  if (typeof window === "undefined") return emptyStudentProfile;
  try {
    const saved = JSON.parse(window.localStorage.getItem(key) ?? "null") as Partial<StudentProfile> | null;
    if (!saved) return emptyStudentProfile;
    return {
      ...emptyStudentProfile,
      ...saved,
      graduationDate: { ...emptyStudentProfile.graduationDate, ...saved.graduationDate },
      targetIntake: { ...emptyStudentProfile.targetIntake, ...saved.targetIntake },
      languageTests: saved.languageTests ?? [],
      workExperiences: saved.workExperiences ?? [],
      internships: saved.internships ?? [],
      targetCountries: saved.targetCountries ?? [],
      targetSubjects: saved.targetSubjects ?? [],
    };
  } catch { return emptyStudentProfile; }
}
export function validateStudentProfile(profile: StudentProfile) {
  const missing = [
    !profile.name && "姓名",
    !profile.institutionNameZh && "本科院校中文名",
    !profile.institutionNameEn && "本科院校英文名",
    !profile.currentMajor && "本科专业",
    !profile.targetCountries.length && "目标国家",
    !profile.targetSubjects.length && "目标专业",
    !profile.budgetMax && "学费预算",
  ].filter(Boolean);
  if (missing.length) throw new Error(`请填写：${missing.join("、")}`);
  if (profile.averageScore !== undefined && (profile.averageScore < 0 || profile.averageScore > 100)) throw new Error("平均分应在 0–100 之间");
  if (profile.gpa !== undefined && (profile.gpa < 0 || profile.gpa > 5)) throw new Error("GPA 数值不正确");
  return profile;
}
export function writeStudentProfile(profile: StudentProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(profile));
  window.dispatchEvent(new Event("atlas-student-profile-change"));
  window.dispatchEvent(new Event("atlas-planning-state-change"));
}
