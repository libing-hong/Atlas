export type LanguageTest = {
  type: "IELTS Academic" | "TOEFL iBT" | "PTE Academic" | "other";
  overall?: number;
  listening?: number;
  reading?: number;
  writing?: number;
  speaking?: number;
  testDate?: string;
};

export type WorkExperience = {
  role: string;
  industry?: string;
  months?: number;
  description?: string;
};

export type StudentProfile = {
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

export const defaultStudentProfile: StudentProfile = {
  degreeLevel: "本科",
  institutionNameZh: "深圳大学",
  institutionNameEn: "Shenzhen University",
  institutionCountry: "中国",
  graduationDate: { year: 2026, month: 6 },
  currentMajor: "市场营销",
  averageScore: 78,
  gradingSystem: "百分制",
  languageTests: [{ type: "IELTS Academic", overall: 6.5, listening: 6.5, reading: 7, writing: 5.5, speaking: 6.5, testDate: "2026-03-18" }],
  workExperiences: [{ role: "品牌出海与欧洲市场拓展", industry: "跨境贸易", months: 12 }],
  internships: [],
  targetCountries: ["英国", "法国"],
  targetSubjects: ["市场营销", "国际商务"],
  targetIntake: { year: 2027, term: "fall" },
  budgetMin: 20000,
  budgetMax: 35000,
  preferredCities: [],
  acceptsCrossDiscipline: true,
  acceptsPreMaster: false,
  acceptsLanguageCourse: true
};

export function readStudentProfile(): StudentProfile {
  if (typeof window === "undefined") return defaultStudentProfile;
  try {
    const saved = JSON.parse(window.localStorage.getItem(key) ?? "{}") as Partial<StudentProfile>;
    return {
      ...defaultStudentProfile,
      ...saved,
      graduationDate: { ...defaultStudentProfile.graduationDate, ...saved.graduationDate },
      targetIntake: { ...defaultStudentProfile.targetIntake, ...saved.targetIntake },
      languageTests: saved.languageTests ?? defaultStudentProfile.languageTests,
      workExperiences: saved.workExperiences ?? defaultStudentProfile.workExperiences,
      internships: saved.internships ?? defaultStudentProfile.internships
    };
  } catch {
    return defaultStudentProfile;
  }
}

export function writeStudentProfile(profile: StudentProfile) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, JSON.stringify(profile));
    window.dispatchEvent(new Event("atlas-student-profile-change"));
  }
}
