import type { VisaPolicy } from "./types";

export const GB_VISA_POLICY: VisaPolicy = {
  countryCode: "GB",
  countryName: "英国",
  eyebrow: "UK STUDENT VISA",
  visaType: "Student visa",
  currentStage: "准备签证资金",
  nextStep: "确认 TB 与 ATAS",
  submissionLabel: "最早递交",
  submissionTiming: "开课前 6 个月",
  costLabel: "预计费用与资金",
  costSummary: "按学费、所在地与已付款动态计算",
  lastVerifiedAt: "2026-07-23",
  stages: [
    { id: "offer", title: "满足 Offer 条件", timing: "收到录取后立即", description: "满足录取条件、支付学校要求的押金并进入 CAS 流程。" },
    { id: "funds", title: "准备签证资金", timing: "递签前至少连续 28 天", description: "覆盖第一学年剩余学费与最多 9 个月生活费。" },
    { id: "checks", title: "确认 TB 与 ATAS", timing: "递签前完成", description: "根据居住记录、课程及学校要求判断是否适用。" },
    { id: "cas", title: "获得并核对 CAS", timing: "递签前必须取得", description: "核对身份、课程、日期、学费、付款及批准要求。" },
    { id: "apply", title: "在线递交 Student visa", timing: "最早开课前 6 个月", description: "填写申请、支付签证费与 IHS，并完成身份验证。" },
    { id: "evisa", title: "等待结果并设置 eVisa", timing: "普通申请通常约 3 周", description: "关联入境护照并检查 UKVI Account 中的签证信息。" },
  ],
  documents: [
    { name: "有效护照", note: "姓名和护照号须与 CAS 一致" },
    { name: "CAS", note: "Reference number 与全部信息已核对" },
    { name: "资金证明", note: "完整 28 天记录，材料日期符合要求", conditional: "根据差别化材料规则可能无需初次上传" },
    { name: "TB 检测证明", note: "仅使用指定诊所", conditional: "根据近期居住记录判断" },
    { name: "ATAS 证书", note: "适用课程须在递签前取得", conditional: "根据课程与国籍判断" },
  ],
  risks: [
    { title: "资金持有期不完整", detail: "期间任意一天余额不足，都可能需要重新计算。" },
    { title: "CAS 信息不一致", detail: "身份、课程日期或学费有误时，先联系学校修改。" },
    { title: "遗漏 TB 或 ATAS", detail: "适用要求未完成会阻塞正式递交。" },
  ],
  blockers: ["CAS 已获得且信息正确", "资金金额与持有期合格", "TB 与 ATAS 已完成适用性判断"],
  officialSources: [{ label: "GOV.UK Student visa", url: "https://www.gov.uk/student-visa" }],
};
