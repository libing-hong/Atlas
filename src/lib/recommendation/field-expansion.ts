import type { FieldExpansion, FieldRelation } from "./types";

const relations: Array<{ anchors: RegExp; terms: Array<[string,string,FieldRelation]> }> = [{
  anchors: /艺术管理|arts? management|management des arts|文化管理|cultural management/i,
  terms: [
    ["Arts Management","en","synonym"],["Arts and Cultural Management","en","synonym"],["Cultural Management","en","synonym"],
    ["Creative Industries Management","en","highly_related"],["Culture and Innovation","en","highly_related"],
    ["Museum Management","en","highly_related"],["Gallery Management","en","highly_related"],["Heritage Management","en","highly_related"],
    ["Cultural Entrepreneurship","en","highly_related"],["Management culturel","fr","synonym"],["Industries créatives et culturelles","fr","highly_related"],
  ],
}, {
  anchors: /国际贸易|国际商务|international trade|international business|global business/i,
  terms: [
    ["International Trade","en","synonym"],["International Business","en","highly_related"],["Global Business","en","highly_related"],
    ["International Business Management","en","highly_related"],["Global Management","en","adjacent"],
    ["Commerce international","fr","synonym"],["Management international","fr","highly_related"],
  ],
}, {
  anchors: /法学|法律|\blaw\b|llm|master of laws/i,
  terms: [
    ["Law","en","synonym"],["LLM","en","synonym"],["Master of Laws","en","synonym"],
    ["International Law","en","highly_related"],["Business Law","en","highly_related"],["Commercial Law","en","highly_related"],
    ["European Law","en","highly_related"],["Human Rights Law","en","highly_related"],["Droit","fr","synonym"],
    ["Droit international","fr","highly_related"],["Droit des affaires","fr","highly_related"],
  ],
}];

export function expandField(targetField: string | null): FieldExpansion[] {
  if (!targetField) return [];
  const base: FieldExpansion = { term: targetField, locale: /[\u4e00-\u9fff]/.test(targetField) ? "zh" : "en", relation: "synonym" };
  const group = relations.find(item => item.anchors.test(targetField));
  return [base, ...(group?.terms.map(([term,locale,relation]) => ({term,locale,relation})) ?? [])]
    .filter((item,index,all) => all.findIndex(other => other.term.toLowerCase() === item.term.toLowerCase()) === index);
}

export function relationAllowed(relation: FieldRelation, preference: "related_only"|"adjacent"|"open") {
  if (preference === "open") return true;
  if (preference === "adjacent") return relation !== "cross_discipline";
  return relation === "synonym" || relation === "highly_related";
}

