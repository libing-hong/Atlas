import fs from "node:fs";
import path from "node:path";

type PrivateSheet = { sheetName: string; sourceYear: number; ruleType: string; percentages: number[]; searchText: string; confidential: true; importedAt: string };
type PrivateIndex = { version: string; sourceType: string; sheets: PrivateSheet[] };

const targetSheetHints: Record<string, string[]> = {
  "leeds-marketing": ["leeds", "利兹"],
  "birmingham-business": ["birmingham", "伯明翰"],
  "exeter-marketing": ["exeter", "埃克塞特"],
};

function readPrivateIndex(): PrivateIndex | null {
  const filePath = path.join(process.cwd(), ".atlas-private", "uk-admission-rules.json");
  if (!fs.existsSync(filePath)) return null;
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")) as PrivateIndex; } catch { return null; }
}

export function checkInstitutionEligibility({ targetUniversityId, institutionName, average }: { targetUniversityId: string; institutionName: string; average?: number }) {
  const index = readPrivateIndex();
  if (!index) return { status: "not_configured" as const, explanation: "Atlas 的内部院校规则索引尚未配置。", recommendedActions: ["暂以学校官网公开要求为准", "提交人工核验"], confidential: true };
  const hints = targetSheetHints[targetUniversityId] ?? [targetUniversityId];
  const sheet = index.sheets.find((item) => hints.some((hint) => item.searchText.includes(hint.toLowerCase())));
  if (!sheet) return { status: "not_found" as const, explanation: "当前内部规则索引中暂未找到该目标学校对应的工作表。", recommendedActions: ["查看学校官网要求", "提交人工核验"], confidential: true };
  const normalizedInstitution = institutionName.toLowerCase().replace(/[\s\u3000,，.。'’\"“”()（）-]/g, "");
  const found = normalizedInstitution.length > 2 && sheet.searchText.includes(normalizedInstitution);
  return {
    status: found ? "manual_review" as const : "not_found" as const,
    ruleType: sheet.ruleType,
    sourceYear: sheet.sourceYear,
    studentAverage: average,
    explanation: found ? "内部规则索引中找到可能的院校名称，但仍需结合专业、院校分类和成绩档位人工确认。" : "当前工作表中未找到完全匹配的院校名称，不能据此断定不符合。",
    recommendedActions: found ? ["确认学校英文名称和别名", "核对适用学院与专业", "确认算术或加权均分口径"] : ["尝试其他中英文名称", "提交人工核验"],
    confidential: true,
  };
}
