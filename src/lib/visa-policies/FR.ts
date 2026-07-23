import type { VisaPolicy } from "./types";

export const FR_VISA_POLICY: VisaPolicy = {
  countryCode: "FR",
  countryName: "法国",
  eyebrow: "FRANCE STUDENT VISA",
  visaType: "VLS-TS étudiant",
  currentStage: "完成 Campus France",
  nextStep: "准备住宿证明",
  submissionLabel: "建议递交",
  submissionTiming: "按开课日期与递交地规则计算",
  costLabel: "预计费用与资金",
  costSummary: "签证费、生活资金及递交服务费动态计算",
  lastVerifiedAt: "2026-07-23",
  stages: [
    { id: "accept", title: "确认最终录取", timing: "决定入读后立即", description: "确认学校、课程、开课时间与付款要求。" },
    { id: "eef", title: "完成 Études en France", timing: "按 Campus France 节点", description: "提交材料并完成适用的审核或面试。" },
    { id: "housing", title: "准备住宿与资金证明", timing: "签证递交前", description: "根据递交地与个人情况准备对应证明。" },
    { id: "france-visas", title: "完成 France-Visas 表格", timing: "材料确认后", description: "填写长期学生签证申请并核对信息。" },
    { id: "appointment", title: "预约并递交", timing: "按签证中心可预约时间", description: "完成预约、材料递交与生物识别。" },
    { id: "validate", title: "入境后完成 VLS-TS 手续", timing: "入境后按规定期限", description: "完成线上验证或适用的居留手续。" },
  ],
  documents: [
    { name: "有效护照", note: "覆盖申请及计划停留期限" },
    { name: "学校录取证明", note: "与最终确认的入读项目一致" },
    { name: "Études en France 证明", note: "显示流程已完成", conditional: "根据递交地与项目判断" },
    { name: "住宿证明", note: "与抵法后的实际安排一致" },
    { name: "资金证明", note: "按申请地规则与个人情况准备" },
    { name: "保险及补充材料", note: "按签证清单显示", conditional: "并非所有申请人均相同" },
  ],
  risks: [
    { title: "Campus France 流程未完成", detail: "适用申请人需先完成相关流程再进入签证递交。" },
    { title: "住宿信息不一致", detail: "表格、证明和实际安排应保持一致。" },
    { title: "递交地判断错误", detail: "当前居住国与合法居留状态会影响申请路径。" },
  ],
  blockers: ["最终录取已确认", "适用的 Campus France 流程已完成", "住宿与资金材料已准备"],
  officialSources: [
    { label: "France-Visas 学生签证", url: "https://france-visas.gouv.fr/en/student" },
    { label: "Études en France", url: "https://www.campusfrance.org/en/application-etudes-en-france-procedure" },
  ],
};
