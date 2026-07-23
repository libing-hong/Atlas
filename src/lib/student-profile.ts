export const ENGLISH_TESTS = ["IELTS Academic", "TOEFL iBT", "PTE Academic", "Cambridge English", "Duolingo English Test"] as const;
export const FRENCH_TESTS = ["DELF", "DALF", "TCF", "TCF DAP", "TCF IRN", "TEF", "TEF Études"] as const;
export type LanguageTestType = typeof ENGLISH_TESTS[number] | typeof FRENCH_TESTS[number];
export type Language = "English" | "French";

export type LanguageTest = {
  id: string;
  language: Language;
  type: LanguageTestType;
  overall: number | null;
  listening: number | null;
  reading: number | null;
  writing: number | null;
  speaking: number | null;
  level: string | null;
  testDate: string | null;
};

export type EducationHistory = {
  id: string;
  country: string | null;
  institutionNameZh: string | null;
  institutionNameEn: string | null;
  degreeLevel: string | null;
  degreeName: string | null;
  major: string | null;
  graduationYear: number | null;
  graduationMonth: number | null;
  graduationStatus: "graduated" | "expected" | null;
  arithmeticAverage: number | null;
  weightedAverage: number | null;
  officialAverage: number | null;
  gpa: number | null;
  gradingSystem: string | null;
  prerequisiteCourses: string[];
};

export type WorkExperience = { role: string; industry?: string; months?: number; description?: string };
export type CrossDisciplinePreference = "related_only" | "adjacent" | "open";

export type StudentProfile = {
  name: string | null;
  educationHistory: EducationHistory[];
  languageTests: LanguageTest[];
  workExperiences: WorkExperience[];
  internships: WorkExperience[];
  targetCountries: string[];
  targetSubjects: string[];
  targetDegreeLevel: "本科" | "硕士" | "博士" | null;
  targetIntake: { year: number | null; term: "spring" | "summer" | "fall" | null };
  maxAnnualTuition: number | null;
  tuitionCurrency: string | null;
  preferredCities: string[];
  crossDisciplinePreference: CrossDisciplinePreference;
  acceptsPreMaster: boolean;
  acceptsLanguageCourse: boolean;
};

const key = "atlas.student-profile.v3";
const legacyKey = "atlas.student-profile.v2";

export const emptyStudentProfile: StudentProfile = {
  name: null,
  educationHistory: [],
  languageTests: [],
  workExperiences: [],
  internships: [],
  targetCountries: [],
  targetSubjects: [],
  targetDegreeLevel: null,
  targetIntake: { year: null, term: null },
  maxAnnualTuition: null,
  tuitionCurrency: null,
  preferredCities: [],
  crossDisciplinePreference: "related_only",
  acceptsPreMaster: false,
  acceptsLanguageCourse: true,
};
export const defaultStudentProfile = emptyStudentProfile;

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function normalizeTargetDegreeLevel(value: unknown): StudentProfile["targetDegreeLevel"] {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "本科" || normalized === "bachelor" || normalized === "bachelors" || normalized === "undergraduate") return "本科";
  if (normalized === "硕士" || normalized === "master" || normalized === "masters" || normalized === "postgraduate") return "硕士";
  if (normalized === "博士" || normalized === "doctorate" || normalized === "doctoral" || normalized === "phd") return "博士";
  return null;
}
function normalizeLanguageTest(value: Partial<LanguageTest> & { type?: string }, index: number): LanguageTest | null {
  const all = [...ENGLISH_TESTS, ...FRENCH_TESTS] as readonly string[];
  const legacyType = value.type as string | undefined;
  if (!legacyType || !all.includes(legacyType)) return null;
  const language: Language = (FRENCH_TESTS as readonly string[]).includes(legacyType) ? "French" : "English";
  return { id: value.id ?? `language-${index}`, language, type: legacyType as LanguageTestType, overall: nullableNumber(value.overall), listening: nullableNumber(value.listening), reading: nullableNumber(value.reading), writing: nullableNumber(value.writing), speaking: nullableNumber(value.speaking), level: nullableString(value.level), testDate: nullableString(value.testDate) };
}

// Reads v3 and safely migrates v2. Missing values stay null; migration never invents facts.
export function normalizeStudentProfile(raw: Record<string, unknown> | null | undefined): StudentProfile {
  if (!raw) return { ...emptyStudentProfile };
  const legacyEducation = raw.institutionNameEn || raw.institutionNameZh || raw.currentMajor ? [{
    id: "education-legacy", country: nullableString(raw.institutionCountry), institutionNameZh: nullableString(raw.institutionNameZh), institutionNameEn: nullableString(raw.institutionNameEn), degreeLevel: nullableString(raw.degreeLevel), degreeName: null, major: nullableString(raw.currentMajor), graduationYear: nullableNumber((raw.graduationDate as { year?: unknown } | undefined)?.year), graduationMonth: nullableNumber((raw.graduationDate as { month?: unknown } | undefined)?.month), graduationStatus: null, arithmeticAverage: nullableNumber(raw.averageScore), weightedAverage: null, officialAverage: null, gpa: nullableNumber(raw.gpa), gradingSystem: nullableString(raw.gradingSystem), prerequisiteCourses: [],
  } satisfies EducationHistory] : [];
  const educationHistory = Array.isArray(raw.educationHistory) ? raw.educationHistory.map((item, index) => {
    const value = item as Partial<EducationHistory>;
    return { id: value.id ?? `education-${index}`, country: nullableString(value.country), institutionNameZh: nullableString(value.institutionNameZh), institutionNameEn: nullableString(value.institutionNameEn), degreeLevel: nullableString(value.degreeLevel), degreeName: nullableString(value.degreeName), major: nullableString(value.major), graduationYear: nullableNumber(value.graduationYear), graduationMonth: nullableNumber(value.graduationMonth), graduationStatus: value.graduationStatus ?? null, arithmeticAverage: nullableNumber(value.arithmeticAverage), weightedAverage: nullableNumber(value.weightedAverage), officialAverage: nullableNumber(value.officialAverage), gpa: nullableNumber(value.gpa), gradingSystem: nullableString(value.gradingSystem), prerequisiteCourses: Array.isArray(value.prerequisiteCourses) ? value.prerequisiteCourses.filter((x): x is string => typeof x === "string") : [] };
  }) : legacyEducation;
  const languageTests = Array.isArray(raw.languageTests) ? raw.languageTests.map((x, i) => normalizeLanguageTest(x as Partial<LanguageTest>, i)).filter((x): x is LanguageTest => Boolean(x)) : [];
  const intake = raw.targetIntake as { year?: unknown; term?: unknown } | undefined;
  return {
    name: nullableString(raw.name), educationHistory, languageTests,
    workExperiences: Array.isArray(raw.workExperiences) ? raw.workExperiences as WorkExperience[] : [],
    internships: Array.isArray(raw.internships) ? raw.internships as WorkExperience[] : [],
    targetCountries: Array.isArray(raw.targetCountries) ? raw.targetCountries.filter((x): x is string => typeof x === "string") : [],
    targetSubjects: Array.isArray(raw.targetSubjects) ? raw.targetSubjects.filter((x): x is string => typeof x === "string") : [],
    targetDegreeLevel: normalizeTargetDegreeLevel(raw.targetDegreeLevel ?? raw.targetDegree),
    targetIntake: { year: nullableNumber(intake?.year), term: intake?.term === "spring" || intake?.term === "summer" || intake?.term === "fall" ? intake.term : null },
    maxAnnualTuition: nullableNumber(raw.maxAnnualTuition ?? raw.budgetMax), tuitionCurrency: nullableString(raw.tuitionCurrency) ?? (raw.budgetMax ? "GBP" : null),
    preferredCities: Array.isArray(raw.preferredCities) ? raw.preferredCities.filter((x): x is string => typeof x === "string") : [],
    crossDisciplinePreference: raw.crossDisciplinePreference === "adjacent" || raw.crossDisciplinePreference === "open" ? raw.crossDisciplinePreference : raw.acceptsCrossDiscipline ? "open" : "related_only",
    acceptsPreMaster: raw.acceptsPreMaster === true, acceptsLanguageCourse: raw.acceptsLanguageCourse !== false,
  };
}

export function readStudentProfile(): StudentProfile {
  if (typeof window === "undefined") return { ...emptyStudentProfile };
  try { return normalizeStudentProfile(JSON.parse(window.localStorage.getItem(key) ?? window.localStorage.getItem(legacyKey) ?? "null")); }
  catch { return { ...emptyStudentProfile }; }
}
export function validateStudentProfile(profile: StudentProfile) {
  const primary = profile.educationHistory[0];
  const missing = [!profile.name && "姓名", !primary?.institutionNameEn && !primary?.institutionNameZh && "学校", !primary?.major && "专业", !profile.targetCountries.length && "目标国家", !profile.targetSubjects.length && "目标专业", !profile.targetDegreeLevel && "目标学历层级"].filter(Boolean);
  if (missing.length) throw new Error(`请填写：${missing.join("、")}`);
  for (const score of [primary.arithmeticAverage, primary.weightedAverage, primary.officialAverage]) if (score !== null && (score < 0 || score > 100)) throw new Error("均分应在 0–100 之间");
  return profile;
}
export function writeStudentProfile(profile: StudentProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(normalizeStudentProfile(profile as unknown as Record<string, unknown>)));
  window.dispatchEvent(new Event("atlas-student-profile-change")); window.dispatchEvent(new Event("atlas-planning-state-change"));
}
export function profileDisplay(value: string | number | null | undefined) { return value === null || value === undefined || value === "" ? "未提供/待确认" : String(value); }

