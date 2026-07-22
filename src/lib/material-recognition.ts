import { readStudentProfile, writeStudentProfile, type EducationHistory, type StudentProfile } from "./student-profile";

export type MaterialKind = "transcript" | "degree" | "language" | "cv" | "personal_statement" | "recommendation" | "identity" | "other";
export type RecognizedMaterial = {
  kind: MaterialKind;
  fileName: string;
  confidence: "high" | "medium" | "low";
  fields: { institution?: string; major?: string; degreeLevel?: string; officialAverage?: number; languageTest?: "IELTS Academic"; overall?: number; listening?: number; reading?: number; writing?: number; speaking?: number };
  summary: string[];
};

const kindWords: Array<[MaterialKind, RegExp]> = [
  ["transcript", /transcript|成绩单/i], ["degree", /degree|diploma|毕业证|学位证/i], ["language", /ielts|toefl|pte|雅思|托福/i],
  ["cv", /\bcv\b|resume|简历/i], ["personal_statement", /personal.?statement|motivation|个人陈述|动机信/i],
  ["recommendation", /recommendation|reference|推荐信/i], ["identity", /passport|identity|护照|身份证/i],
];

function classify(name: string, hint?: MaterialKind) { return hint ?? kindWords.find(([, pattern]) => pattern.test(name))?.[0] ?? "other"; }
function number(text: string, pattern: RegExp) { const match = text.match(pattern); const value = match ? Number(match[1]) : NaN; return Number.isFinite(value) ? value : undefined; }
function line(text: string, pattern: RegExp) { return text.match(pattern)?.[1]?.trim(); }

export async function recognizeMaterial(file: File, hint?: MaterialKind): Promise<RecognizedMaterial> {
  const kind = classify(file.name, hint);
  const canReadText = file.size <= 200_000 && (file.type.startsWith("text/") || /\.(txt|csv)$/i.test(file.name));
  const content = canReadText ? await file.text() : "";
  const fields: RecognizedMaterial["fields"] = {};
  if (content) {
    fields.institution = line(content, /(?:university|institution|school|学校|院校)\s*[:：]\s*([^\r\n]+)/i);
    fields.major = line(content, /(?:major|programme|program|专业)\s*[:：]\s*([^\r\n]+)/i);
    fields.degreeLevel = line(content, /(?:degree|学历|学位)\s*[:：]\s*([^\r\n]+)/i);
    fields.officialAverage = number(content, /(?:overall average|average|均分|平均分)\s*[:：]?\s*(\d{1,3}(?:\.\d+)?)/i);
    const overall = number(content, /(?:ielts(?: academic)?\s*)?(?:overall|总分)\s*[:：]?\s*(\d(?:\.\d)?)/i);
    if (/ielts|雅思/i.test(content) || (kind === "language" && overall)) {
      fields.languageTest = "IELTS Academic"; fields.overall = overall;
      fields.listening = number(content, /(?:listening|听力)\s*[:：]?\s*(\d(?:\.\d)?)/i);
      fields.reading = number(content, /(?:reading|阅读)\s*[:：]?\s*(\d(?:\.\d)?)/i);
      fields.writing = number(content, /(?:writing|写作)\s*[:：]?\s*(\d(?:\.\d)?)/i);
      fields.speaking = number(content, /(?:speaking|口语)\s*[:：]?\s*(\d(?:\.\d)?)/i);
    }
  }
  const summary = [`识别类型：${kindLabel(kind)}`];
  if (fields.institution) summary.push(`院校：${fields.institution}`);
  if (fields.major) summary.push(`专业：${fields.major}`);
  if (fields.officialAverage !== undefined) summary.push(`均分：${fields.officialAverage}`);
  if (fields.overall !== undefined) summary.push(`IELTS：${fields.overall}`);
  if (!content) summary.push("当前文件格式仅完成材料分类；PDF/图片正文识别需正式 OCR Adapter 启用后完成");
  const extracted = Object.values(fields).some((value) => value !== undefined);
  return { kind, fileName: file.name, confidence: content && extracted ? "high" : kind !== "other" ? "medium" : "low", fields, summary };
}

export function confirmRecognizedMaterial(result: RecognizedMaterial) {
  const profile = readStudentProfile();
  const next = applyFields(profile, result);
  writeStudentProfile(next);
  const key = "atlas.material-recognition.v1";
  let records: Array<Omit<RecognizedMaterial, "fields"> & { fields: RecognizedMaterial["fields"]; confirmedAt: string }> = [];
  try { records = JSON.parse(window.localStorage.getItem(key) ?? "[]"); } catch { records = []; }
  window.localStorage.setItem(key, JSON.stringify([...records.filter((item) => item.fileName !== result.fileName), { ...result, confirmedAt: new Date().toISOString() }]));
  window.dispatchEvent(new Event("atlas-material-recognition-change"));
}

function applyFields(profile: StudentProfile, result: RecognizedMaterial): StudentProfile {
  const blank: EducationHistory = { id: `education-${Date.now()}`, country: null, institutionNameZh: null, institutionNameEn: null, degreeLevel: null, degreeName: null, major: null, graduationYear: null, graduationMonth: null, graduationStatus: null, arithmeticAverage: null, weightedAverage: null, officialAverage: null, gpa: null, gradingSystem: null, prerequisiteCourses: [] };
  const education = profile.educationHistory[0] ?? blank;
  const updatedEducation = { ...education, institutionNameEn: result.fields.institution ?? education.institutionNameEn, major: result.fields.major ?? education.major, degreeLevel: result.fields.degreeLevel ?? education.degreeLevel, officialAverage: result.fields.officialAverage ?? education.officialAverage };
  const languageTests = result.fields.languageTest ? [{ id: `language-${Date.now()}`, language: "English" as const, type: result.fields.languageTest, overall: result.fields.overall ?? null, listening: result.fields.listening ?? null, reading: result.fields.reading ?? null, writing: result.fields.writing ?? null, speaking: result.fields.speaking ?? null, level: null, testDate: null }, ...profile.languageTests.filter((test) => test.type !== result.fields.languageTest)] : profile.languageTests;
  return { ...profile, educationHistory: [updatedEducation, ...profile.educationHistory.slice(1)], languageTests };
}

export function kindLabel(kind: MaterialKind) { return ({ transcript: "成绩单", degree: "学历/学位证明", language: "语言成绩", cv: "CV/简历", personal_statement: "个人陈述/动机信", recommendation: "推荐信", identity: "身份证明", other: "其他材料" } as const)[kind]; }
