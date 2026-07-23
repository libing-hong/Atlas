import type { VisaPolicy } from "./types";

export const AU_VISA_POLICY: VisaPolicy = {
  countryCode: "AU",
  countryName: "澳大利亚",
  eyebrow: "AUSTRALIA STUDENT VISA",
  visaType: "Student visa (subclass 500)",
  currentStage: "等待 CoE",
  nextStep: "购买 OSHC",
  submissionLabel: "最早递交",
  submissionTiming: "根据课程日期与官方规则计算",
  costLabel: "预计费用与资金",
  costSummary: "签证费、OSHC 与资金能力要求动态计算",
  lastVerifiedAt: "2026-07-23",
  stages: [
    { id: "accept", title: "接受 Offer 并付款", timing: "决定入读后立即", description: "完成学校要求的接受与付款步骤。" },
    { id: "coe", title: "获得 CoE", timing: "学校确认后", description: "核对课程、日期与学生信息。" },
    { id: "oshc", title: "购买 OSHC", timing: "递签前", description: "保险期限应覆盖适用的学习与停留期间。" },
    { id: "gs", title: "准备 Genuine Student 说明", timing: "递签前", description: "结合个人学习背景与课程选择准备真实陈述。" },
    { id: "health", title: "完成健康及生物识别要求", timing: "收到系统指示后", description: "按申请账户中的要求完成适用项目。" },
    { id: "apply", title: "递交 Student visa", timing: "材料准备完成后", description: "在线递交并持续查看补件及审理信息。" },
  ],
  documents: [
    { name: "有效护照", note: "身份信息与全部申请材料一致" },
    { name: "CoE", note: "课程与开课日期正确" },
    { name: "OSHC 保险", note: "覆盖适用期限" },
    { name: "Genuine Student 说明", note: "基于真实个人与学习情况" },
    { name: "资金能力材料", note: "按申请人情况与官方要求准备", conditional: "显示要求因个人情况而异" },
    { name: "健康检查材料", note: "按系统通知完成", conditional: "根据个人情况判断" },
  ],
  risks: [
    { title: "CoE 信息不一致", detail: "课程或个人信息有误时应先联系学校修改。" },
    { title: "OSHC 覆盖不足", detail: "保险日期需要符合课程和签证要求。" },
    { title: "GS 说明过于模板化", detail: "内容应具体反映个人背景、课程选择和学习计划。" },
  ],
  blockers: ["有效 CoE 已获得", "OSHC 已覆盖适用期间", "Genuine Student 说明与个人资料一致"],
  officialSources: [{ label: "Department of Home Affairs — Student visa", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500" }],
};
