import { servicePricing } from "./service-pricing";

export const SERVICE_CATALOG = {
  planning: { name: "完整申请规划", amount: servicePricing.applicationPlanningReport, unit: "" },
  consultation: { name: "一对一留学规划咨询", amount: servicePricing.advisorConsultation, unit: "次" },
  submission: { name: "单校申请递交", amount: servicePricing.singleSchoolSubmission, unit: "学校" },
  essay: { name: "文书服务", amount: 500, unit: "份" },
  vip: { name: "Atlas VIP 专属文书", amount: servicePricing.singleSchoolSubmission, unit: "月" },
  fullServiceUkAu: { name: "英国／澳洲全流程", amount: servicePricing.fullServiceUkAu, unit: "套餐" },
  fullServiceFrance: { name: "法国商学院全流程", amount: servicePricing.fullServiceFrance, unit: "套餐" },
} as const;
